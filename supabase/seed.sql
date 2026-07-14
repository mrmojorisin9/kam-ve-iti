-- Kam ve iti — početni podaci: kategorije i lokacije.
-- Pokreće se automatski kod `supabase db reset` (lokalno), ili ručno
-- zalijepiti u Supabase Dashboard SQL Editor nakon migracije.

insert into categories (slug, name, sort_order) values
  ('kultura', 'Kultura', 1),
  ('glazba-i-koncerti', 'Glazba i koncerti', 2),
  ('sport-i-rekreacija', 'Sport i rekreacija', 3),
  ('manifestacije-i-feste', 'Manifestacije i fešte', 4),
  ('obitelj-i-djeca', 'Obitelj i djeca', 5),
  ('edukacija-i-radionice', 'Edukacija i radionice', 6),
  ('gastronomija-i-vino', 'Gastronomija i vino', 7),
  ('ostalo', 'Ostalo', 8);

-- 3 grada
insert into locations (slug, name, type) values
  ('cakovec', 'Čakovec', 'grad'),
  ('mursko-sredisce', 'Mursko Središće', 'grad'),
  ('prelog', 'Prelog', 'grad');

-- 22 općine
insert into locations (slug, name, type) values
  ('belica', 'Belica', 'opcina'),
  ('dekanovec', 'Dekanovec', 'opcina'),
  ('domasinec', 'Domašinec', 'opcina'),
  ('donja-dubrava', 'Donja Dubrava', 'opcina'),
  ('donji-kraljevec', 'Donji Kraljevec', 'opcina'),
  ('donji-vidovec', 'Donji Vidovec', 'opcina'),
  ('gorican', 'Goričan', 'opcina'),
  ('gornji-mihaljevec', 'Gornji Mihaljevec', 'opcina'),
  ('kotoriba', 'Kotoriba', 'opcina'),
  ('mala-subotica', 'Mala Subotica', 'opcina'),
  ('nedelisce', 'Nedelišće', 'opcina'),
  ('orehovica', 'Orehovica', 'opcina'),
  ('podturen', 'Podturen', 'opcina'),
  ('pribislavec', 'Pribislavec', 'opcina'),
  ('selnica', 'Selnica', 'opcina'),
  ('strahoninec', 'Strahoninec', 'opcina'),
  ('sveta-marija', 'Sveta Marija', 'opcina'),
  ('sveti-juraj-na-bregu', 'Sveti Juraj na Bregu', 'opcina'),
  ('sveti-martin-na-muri', 'Sveti Martin na Muri', 'opcina'),
  ('senkovec', 'Šenkovec', 'opcina'),
  ('strigova', 'Štrigova', 'opcina'),
  ('vratisinec', 'Vratišinec', 'opcina');
