-- Kam ve iti — galerija slika po događaju (Faza 8, Dan 74, Prioritet 3 C4)
-- Glavna image_url ostaje "naslovna" slika (liste/OG/kartice); ova tablica
-- drži dodatne fotografije (do 6, provedeno u aplikacijskom sloju, ne ovdje).

create table event_images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index event_images_event_id_idx on event_images (event_id);

alter table event_images enable row level security;

-- Javnost vidi galeriju samo objavljenih događaja — isti duh kao
-- "events_public_read_published" (0001_init_schema.sql).
create policy "event_images_public_read" on event_images
  for select using (
    exists (
      select 1 from events e
      where e.id = event_images.event_id and e.status = 'published'
    )
  );

-- Admin (bilo koji autentificirani korisnik — ADR-007) vidi i uređuje sve.
create policy "event_images_admin_full_access" on event_images
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
