-- Kam denes — praćenje anonimnih interakcija za popularity score.
-- Čisti append-only log (bez identifikacije posjetitelja — nema
-- kolačića/sesije/IP-a, samo agregatni brojevi po događaju/tipu/vremenu).
-- `interaction_type` je text s CHECK-om (ne enum) da dodavanje novog tipa
-- (npr. 'share', 'calendar_add') bude jednolinijska migracija, ne izmjena
-- sheme stupaca — vidi DECISIONS.md za obrazloženje fleksibilnosti.

create table event_interactions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  interaction_type text not null check (interaction_type in ('view')),
  created_at timestamptz not null default now()
);

create index event_interactions_event_id_idx on event_interactions (event_id);
create index event_interactions_created_at_idx on event_interactions (created_at);

alter table event_interactions enable row level security;

-- Javnost smije samo upisivati (anonimno praćenje pregleda) — nema
-- čitanja/izmjene/brisanja za anon. Agregacija za popularity score
-- (Dan 3) radi se preko `security definer` SQL funkcije koja zaobilazi
-- ovu RLS restrikciju s privilegijama vlasnika funkcije, ne izravnim
-- čitanjem ove tablice od strane klijenta.
create policy "event_interactions_public_insert" on event_interactions
  for insert
  with check (true);

-- Admin (isti "authenticated = admin" obrazac kao ADR-007) zadržava puni
-- pristup za eventualni budući uvid/moderaciju.
create policy "event_interactions_admin_full_access" on event_interactions
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
