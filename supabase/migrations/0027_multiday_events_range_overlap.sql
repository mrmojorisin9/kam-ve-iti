-- Kam denes — višednevni događaji prikazani svaki dan dok traju, ne samo
-- prvog dana (Faza 6-7, korisnikova odluka 2026-08-03). Otkriveno uživo:
-- scraped događaji s dugim rasponom (npr. izložba start 12. lipnja, end
-- 30. kolovoza) su se prije prikazivali SAMO 12. lipnja pa "nestajali" iz
-- dnevnih/raspon prikaza iako su još trajali — obje funkcije su filtrirale
-- isključivo po start_at, ignorirajući end_at.
--
-- Zamjena: umjesto "start_at pada u [dan/raspon]", provjerava se PREKLAPA
-- LI dogadaj s [dan/raspon]: start_at <= kraj prozora I
-- coalesce(end_at, start_at) >= pocetak prozora. coalesce fallback jer
-- end_at nije obavezno polje (jednodnevni dogadaj bez eksplicitnog kraja).
--
-- DROP prije CREATE OR REPLACE: Postgres odbija "cannot change return type
-- of existing function" cim OUT parametar row-type odstupa od postojece
-- definicije u bazi (i kad izgleda identicno u repou — stvarna baza je
-- mjerodavna, ADR-010 pouka). DROP+CREATE unutar iste migracije je
-- sigurno — isto ime/potpis, RPC pozivatelji (Next.js) ne vide razliku.
drop function if exists events_on_date(date);

create or replace function events_on_date(target_date date)
returns table (
  id uuid,
  title text,
  slug text,
  description text,
  venue_name text,
  start_at timestamptz,
  end_at timestamptz,
  image_url text,
  category_name text,
  category_slug text,
  location_name text,
  location_slug text
)
language sql
stable
as $$
  select
    e.id,
    e.title,
    e.slug,
    e.description,
    e.venue_name,
    e.start_at,
    e.end_at,
    e.image_url,
    c.name as category_name,
    c.slug as category_slug,
    l.name as location_name,
    l.slug as location_slug
  from events e
  join categories c on c.id = e.category_id
  join locations l on l.id = e.location_id
  where e.status = 'published'
    and e.start_at < ((target_date + 1)::timestamp at time zone 'Europe/Zagreb')
    and coalesce(e.end_at, e.start_at) >= (target_date::timestamp at time zone 'Europe/Zagreb')
  order by e.start_at asc;
$$;

drop function if exists events_in_range(date, date);

create or replace function events_in_range(range_start date, range_end date)
returns table (
  id uuid,
  title text,
  slug text,
  description text,
  venue_name text,
  start_at timestamptz,
  end_at timestamptz,
  image_url text,
  category_name text,
  category_slug text,
  location_name text,
  location_slug text
)
language sql
stable
as $$
  select
    e.id,
    e.title,
    e.slug,
    e.description,
    e.venue_name,
    e.start_at,
    e.end_at,
    e.image_url,
    c.name as category_name,
    c.slug as category_slug,
    l.name as location_name,
    l.slug as location_slug
  from events e
  join categories c on c.id = e.category_id
  join locations l on l.id = e.location_id
  where e.status = 'published'
    and (e.start_at at time zone 'Europe/Zagreb')::date <= range_end
    and (coalesce(e.end_at, e.start_at) at time zone 'Europe/Zagreb')::date >= range_start
  order by e.start_at asc;
$$;
