-- Kam denes — Generalni sponzor: animirana reklama (Faza 1: baza + admin).
-- Jedan konfiguracijski redak (singleton, id fiksiran na 1) umjesto
-- odvojene "settings" tablice s key/value parovima — polja su poznata i
-- fiksna, singleton red je jednostavniji za čitanje i admin formu.
-- is_active dopušta adminu da ugasi reklamu bez brisanja podataka
-- (npr. između sponzorskih ugovora).

create table general_sponsor (
  id integer primary key default 1,
  is_active boolean not null default false,
  sponsor_name text,
  logo_url text,
  promo_text text,
  link_url text,
  updated_at timestamptz not null default now(),
  constraint general_sponsor_singleton check (id = 1)
);

-- Reciklira set_updated_at() iz 0001_init_schema.sql (već postoji u bazi).
create trigger general_sponsor_set_updated_at
before update on general_sponsor
for each row execute function set_updated_at();

-- Prazan početni redak da admin forma uvijek ima što učitati/ažurirati
-- (UPDATE, nikad INSERT, iz admin akcije).
insert into general_sponsor (id, is_active) values (1, false)
on conflict (id) do nothing;

alter table general_sponsor enable row level security;

-- Javno čitanje (isti obrazac kao categories/locations u
-- 0001_init_schema.sql) — front-end (Faza 2) mora moći dohvatiti postavke
-- bez prijave da prikaže widget.
create policy "general_sponsor_public_read" on general_sponsor
  for select using (true);

-- Admin (bilo koji autentificirani korisnik — isti "authenticated = admin"
-- obrazac kao events_admin_full_access, nema zasebne role tablice).
create policy "general_sponsor_admin_full_access" on general_sponsor
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Storage bucket za logotip sponzora — isti obrazac kao
-- 0004_event_images_bucket.sql, zaseban bucket od event-images (drugi
-- životni ciklus/vlasnik sadržaja).
insert into storage.buckets (id, name, public)
values ('sponsor-assets', 'sponsor-assets', true)
on conflict (id) do nothing;

create policy "sponsor_assets_public_read" on storage.objects
  for select using (bucket_id = 'sponsor-assets');

create policy "sponsor_assets_admin_insert" on storage.objects
  for insert
  with check (bucket_id = 'sponsor-assets' and auth.role() = 'authenticated');

create policy "sponsor_assets_admin_update" on storage.objects
  for update
  using (bucket_id = 'sponsor-assets' and auth.role() = 'authenticated');

create policy "sponsor_assets_admin_delete" on storage.objects
  for delete
  using (bucket_id = 'sponsor-assets' and auth.role() = 'authenticated');
