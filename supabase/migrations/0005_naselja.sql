-- Kam ve iti — proširenje locations.type za manja naselja (Faza 8, Dan 24)
-- Do sad su `locations` sadržavale samo 3 grada + 22 općine (administrativna
-- sjedišta). Događaj se stvarno može dogoditi u manjem naselju (npr.
-- Hlapičina, dio Grada Mursko Središće) koje dotad nije bilo moguće
-- odabrati. Sami redovi (107 novih naselja) žive u `supabase/seed.sql`,
-- isti obrazac kao postojećih 25 lokacija — ova migracija samo širi CHECK
-- constraint da ih uopće dopusti.

alter table locations drop constraint if exists locations_type_check;
alter table locations add constraint locations_type_check
  check (type in ('grad', 'opcina', 'naselje'));
