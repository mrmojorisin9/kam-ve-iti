-- Kam ve iti — događaji na zadani dan (Faza 4, Dan 1: "danas"/"sutra").
--
-- Napomena (Faza 8, priprema za deploy): ova migracija je rekonstruirana iz
-- stvarne definicije u Supabase bazi (pg_get_functiondef('events_on_date')),
-- jer je funkcija u Fazi 4 primijenjena izravno kroz SQL Editor bez da je
-- migracija tada spremljena u repozitorij — vidi CHANGELOG.md i DECISIONS.md
-- ADR-010.
--
-- DST-safe: target_date se pretvara u Europe/Zagreb ponoć na početku/kraju
-- dana (`at time zone`), pa se start_at (timestamptz) uspoređuje s tim
-- rasponom umjesto castanja na datum.

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
    and e.start_at >= (target_date::timestamp at time zone 'Europe/Zagreb')
    and e.start_at < ((target_date + 1)::timestamp at time zone 'Europe/Zagreb')
  order by e.start_at asc;
$$;
