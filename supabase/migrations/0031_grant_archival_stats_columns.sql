-- Kam denes — ispravak propusta iz 0030 (otkriveno uzivo odmah nakon
-- primjene: "permission denied for table events" na svim javnim rutama).
--
-- Isti obrazac kao 0015/0024/0025: `events` vise nema table-level SELECT
-- za anon, samo column-level (ADR-016 "Ispravak" zamka) — svaki novi javno
-- vidljiv stupac mora biti EKSPLICITNO dodan na grant popis, inace svaki
-- upit koji ga cita (uzivo `events_on_date`/`events_in_range`, koje NISU
-- security definer) puca za citavu tablicu, ne samo za taj stupac. 0030 je
-- dodao 5 novih stupaca (is_archived, archived_at, view_count_cached,
-- popularity_score_cached, is_trending_cached) bez odgovarajuceg granta.
--
-- GRANT SELECT (kolona) je aditivan — nema potrebe za REVOKE prije ovoga.
grant select (
  is_archived, archived_at, view_count_cached, popularity_score_cached,
  is_trending_cached
) on events to anon;
