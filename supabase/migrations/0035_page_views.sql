-- Kam denes — interni brojač pregleda/posjetitelja, bez kolačića (ADR-023).
-- Odvojeno od event_interactions (Faza 6-7, ADR-014, koji broji preglede
-- POJEDINOG događaja za popularity score) — ovo broji site-wide promet
-- radi uvida u /admin. visitor_hash je jednosmjeran hash IP+User-Agent+
-- dnevne soli (izračunat u aplikacijskom sloju, vidi src/lib/page-views.ts)
-- — mijenja se svaki dan, ne može se povezati unatrag sa stvarnom osobom
-- niti pratiti kroz dane. Isti append-only, bez identifikacije duh kao
-- 0009_event_interactions.sql.

create table page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  visitor_hash text not null,
  created_at timestamptz not null default now()
);

create index page_views_created_at_idx on page_views (created_at);
create index page_views_visitor_hash_created_at_idx
  on page_views (visitor_hash, created_at);

alter table page_views enable row level security;

-- Javnost smije samo upisivati (anonimno praćenje pregleda), isti obrazac
-- kao event_interactions_public_insert (0009).
create policy "page_views_public_insert" on page_views
  for insert
  with check (true);

create policy "page_views_admin_full_access" on page_views
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Rate-limit po visitor_hash (isti obrazac/razlog kao
-- enforce_event_interaction_rate_limit, 0018, sigurnosni audit
-- 2026-07-21 nalaz #2 — sprječava umjetno naduvavanje brojača
-- skriptiranim ponavljanjem). Velikodušniji prag (100/60s) nego kod
-- event_interactions (20/60s po eventu) jer ovdje isti hash prirodno
-- dijeli i stvaran promet više različitih ljudi (npr. cafe/mobilni NAT
-- s istim IP-om i uobičajenim User-Agentom istog dana). Koristi već
-- postojeći page_views_visitor_hash_created_at_idx iznad.
create or replace function enforce_page_view_rate_limit()
returns trigger
language plpgsql
as $$
declare
  recent_count integer;
begin
  select count(*) into recent_count
  from page_views
  where visitor_hash = new.visitor_hash
    and created_at >= now() - interval '60 seconds';

  if recent_count >= 100 then
    raise exception 'page_views rate limit exceeded for this visitor'
      using errcode = '42901';
  end if;

  return new;
end;
$$;

create trigger page_views_rate_limit
  before insert on page_views
  for each row
  execute function enforce_page_view_rate_limit();

-- Agregacija za admin panel. COUNT DISTINCT nije izravno izloženo kroz
-- supabase-js .select(), zato SQL funkcija umjesto dvije JS strane
-- upita. SECURITY INVOKER (default, bez "security definer") — oslanja
-- se na postojeću "page_views_admin_full_access" RLS politiku, poziva
-- ga isključivo prijavljeni admin.
create or replace function get_today_page_stats(day_start timestamptz)
returns table(views bigint, visitors bigint)
language sql
as $$
  select count(*) as views, count(distinct visitor_hash) as visitors
  from page_views
  where created_at >= day_start;
$$;
