-- Kam ve iti — inicijalna shema baze podataka (Faza 3)
-- Primijeniti kroz Supabase Dashboard SQL Editor ili `supabase db push`.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Status događaja: fiksan skup vrijednosti -> enum (vidi DECISIONS.md ADR-007)
-- ---------------------------------------------------------------------
create type event_status as enum ('draft', 'pending_review', 'published', 'rejected');

-- ---------------------------------------------------------------------
-- Kategorije (ADR-005) — tablica, ne enum, radi buduće fleksibilnosti
-- (ikona/boja/redoslijed) bez migracije sheme.
-- ---------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table categories is '8 fiksnih kategorija za v1, vidi DECISIONS.md ADR-005.';

-- ---------------------------------------------------------------------
-- Lokacije — 3 grada + 22 općine Međimurske županije (ADR-004: cijela
-- županija od starta). Konkretna adresa/dvorana ide u events.venue_name.
-- ---------------------------------------------------------------------
create table locations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  type text not null check (type in ('grad', 'opcina')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Događaji
-- ---------------------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  category_id uuid not null references categories(id),
  location_id uuid not null references locations(id),
  venue_name text,
  start_at timestamptz not null,
  end_at timestamptz,
  organizer_name text,
  organizer_contact text,
  source_url text,
  image_url text,
  status event_status not null default 'pending_review',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint end_after_start check (end_at is null or end_at >= start_at)
);

create index events_start_at_idx on events (start_at);
create index events_category_id_idx on events (category_id);
create index events_location_id_idx on events (location_id);
create index events_status_idx on events (status);

-- auto-update updated_at na svaki UPDATE
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger events_set_updated_at
before update on events
for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table categories enable row level security;
alter table locations enable row level security;
alter table events enable row level security;

-- Kategorije i lokacije: javno čitanje (potrebno za filter UI), pisanje
-- samo preko service role ključa (seed/migracije) — bez admin UI-a za
-- ovo u v1, pa nema smisla otvarati write politiku prije potrebe.
create policy "categories_public_read" on categories
  for select using (true);

create policy "locations_public_read" on locations
  for select using (true);

-- Događaji: javnost vidi samo objavljene; admin (bilo koji autentificirani
-- korisnik — vidi sigurnosnu napomenu u DECISIONS.md ADR-007) vidi i
-- uređuje sve.
create policy "events_public_read_published" on events
  for select using (status = 'published');

create policy "events_admin_full_access" on events
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
