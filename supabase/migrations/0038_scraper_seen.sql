-- Kam denes — pamćenje već obrađenih scraper zapisa koji NEMAJU vlastiti
-- events redak (otvorena stavka "trošak ponovne ekstrakcije", ADR-020
-- dopuna 2026-08-07; zatvoreno 2026-10-13).
--
-- Problem: content-hash preskakanje (0028) radi samo za zapise koji imaju
-- events redak (hash je u events.source_content_hash). Zapisi koje dedup
-- odbaci kao duplikat DRUGOG izvora, zapisi s neuspjelom Claude
-- ekstrakcijom i zapisi čiji je događaj admin OBRISAO nemaju gdje pohraniti
-- hash — svaki dnevni run ih je ponovno slao Claudeu (trošak), a obrisani
-- događaji su se vraćali kao "novi".
--
-- Ovdje se pamti (source_url → zadnji viđeni hash + ishod). automation/
-- pipeline.py prije Claude poziva preskače zapis ako je isti hash već
-- viđen: 'processed' (događaj postojao pa obrisan) uvijek, 'duplicate'
-- 7 dana, 'extraction_failed' 3 dana (može biti i privremena API greška).
-- Promjena sadržaja na izvoru = novi hash = ponovna obrada.
--
-- Pristup isključivo service_role (scraper) — RLS uključen bez politika,
-- anon/authenticated nemaju nikakav pristup.

create table scraper_seen (
  source_url text primary key,
  content_hash text not null,
  outcome text not null
    check (outcome in ('processed', 'duplicate', 'extraction_failed')),
  seen_at timestamptz not null default now()
);

alter table scraper_seen enable row level security;
