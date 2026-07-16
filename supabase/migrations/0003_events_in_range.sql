-- Kam ve iti — događaji unutar datumskog raspona (Faza 4, "vikend"/"tjedan").
-- Za razliku od events_on_date (0002, usporedba raspona start_at), ovdje se
-- start_at castа na Europe/Zagreb kalendarski dan jer je raspon (range_start/
-- range_end) već izražen u danima, ne u točnom trenutku — DST se rješava sam.

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
    and (e.start_at at time zone 'Europe/Zagreb')::date >= range_start
    and (e.start_at at time zone 'Europe/Zagreb')::date <= range_end
  order by e.start_at asc;
$$;