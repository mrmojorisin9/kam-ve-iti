-- Kam denes — sigurnosni audit 2026-07-21, nalaz #4 (CONFIRMED live testom:
-- service-role je napravio skriveni pending_review event s lažnim
-- pregledima; anon SELECT na events ispravno vraća prazan niz, ali
-- anon.rpc('event_view_count', {p_event_id: <taj id>}) je vratio stvaran
-- broj pregleda, event_is_trending vratio true, event_popularity_score
-- vratio stvaran broj — sve dok je klijent znao/pogodio UUID).
--
-- event_popularity_score/event_is_trending/event_view_count (0010/0011/0013)
-- su SECURITY DEFINER da bi bypassirali RLS na event_interactions (koja
-- namjerno nema public SELECT, ADR-014) radi javne agregacije unutar
-- events_on_date/events_in_range/top_popular_events. Te pozivateljske
-- funkcije već filtriraju na status='published' PRIJE poziva, pa je interni
-- put oduvijek bio siguran — ali izravan RPC poziv (anon.rpc(...) izravno
-- na Supabase REST API, mimo events_on_date) nikad nije provjeravao da je
-- sam p_event_id uopće status='published'. Ispravljeno dodavanjem exists-
-- provjere unutar svake funkcije — vraća 0/false za bilo koji event koji
-- nije published, bez obzira poziva li se izravno ili preko liste.
--
-- CREATE OR REPLACE (ne DROP+CREATE) jer se potpis/return type ne mijenja.

create or replace function event_popularity_score(p_event_id uuid, p_start_at timestamptz)
returns double precision
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when exists (
        select 1 from events e where e.id = p_event_id and e.status = 'published'
      )
      then
        coalesce(
          (
            select sum(
              power(0.5::float8, extract(epoch from (now() - ei.created_at)) / 86400.0 / 7.0)
            )
            from event_interactions ei
            where ei.event_id = p_event_id
              and ei.interaction_type = 'view'
          ),
          0
        )
        *
        power(
          0.5::float8,
          abs(extract(epoch from (p_start_at - now())) / 86400.0)
          / (case when p_start_at >= now() then 3.0 else 1.0 end)
        )
      else 0
    end;
$$;

create or replace function event_is_trending(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from events e where e.id = p_event_id and e.status = 'published'
    )
    and
    coalesce(
      (
        select count(*) from event_interactions
        where event_id = p_event_id
          and interaction_type = 'view'
          and created_at >= now() - interval '3 days'
      ), 0
    )
    >
    coalesce(
      (
        select count(*) from event_interactions
        where event_id = p_event_id
          and interaction_type = 'view'
          and created_at >= now() - interval '6 days'
          and created_at < now() - interval '3 days'
      ), 0
    );
$$;

create or replace function event_view_count(p_event_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1 from events e where e.id = p_event_id and e.status = 'published'
    )
    then coalesce(
      (
        select count(*)::integer from event_interactions
        where event_id = p_event_id
          and interaction_type = 'view'
      ), 0
    )
    else 0
  end;
$$;
