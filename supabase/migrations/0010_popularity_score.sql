-- Kam denes — popularity score (ADR-014): raspadajući zbroj pregleda
-- (poluživot 7 dana) pomnožen faktorom aktualnosti prema start_at
-- (poluživot 3 dana za nadolazeće događaje, 1 dan za već odvijene, brzo
-- gasi stare/prošle događaje). SECURITY DEFINER na event_popularity_score
-- bypassira RLS na event_interactions (koja nema public SELECT politiku,
-- vidi 0009) jer funkciju izvršava njen vlasnik (postgres iz migracije),
-- ne pozivatelj (anon) — standardni Supabase obrazac za javnu agregaciju
-- bez izlaganja sirovih redaka klijentu.

create function event_popularity_score(p_event_id uuid, p_start_at timestamptz)
returns double precision
language sql
stable
security definer
set search_path = public
as $$
  select
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
    );
$$;

-- events_on_date/events_in_range prošireni s popularity_score — isti
-- DROP+CREATE obrazac kao 0008 (RETURNS TABLE se mijenja).

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
  popularity_score double precision
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
    event_popularity_score(e.id, e.start_at) as popularity_score
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
  popularity_score double precision
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
    event_popularity_score(e.id, e.start_at) as popularity_score
  from events e
  join categories c on c.id = e.category_id
  join locations l on l.id = e.location_id
  where e.status = 'published'
    and (e.start_at at time zone 'Europe/Zagreb')::date >= range_start
    and (e.start_at at time zone 'Europe/Zagreb')::date <= range_end
  order by e.start_at asc;
$$;

-- Nova funkcija za panel "U trendu" na naslovnoj (Dan 5) — nadolazeći
-- objavljeni događaji sortirani po popularity_score, ne po vremenu.
create function top_popular_events(events_limit integer)
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
  popularity_score double precision
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
    event_popularity_score(e.id, e.start_at) as popularity_score
  from events e
  join categories c on c.id = e.category_id
  join locations l on l.id = e.location_id
  where e.status = 'published'
    and e.start_at >= now()
  order by popularity_score desc
  limit events_limit;
$$;
