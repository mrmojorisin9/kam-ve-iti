-- Kam denes — rjesava dio "sticky admin edits" propusta ostavljenog
-- namjerno otvorenim u ADR-020 dopuni (2026-08-07, "re-scrape ne smije
-- prepisati rucne admin izmjene", vidi DECISIONS.md). Prijasnji popravak
-- (automation/db.py update_event_by_source_url) stiti samo od None
-- vrijednosti sa scrapera — ako scraper vrati NEKU (ne-None, ali
-- drugaciju) vrijednost za polje koje je admin rucno ispravio (npr.
-- pogresnu kategoriju), re-scrape ga je i dalje tiho prepisivao.
--
-- Rjesenje (po vec predlozenom smjeru u ADR-020 dopuni): novi stupac
-- prati TOCNO koja polja je admin rucno uredio (ne cijeli redak) —
-- `applyEventFormUpdate` (src/lib/admin-events.ts) upisuje imena polja
-- koja su se stvarno promijenila pri svakom admin spremanju,
-- `update_event_by_source_url` (automation/db.py) preskace upravo ta
-- polja pri re-scrapeu, bez obzira daje li scraper None ili stvarnu
-- vrijednost. Jednom zakljucano polje ostaje zakljucano (nema automatskog
-- otkljucavanja) — jednostavan, siguran default; rucno otkljucavanje
-- ostaje otvoreno za buducu sesiju ako se pokaze potrebnim.
alter table events
  add column admin_edited_fields text[] not null default '{}';

comment on column events.admin_edited_fields is
  'Imena stupaca koje je admin rucno izmijenio kroz /uredi ili alat za '
  'spajanje duplikata (vidi applyEventFormUpdate) — automation/db.py '
  'update_event_by_source_url ih preskace pri re-scrapeu, cak i kad '
  'scraper vrati ne-None vrijednost. Samo raste (nikad se ne uklanja '
  'automatski).';
