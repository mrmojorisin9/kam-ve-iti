-- Kam denes — arhiviranje isteklih dogadaja (soft delete + data stripping)
-- umjesto trajnog brisanja, plus cache stupci za brojac pregleda/trending/
-- popularnost (korisnikov zahtjev, Faza 8, Dan 82+). Jedna migracija jer su
-- oba dijela medjusobno ovisna: arhiviranje mora upisati zadnji snimak
-- brojaca prije zamrzavanja, a osvjezavanje cachea mora znati preskociti
-- arhivirane retke.
--
-- Problem koji se rjesava: `delete_expired_events()` (0026) trajno brise
-- svaki dogadaj 3 dana nakon efektivnog zavrsetka — svaki takav URL koji je
-- Google vec indeksirao pocinje vracati 404, sto s vremenom steti SEO
-- autoritetu. Paralelno, `events_on_date`/`events_in_range` (0013) na
-- SVAKOM ucitavanju liste uzivo pozivaju tri SECURITY DEFINER funkcije po
-- retku (event_popularity_score/event_is_trending/event_view_count) — to je
-- stvarno usko grlo pri rastu prometa, ne sam upis pregleda (vec jeftin
-- append-only INSERT u event_interactions, ne UPDATE).
--
-- Redis/in-memory cache za brojac je razmotren i ODBACEN (korisnikova
-- odluka nakon objasnjenja): Redis je projekt vec jednom eksplicitno
-- odbio (ADR-018, isti razlog — izbjegavanje nove infrastrukture bez
-- dokazane potrebe), a in-memory cache ne radi pouzdano na Vercel
-- serverless instancama (nema dijeljene memorije izmedju instanci). Umjesto
-- toga: isti pg_cron obrazac koji vec postoji u ovom repou (0026) — cache
-- stupci na `events` osvjezavani batch UPDATE-om svakih 15 min.
--
-- Primijeniti kroz Supabase Dashboard SQL Editor (isti obrazac kao 0026/0029).

-- ---------------------------------------------------------------------
-- 1. Novi stupci
-- ---------------------------------------------------------------------

alter table events
  add column is_archived boolean not null default false,
  add column archived_at timestamptz,
  add column view_count_cached integer not null default 0,
  add column popularity_score_cached double precision not null default 0,
  add column is_trending_cached boolean not null default false;

-- ---------------------------------------------------------------------
-- 2. refresh_event_stats() — batch osvjezavanje cache stupaca, svakih
--    15 min preko pg_cron. Ponovo koristi postojece event_view_count/
--    event_popularity_score/event_is_trending (0010/0011/0013/0017) —
--    one ostaju netaknute, samo se sad pozivaju iz jednog batch posla
--    umjesto uzivo po svakom HTTP zahtjevu.
-- ---------------------------------------------------------------------

create or replace function refresh_event_stats()
returns void
language plpgsql
as $$
begin
  update events
  set
    view_count_cached = event_view_count(id),
    popularity_score_cached = event_popularity_score(id, start_at),
    is_trending_cached = event_is_trending(id)
  where status = 'published'
    and not is_archived;
end;
$$;

comment on function refresh_event_stats() is
  'Batch osvjezava view_count_cached/popularity_score_cached/'
  'is_trending_cached za sve objavljene, ne-arhivirane dogadaje. Poziva ga '
  'pg_cron job "refresh-event-stats" svakih 15 min. Arhivirani dogadaji su '
  'namjerno izvan WHERE-a — njihov brojac ostaje zamrznut na vrijednosti '
  'snimljenoj u trenutku arhiviranja (vidi archive_expired_events).';

-- ---------------------------------------------------------------------
-- 3. archive_expired_events() — zamjenjuje delete_expired_events() (0026).
--    Umjesto DELETE, jedan UPDATE: postavlja is_archived/archived_at,
--    brise teska/osobna polja, upisuje zadnji snimak brojaca prije
--    zamrzavanja. title/slug/start_at/end_at/category_id/location_id/
--    venue_name namjerno OSTAJU (minimalni SEO skup + potrebni za
--    preporuku slicnih aktivnih dogadaja na arhiviranoj stranici).
-- ---------------------------------------------------------------------

drop function if exists delete_expired_events();

create or replace function archive_expired_events()
returns void
language plpgsql
as $$
declare
  archived_ids uuid[];
begin
  with newly_archived as (
    update events
    set
      is_archived = true,
      archived_at = now(),
      description = null,
      image_url = null,
      organizer_name = null,
      organizer_contact = null,
      source_url = null,
      submitter_email = null,
      submitter_phone = null,
      sponsored_until = null,
      is_admin_featured = false,
      view_count_cached = event_view_count(id),
      popularity_score_cached = event_popularity_score(id, start_at),
      is_trending_cached = event_is_trending(id)
    where coalesce(end_at, start_at) < now() - interval '3 days'
      and not is_archived
    returning id
  )
  select array_agg(id) into archived_ids from newly_archived;

  if archived_ids is not null then
    delete from event_images where event_id = any(archived_ids);
  end if;
end;
$$;

comment on function archive_expired_events() is
  'Arhivira (soft delete + data stripping) dogadaje ciji je efektivni '
  'zavrsetak (end_at, ili start_at ako end_at nije postavljen) prosao prije '
  'vise od 3 dana — umjesto trajnog brisanja (bivsi delete_expired_events, '
  '0026), zadrzava slug/naslov/datum/lokaciju radi SEO-a (vec indeksirani '
  'URL-ovi ostaju 200 OK). Brise pripadajuce event_images retke za upravo '
  'arhivirane dogadaje. Poziva ga pg_cron job "archive-expired-events" '
  'dnevno. Poznato ogranicenje (isto kao 0026): Storage datoteke '
  '(event-images bucket) se ne cisti odavde — plpgsql ne moze pozvati '
  'Storage API, cleanup helperi za to postoje samo u TypeScriptu.';

-- ---------------------------------------------------------------------
-- 4. pg_cron raspored — ukloni stari 'delete-expired-events' posao,
--    dodaj nova dva ('cron.schedule' je idempotentan po job_name; za
--    unschedule treba eksplicitna provjera postojanja da ponovno
--    pokretanje ove migracije ne baci gresku ako je posao vec uklonjen).
-- ---------------------------------------------------------------------

do $$
begin
  if exists (select 1 from cron.job where jobname = 'delete-expired-events') then
    perform cron.unschedule('delete-expired-events');
  end if;
end $$;

select cron.schedule(
  'archive-expired-events',
  '0 3 * * *', -- 03:00 UTC dnevno, isti raspored kao bivsi delete-expired-events
  $$select archive_expired_events();$$
);

select cron.schedule(
  'refresh-event-stats',
  '*/15 * * * *', -- svakih 15 min
  $$select refresh_event_stats();$$
);

-- ---------------------------------------------------------------------
-- 5. events_on_date/events_in_range (0002/0003/0010/0011/0013 povijest) —
--    citaju cache stupce umjesto uzivo poziva tri funkcije, plus
--    "and not e.is_archived" (obrana u dubinu, arhivirani su svakako
--    izvan svakog datumskog raspona po definiciji).
--
--    KRITICNO: popis vracenih stupaca je preslikan TOCNO iz 0013 (zadnja
--    poznato-ispravna definicija) prije izmjene retka koji cita cache —
--    ovo je tocno vrsta izmjene (DROP+CREATE cijele funkcije) koja je
--    uzrokovala produkcijski bug u migraciji 0027 (izgubljeni stupci,
--    popravljeno u 0029, vidi CHANGELOG "Faza 8, Dan 80"/DECISIONS.md
--    ADR-021 dopuna). Bilo koja buduca izmjena ovih funkcija MORA
--    ponovno provjeriti puni popis stupaca protiv ove definicije.
-- ---------------------------------------------------------------------

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
    e.popularity_score_cached as popularity_score,
    e.is_trending_cached as is_trending,
    e.view_count_cached as view_count
  from events e
  join categories c on c.id = e.category_id
  join locations l on l.id = e.location_id
  where e.status = 'published'
    and not e.is_archived
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
    e.popularity_score_cached as popularity_score,
    e.is_trending_cached as is_trending,
    e.view_count_cached as view_count
  from events e
  join categories c on c.id = e.category_id
  join locations l on l.id = e.location_id
  where e.status = 'published'
    and not e.is_archived
    and (e.start_at at time zone 'Europe/Zagreb')::date >= range_start
    and (e.start_at at time zone 'Europe/Zagreb')::date <= range_end
  order by e.start_at asc;
$$;

-- ---------------------------------------------------------------------
-- 6. RLS obrana u dubinu — brojac pregleda na arhiviranim stranicama se
--    ne moze puniti ni izravnim RPC pozivom mimo UI-ja (frontend vec
--    izostavlja <ViewTracker> za arhivirane, ovo je backstop).
-- ---------------------------------------------------------------------

drop policy if exists "event_interactions_public_insert" on event_interactions;

create policy "event_interactions_public_insert" on event_interactions
  for insert
  with check (
    exists (
      select 1 from events e
      where e.id = event_id and not e.is_archived
    )
  );
