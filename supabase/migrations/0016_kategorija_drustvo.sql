-- Kam denes — nova kategorija "Društvo" (Faza 8, Dan 49).
-- Primijeniti kroz Supabase Dashboard SQL Editor.
-- Vidi DECISIONS.md ADR-017 (dopunjuje ADR-013, 6 -> 7 kategorija).

insert into categories (slug, name, sort_order) values
  ('drustvo', 'Društvo', 7);
