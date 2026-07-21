-- Kam ve iti — početni podaci: kategorije i lokacije.
-- Pokreće se automatski kod `supabase db reset` (lokalno), ili ručno
-- zalijepiti u Supabase Dashboard SQL Editor nakon migracije.

-- 7 kategorija (ADR-013, zamjenjuje ADR-005 s 8 kategorija; ADR-017 dodaje
-- "Društvo") — slugovi ostaju nepromijenjeni gdje je kategorija konceptualno
-- ista, vidi 0006_kategorije_v2.sql i 0016_kategorija_drustvo.sql.
insert into categories (slug, name, sort_order) values
  ('glazba-i-koncerti', 'Glazba & Party', 1),
  ('kultura', 'Kultura & Kazalište', 2),
  ('sport-i-rekreacija', 'Sport & Rekreacija', 3),
  ('gastronomija-i-vino', 'Gastro & Wine', 4),
  ('edukacija-i-radionice', 'Edukacija & Radionice', 5),
  ('manifestacije-i-feste', 'Velike Manifestacije', 6),
  ('drustvo', 'Društvo', 7);

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

-- 107 naselja (Faza 8, Dan 24) — izvor: medjimurska-zupanija.hr/gradovi-i-opcine-u-mz
-- (zbroj 3 grada + 22 općine + ovih 107 = 131 naselje ukupno, slaže se s
-- nezavisnom statistikom županije). Zahtijeva 0005_naselja.sql migraciju
-- (proširen locations_type_check da dopusti 'naselje').

-- Grad Čakovec (13, bez samog Čakovca)
insert into locations (slug, name, type) values
  ('ivanovec', 'Ivanovec', 'naselje'),
  ('kristanovec', 'Krištanovec', 'naselje'),
  ('kursanec', 'Kuršanec', 'naselje'),
  ('mackovec', 'Mačkovec', 'naselje'),
  ('mihovljan', 'Mihovljan', 'naselje'),
  ('novo-selo-na-dravi', 'Novo Selo na Dravi', 'naselje'),
  ('novo-selo-rok', 'Novo Selo Rok', 'naselje'),
  ('savska-ves', 'Savska Ves', 'naselje'),
  ('slemenice', 'Slemenice', 'naselje'),
  ('sandorovec', 'Šandorovec', 'naselje'),
  ('stefanec', 'Štefanec', 'naselje'),
  ('totovec', 'Totovec', 'naselje'),
  ('ziskovec', 'Žiškovec', 'naselje');

-- Grad Mursko Središće (4, bez samog Mursko Središće)
insert into locations (slug, name, type) values
  ('hlapicina', 'Hlapičina', 'naselje'),
  ('krizovec', 'Križovec', 'naselje'),
  ('peklenica', 'Peklenica', 'naselje'),
  ('strukovec', 'Štrukovec', 'naselje');

-- Grad Prelog (7, bez samog Preloga)
insert into locations (slug, name, type) values
  ('cirkovljan', 'Cirkovljan', 'naselje'),
  ('cehovec', 'Čehovec', 'naselje'),
  ('cukovec', 'Čukovec', 'naselje'),
  ('draskovec', 'Draškovec', 'naselje'),
  ('hemusevec', 'Hemuševec', 'naselje'),
  ('oporovec', 'Oporovec', 'naselje'),
  ('otok', 'Otok', 'naselje');

-- Općina Belica (1, bez same Belice)
insert into locations (slug, name, type) values
  ('gardinovec', 'Gardinovec', 'naselje');

-- Općina Domašinec (1, bez samog Domašinca)
insert into locations (slug, name, type) values
  ('turcisce', 'Turčišće', 'naselje');

-- Općina Donji Kraljevec (5, bez samog Donjeg Kraljevca)
insert into locations (slug, name, type) values
  ('donji-hrascan', 'Donji Hrašćan', 'naselje'),
  ('donji-pustakovec', 'Donji Pustakovec', 'naselje'),
  ('hodosan', 'Hodošan', 'naselje'),
  ('palinovec', 'Palinovec', 'naselje'),
  ('sveti-juraj-u-trnju', 'Sveti Juraj u Trnju', 'naselje');

-- Općina Gornji Mihaljevec (11, bez samog Gornjeg Mihaljevca)
insert into locations (slug, name, type) values
  ('badlican', 'Badličan', 'naselje'),
  ('bogdanovec', 'Bogdanovec', 'naselje'),
  ('dragoslavec-breg', 'Dragoslavec Breg', 'naselje'),
  ('dragoslavec-selo', 'Dragoslavec Selo', 'naselje'),
  ('gornja-dubrava', 'Gornja Dubrava', 'naselje'),
  ('martinusevec', 'Martinuševec', 'naselje'),
  ('preseka', 'Preseka', 'naselje'),
  ('prhovec', 'Prhovec', 'naselje'),
  ('tupkovec', 'Tupkovec', 'naselje'),
  ('vugrisinec', 'Vugrišinec', 'naselje'),
  ('vukanovec', 'Vukanovec', 'naselje');

-- Općina Mala Subotica (5, bez same Male Subotice)
insert into locations (slug, name, type) values
  ('drzimurec', 'Držimurec', 'naselje'),
  ('palovec', 'Palovec', 'naselje'),
  ('piskorovec', 'Piškorovec', 'naselje'),
  ('strelec', 'Strelec', 'naselje'),
  ('sveti-kriz', 'Sveti Križ', 'naselje');

-- Općina Nedelišće (10, bez samog Nedelišća)
insert into locations (slug, name, type) values
  ('crecan', 'Črečan', 'naselje'),
  ('dunjkovec', 'Dunjkovec', 'naselje'),
  ('gornji-hrascan', 'Gornji Hrašćan', 'naselje'),
  ('gornji-kursanec', 'Gornji Kuršanec', 'naselje'),
  ('macinec', 'Macinec', 'naselje'),
  ('parag', 'Parag', 'naselje'),
  ('pretetinec', 'Pretetinec', 'naselje'),
  ('puscine', 'Pušćine', 'naselje'),
  ('slakovec', 'Slakovec', 'naselje'),
  ('trnovec', 'Trnovec', 'naselje');

-- Općina Orehovica (2, bez same Orehovice)
insert into locations (slug, name, type) values
  ('podbrest', 'Podbrest', 'naselje'),
  ('vularija', 'Vularija', 'naselje');

-- Općina Podturen (5, bez samog Podturena)
insert into locations (slug, name, type) values
  ('celine', 'Celine', 'naselje'),
  ('ferketinec', 'Ferketinec', 'naselje'),
  ('miklavec', 'Miklavec', 'naselje'),
  ('novakovec', 'Novakovec', 'naselje'),
  ('sivica', 'Sivica', 'naselje');

-- Općina Selnica (9, bez same Selnice)
insert into locations (slug, name, type) values
  ('bukovec', 'Bukovec', 'naselje'),
  ('donji-koncovcak', 'Donji Koncovčak', 'naselje'),
  ('donji-zebanec', 'Donji Zebanec', 'naselje'),
  ('gornji-zebanec', 'Gornji Zebanec', 'naselje'),
  ('merhatovec', 'Merhatovec', 'naselje'),
  ('plesivica', 'Plešivica', 'naselje'),
  ('praporcan', 'Praporčan', 'naselje'),
  ('zavescak', 'Zaveščak', 'naselje'),
  ('zebanec-selo', 'Zebanec Selo', 'naselje');

-- Općina Sveta Marija (1, bez same Svete Marije)
insert into locations (slug, name, type) values
  ('donji-mihaljevec', 'Donji Mihaljevec', 'naselje');

-- Općina Sveti Juraj na Bregu (9)
insert into locations (slug, name, type) values
  ('brezje', 'Brezje', 'naselje'),
  ('dragoslavec', 'Dragoslavec', 'naselje'),
  ('frkanovec', 'Frkanovec', 'naselje'),
  ('lopatinec', 'Lopatinec', 'naselje'),
  ('mali-mihaljevec', 'Mali Mihaljevec', 'naselje'),
  ('okrugli-vrh', 'Okrugli Vrh', 'naselje'),
  ('pleskovec', 'Pleškovec', 'naselje'),
  ('vucetinec', 'Vučetinec', 'naselje'),
  ('zasadbreg', 'Zasadbreg', 'naselje');

-- Općina Sveti Martin na Muri (13, bez samog Svetog Martina na Muri)
insert into locations (slug, name, type) values
  ('brezovec', 'Brezovec', 'naselje'),
  ('cestijanec', 'Čestijanec', 'naselje'),
  ('gornji-koncovcak', 'Gornji Koncovčak', 'naselje'),
  ('gradiscak', 'Gradiščak', 'naselje'),
  ('grkavescak', 'Grkaveščak', 'naselje'),
  ('jurovcak', 'Jurovčak', 'naselje'),
  ('jurovec', 'Jurovec', 'naselje'),
  ('kapelscak', 'Kapelščak', 'naselje'),
  ('lapsina', 'Lapšina', 'naselje'),
  ('marof', 'Marof', 'naselje'),
  ('toplice-sveti-martin', 'Toplice Sveti Martin', 'naselje'),
  ('vrhovljan', 'Vrhovljan', 'naselje'),
  ('zabnik', 'Žabnik', 'naselje');

-- Općina Šenkovec (1, bez samog Šenkovca)
insert into locations (slug, name, type) values
  ('knezovec', 'Knezovec', 'naselje');

-- Općina Štrigova (9, bez same Štrigove)
insert into locations (slug, name, type) values
  ('banfi', 'Banfi', 'naselje'),
  ('grabrovnik', 'Grabrovnik', 'naselje'),
  ('jalsovec', 'Jalšovec', 'naselje'),
  ('leskovec', 'Leskovec', 'naselje'),
  ('prekopa', 'Prekopa', 'naselje'),
  ('robadje', 'Robadje', 'naselje'),
  ('stanetinec', 'Stanetinec', 'naselje'),
  ('sveti-urban', 'Sveti Urban', 'naselje'),
  ('zelezna-gora', 'Železna Gora', 'naselje');

-- Općina Vratišinec (1, bez samog Vratišinca)
insert into locations (slug, name, type) values
  ('gornji-kraljevec', 'Gornji Kraljevec', 'naselje');
