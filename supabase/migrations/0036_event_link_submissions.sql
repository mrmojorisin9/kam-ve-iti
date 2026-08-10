-- Kam denes — "Prijava linkom": posjetitelj pošalje link (npr. Facebook
-- event), admin sam otvori link i ručno prenese podatke u postojeću
-- /admin/dogadjaji/novi formu. Namjerno NE ide izravno u events (ta
-- tablica ima NOT NULL na category_id/location_id/start_at koje link
-- sam po sebi ne daje — placeholder vrijednosti bi nosile rizik da netko
-- slučajno odobri/objavi napola izmišljen redak). Čist "inbox": nema
-- rate-limit triggera (forma ima captchu, ispunjava je čovjek, ne
-- auto-fired tracker na svaki page load kao 0009/0035); nema status
-- stupca ("riješeno" = redak se briše nakon ručnog unosa događaja).

create table event_link_submissions (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  note text,
  submitter_email text,
  submitter_phone text,
  created_at timestamptz not null default now()
);

create index event_link_submissions_created_at_idx
  on event_link_submissions (created_at);

alter table event_link_submissions enable row level security;

create policy "event_link_submissions_public_insert" on event_link_submissions
  for insert
  with check (true);

create policy "event_link_submissions_admin_full_access" on event_link_submissions
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
