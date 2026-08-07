-- Kam denes — ispravak regresije iz 0027: events_on_date/events_in_range
-- su DROP+CREATE-ane radi visednevnog preklapanja (ADR-021 dopuna), ali
-- novi RETURNS TABLE popis stupaca slucajno nije prenio sve stupce koje
-- su funkcije imale od 0010/0011/0013 (is_free/is_family_friendly/
-- is_dog_friendly/is_solo_friendly/is_romantic/is_hidden_gem/pace/
-- popularity_score/is_trending/view_count) — DROP+CREATE zamijenio je
-- CIJELU definiciju umjesto da doda samo where-klauzulu, pa je "stari"
-- puni popis stupaca tiho nestao. Otkriveno uzivo 2026-08-07: korisnik
-- prijavio da su broj klikova i "U trendu"/"Najpopularnije" oznake
-- nestale s prikaza dogadaja (src/lib/events.ts computePopularityBadges
-- filtrira sve dogadaje bez popularity_score, a EventRow.tsx renderira
-- broj pregleda samo kad je view_count broj — oboje su bili undefined
-- otkad su nestali iz RPC izlaza). Isti bug je tiho slomio i pametne
-- filtre (Besplatno/Obitelj/itd., src/lib/events.ts filterEventsBySmart-
-- Tags) jer su is_free i ostali booleani takoder nedostajali.
--
-- Ovaj popravak vraca puni popis stupaca (identican 0013, zadnjoj
-- potpunoj verziji prije 0027) UZ zadrzanu where-klauzulu iz 0027
-- (preklapanje umjesto "start_at pada u prozor").
drop function if exists events_on_date(date);

create function events_on_date(target_date date)
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
  location_slug text,
  is_free boolean,
  is_family_friendly boolean,
  is_dog_friendly boolean,
  is_solo_friendly boolean,
  is_romantic boolean,
  is_hidden_gem boolean,
  pace text,
  popularity_score double precision,
  is_trending boolean,
  view_count integer
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
    l.slug as location_slug,
    e.is_free,
    e.is_family_friendly,
    e.is_dog_friendly,
    e.is_solo_friendly,
    e.is_romantic,
    e.is_hidden_gem,
    e.pace,
    event_popularity_score(e.id, e.start_at) as popularity_score,
    event_is_trending(e.id) as is_trending,
    event_view_count(e.id) as view_count
  from events e
  join categories c on c.id = e.category_id
  join locations l on l.id = e.location_id
  where e.status = 'published'
    and e.start_at < ((target_date + 1)::timestamp at time zone 'Europe/Zagreb')
    and coalesce(e.end_at, e.start_at) >= (target_date::timestamp at time zone 'Europe/Zagreb')
  order by e.start_at asc;
$$;

drop function if exists events_in_range(date, date);

create function events_in_range(range_start date, range_end date)
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
  location_slug text,
  is_free boolean,
  is_family_friendly boolean,
  is_dog_friendly boolean,
  is_solo_friendly boolean,
  is_romantic boolean,
  is_hidden_gem boolean,
  pace text,
  popularity_score double precision,
  is_trending boolean,
  view_count integer
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
    l.slug as location_slug,
    e.is_free,
    e.is_family_friendly,
    e.is_dog_friendly,
    e.is_solo_friendly,
    e.is_romantic,
    e.is_hidden_gem,
    e.pace,
    event_popularity_score(e.id, e.start_at) as popularity_score,
    event_is_trending(e.id) as is_trending,
    event_view_count(e.id) as view_count
  from events e
  join categories c on c.id = e.category_id
  join locations l on l.id = e.location_id
  where e.status = 'published'
    and (e.start_at at time zone 'Europe/Zagreb')::date <= range_end
    and (coalesce(e.end_at, e.start_at) at time zone 'Europe/Zagreb')::date >= range_start
  order by e.start_at asc;
$$;
