-- Kam ve iti — Storage bucket za fotografije događaja (Faza 8, Dan 22)
-- Omogućuje upload slike s računala u admin formi, uz postojeći URL unos
-- (image_url ostaje isti tekstualni stupac, samo dobiva drugi izvor vrijednosti).

insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do nothing;

-- Javno čitanje (slike se prikazuju svima na javnom portalu).
create policy "event_images_public_read" on storage.objects
  for select using (bucket_id = 'event-images');

-- Upload/izmjena/brisanje samo za prijavljene korisnike — isti
-- "authenticated = admin" obrazac kao events_admin_full_access (ADR-007,
-- vidi 0001_init_schema.sql), jer nema javne registracije.
create policy "event_images_admin_insert" on storage.objects
  for insert
  with check (bucket_id = 'event-images' and auth.role() = 'authenticated');

create policy "event_images_admin_update" on storage.objects
  for update
  using (bucket_id = 'event-images' and auth.role() = 'authenticated');

create policy "event_images_admin_delete" on storage.objects
  for delete
  using (bucket_id = 'event-images' and auth.role() = 'authenticated');
