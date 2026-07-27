-- Kam denes — sponzorirani događaj, naslovni panel (Faza 8, Dan 76,
-- Monetizacija dio 1). Jedno self-expiring polje umjesto boolean+datum para:
-- prazno/prošlo = nije sponzorirano, budući datum = aktivno do tog trenutka.
-- Ručni admin toggle (ADR-002 human-in-the-loop) — bez online naplate.

alter table events add column sponsored_until timestamptz;

-- Vidi ADR-016/0015_fix_events_column_privileges.sql: anon više NE nasljeđuje
-- automatski SELECT na nove stupce events tablice, svaki novi stupac treba
-- eksplicitan grant da bude javno čitljiv.
grant select (sponsored_until) on events to anon;
