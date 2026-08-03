-- Kam denes — automatsko brisanje isteklih dogadaja (Faza 6-7, korisnikova
-- odluka 2026-08-03). Dogadaj se smatra "isteklim" 3 dana nakon efektivnog
-- zavrsetka: coalesce(end_at, start_at) — ako dogadaj nema end_at (nije
-- obavezno polje), koristi se start_at kao zavrsetak. Primjenjuje se na SVE
-- statuse (published/pending_review/draft/rejected) — korisnikova izricita
-- odluka ("svi dogadaji koji su istekli, prosli i zavrsili"), ne samo
-- objavljeni.
--
-- Primijeniti kroz Supabase Dashboard SQL Editor. Ako `create extension
-- pg_cron` ovdje ne uspije, prvo ga rucno ukljuciti (Database -> Extensions
-- -> pg_cron) pa ponovno pokrenuti ovu migraciju.
create extension if not exists pg_cron with schema extensions;

create or replace function delete_expired_events()
returns void
language plpgsql
as $$
begin
  delete from events
  where coalesce(end_at, start_at) < now() - interval '3 days';
end;
$$;

comment on function delete_expired_events() is
  'Brise dogadaje ciji je efektivni zavrsetak (end_at, ili start_at ako '
  'end_at nije postavljen) prosao prije vise od 3 dana. Poziva ga pg_cron '
  'job "delete-expired-events" dnevno. Napomena: event_interactions/ '
  'event_images retci se brisu automatski (on delete cascade, 0009/0021), '
  'ali pripadajuce Storage datoteke (event-images bucket) NE — postaju '
  'osirotjele. Poznato ogranicenje (isto kao da nema Storage cleanup ovdje '
  '— za razliku od rucnog admin brisanja koje poziva '
  'deleteEventImageIfOrphaned/deleteEventGalleryImages u TypeScriptu, ne '
  'iz SQL-a).';

-- cron.schedule je idempotentan po job_name — ponovno pokretanje ove
-- migracije samo azurira postojeci raspored, ne stvara duplikat.
select cron.schedule(
  'delete-expired-events',
  '0 3 * * *', -- 03:00 UTC dnevno (pg_cron radi u UTC, izvan prometnih sati)
  $$select delete_expired_events();$$
);
