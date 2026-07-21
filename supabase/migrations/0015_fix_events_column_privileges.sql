-- Kam denes — ispravak column-level zaštite iz 0014 (Faza 8, Dan 44).
-- Primijeniti kroz Supabase Dashboard SQL Editor.
--
-- Uživo testirano (service-role + anon skripta) da `revoke select
-- (submitter_email, submitter_phone) on events from anon;` iz 0014 NEMA
-- efekta: anon je i dalje mogao pročitati obje kolone na objavljenom
-- događaju. Uzrok je poznata Postgres zamka — anon već ima SELECT na
-- RAZINI CIJELE TABLICE (Supabase ga dodjeljuje automatski, `grant all
-- on events to anon` pri kreiranju tablice), a column-level REVOKE ne
-- može oduzeti pristup koji dolazi kroz širi table-level grant. Ispravan
-- obrazac: prvo ukloniti table-level SELECT, pa eksplicitno dodijeliti
-- SELECT samo na dopuštene kolone (sve osim submitter_email/submitter_phone).

revoke select on events from anon;

grant select (
  id, title, slug, description, category_id, location_id, venue_name,
  start_at, end_at, organizer_name, organizer_contact, source_url,
  image_url, status, created_by, created_at, updated_at,
  is_free, is_family_friendly, is_dog_friendly, is_solo_friendly,
  is_romantic, is_hidden_gem, pace, is_admin_featured
) on events to anon;

-- Napomena: svaki BUDUĆI novi stupac na `events` treba biti eksplicitno
-- dodan u ovaj popis (ili u zaseban budući GRANT) da bude javno čitljiv —
-- za razliku od table-level grant obrasca koji je vrijedio do sada, novi
-- stupci VIŠE NE nasljeđuju automatski SELECT za anon.
