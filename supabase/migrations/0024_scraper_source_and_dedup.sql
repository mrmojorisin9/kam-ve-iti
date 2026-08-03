-- Kam denes — Faza 6-7, Dan 1: temelj za automatizirano prikupljanje
-- dogadaja (DECISIONS.md ADR-020). Primijeniti kroz Supabase Dashboard
-- SQL Editor ili `supabase db push`.
--
-- source_name: naziv izvora (npr. 'emedjimurje') za scraped dogadaje.
-- NULL za sve postojece admin/CSV/javno-prijavljene dogadaje. Sluzi za
-- prikaz "izvor" badgea u admin queueu (vidi src/lib/admin-events.ts).
alter table events add column source_name text;

-- Unique constraint na source_url sprjecava dvostruki insert ISTOG
-- scraped dogadaja (re-scrape iste stranice treba postati upsert u
-- automation/db.py, ne novi red). `CREATE UNIQUE INDEX` sam po sebi puca
-- ako vec postoje duplicirane vrijednosti u produkciji — nema potrebe za
-- odvojenom provjerom prije, Postgres to native garantira (isti ishod kao
-- rucna provjera iz ADR-013, samo ugraden u sam DDL poziv).
create unique index events_source_url_unique on events (source_url)
  where source_url is not null;

-- Column-level grant za anon (ADR-016 "Ispravak" zamka, 0015): tablica vise
-- NE dodjeljuje SELECT novim stupcima automatski otkad je table-level
-- grant uklonjen — svaki novi javno-vidljiv stupac mora biti eksplicitno
-- dodan ovdje. source_name je bezopasan metapodatak (koji je portal izvor),
-- tretiran isto kao vec javni source_url.
revoke select on events from anon;

grant select (
  id, title, slug, description, category_id, location_id, venue_name,
  start_at, end_at, organizer_name, organizer_contact, source_url,
  source_name, image_url, status, created_by, created_at, updated_at,
  is_free, is_family_friendly, is_dog_friendly, is_solo_friendly,
  is_romantic, is_hidden_gem, pace, is_admin_featured
) on events to anon;

-- Napomena (vidi ADR-020): automatizirani (scraper) insert u events MORA
-- postaviti created_by na dedicated "scraper" service-account UUID, NIKAD
-- NULL. `enforce_public_submission_rate_limit` trigger (0020) broji SVAKI
-- insert (ne samo anon rolu) gdje je `status = 'pending_review' AND
-- created_by IS NULL` prema globalnom pragu 5/10min namijenjenom javnoj
-- prijavi (ADR-016) — scraper insert s created_by = NULL bi dijelio taj
-- isti budzet i mogao bi biti odbijen nakon svega 5 upisa po pokretanju.
-- Postavljanjem created_by na scraper UUID (ne NULL) uvjet trigera vise ne
-- vrijedi, bez ikakve izmjene postojece migracije/trigera.
