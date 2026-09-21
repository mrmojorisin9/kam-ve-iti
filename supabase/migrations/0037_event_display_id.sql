-- Kam denes — sekvencijalni, javno skriveni "ID" broj po događaju
-- (korisnikov zahtjev, 2026-09-21). Primijeniti kroz Supabase Dashboard
-- SQL Editor (isti obrazac kao sve dosadašnje DDL migracije).
--
-- NE zamjenjuje stvarni primarni ključ (`id`, uuid) — taj ostaje posvuda u
-- shemi/RLS/kodu nepromijenjen (FK-ovi, slug-lookup, admin edit/delete...).
-- `display_id` je čisto ljudski čitljiva referenca (1, 2, 3...) za admina:
-- CSV izvoz/uvoz, admin popis (sortiranje), admin edit forma.
--
-- Namjerno bez GRANT SELECT za anon (isti "novi stupac je privatan dok se
-- eksplicitno ne doda na popis" obrazac kao submitter_email/submitter_phone,
-- ADR-016, i sponsored_until/arhivski cache stupci, 0022/0025/0031) —
-- stupac tako ostaje nevidljiv javnosti bez ikakvog dodatnog RLS/revoke
-- koraka. VAŽNO (poznata zamka, vidi 0031 komentar): ovo je sigurno SAMO
-- dok javne SQL funkcije/upiti (events_on_date, events_in_range,
-- getEventBySlug...) NIKAD ne selektiraju `display_id` — čim bi ga neka
-- javna, ne-SECURITY-DEFINER funkcija selektirala bez granta, cijeli upit
-- puca za anon (permission denied), ne samo taj stupac. Ne dirati te
-- funkcije radi ovog stupca.

alter table events add column display_id integer;

-- Backfill postojećih redaka, kronološkim redoslijedom unosa (created_at)
-- — prvi ikad uneseni događaj dobiva #1.
with numbered as (
  select id, row_number() over (order by created_at asc) as rn
  from events
)
update events e
set display_id = numbered.rn
from numbered
where numbered.id = e.id;

alter table events alter column display_id set not null;
alter table events add constraint events_display_id_key unique (display_id);

-- Sekvenca preuzima od najvišeg dodijeljenog broja — svaki BUDUĆI insert
-- (admin ručni unos, CSV uvoz, Python scraper preko service-role) automatski
-- dobiva sljedeći broj kroz DEFAULT, bez ikakve izmjene TS/Python koda na
-- strani unosa.
create sequence if not exists events_display_id_seq;
select setval(
  'events_display_id_seq',
  coalesce((select max(display_id) from events), 0),
  true
);
alter table events alter column display_id set default nextval('events_display_id_seq');
alter sequence events_display_id_seq owned by events.display_id;

comment on column events.display_id is
  'Sekvencijalni broj (1, 2, 3...) za ljudsku referencu - CSV izvoz/uvoz, '
  'admin popis (sortiranje), admin edit forma. Auto-dodijeljen DEFAULT '
  'nextval-om, TS/Python insert pozivi ga ne postavljaju. Namjerno bez '
  'anon SELECT granta (privatan). Nije primarni kljuc/FK - to ostaje `id` '
  '(uuid) posvuda drugdje.';
