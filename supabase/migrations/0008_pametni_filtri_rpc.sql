-- Kam denes — proširenje events_on_date/events_in_range sa 7 pametnih
-- filtera (Razina 3), dodanih events tablici u 0007_pametni_filtri.sql.
-- RETURNS TABLE se mijenja (novi stupci) pa CREATE OR REPLACE nije dovoljan
-- (Postgres ne dopušta promjenu povratnog tipa postojeće funkcije) —
-- potrebno je prvo dropati funkciju.

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
  pace text
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
    e.pace
  from events e
  join categories c on c.id = e.category_id
  join locations l on l.id = e.location_id
  where e.status = 'published'
    and e.start_at >= (target_date::timestamp at time zone 'Europe/Zagreb')
    and e.start_at < ((target_date + 1)::timestamp at time zone 'Europe/Zagreb')
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
  pace text
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
    e.pace
  from events e
  join categories c on c.id = e.category_id
  join locations l on l.id = e.location_id
  where e.status = 'published'
    and (e.start_at at time zone 'Europe/Zagreb')::date >= range_start
    and (e.start_at at time zone 'Europe/Zagreb')::date <= range_end
  order by e.start_at asc;
$$;
