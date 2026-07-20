-- Kam denes — diskretni brojač pregleda po događaju (korisnikov zahtjev),
-- odvojeno od popularity_score (koji je raspadajući, ne sirovi zbroj).
-- Isti security definer obrazac kao event_popularity_score/event_is_trending
-- (0010/0011) — bypassira RLS na event_interactions.

create function event_view_count(p_event_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select count(*)::integer from event_interactions
      where event_id = p_event_id
        and interaction_type = 'view'
    ), 0
  );
$$;

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
    and (e.start_at at time zone 'Europe/Zagreb')::date >= range_start
    and (e.start_at at time zone 'Europe/Zagreb')::date <= range_end
  order by e.start_at asc;
$$;
