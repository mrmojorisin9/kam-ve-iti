-- Kam denes — kategorije v2 (DECISIONS.md ADR-013, zamjenjuje ADR-005)
-- 8 kategorija -> 6: novi prikazni nazivi, "Obitelj i djeca" seli u budući
-- pametni filtar (is_family_friendly), "Ostalo" ventil uklonjen. Slugovi
-- ostaju nepromijenjeni gdje kategorija ostaje konceptualno ista, da
-- postojeći ?kategorija= linkovi ne puknu.

update categories set name = 'Glazba & Party', sort_order = 1 where slug = 'glazba-i-koncerti';
update categories set name = 'Kultura & Kazalište', sort_order = 2 where slug = 'kultura';
update categories set name = 'Sport & Rekreacija', sort_order = 3 where slug = 'sport-i-rekreacija';
update categories set name = 'Gastro & Wine', sort_order = 4 where slug = 'gastronomija-i-vino';
update categories set name = 'Edukacija & Radionice', sort_order = 5 where slug = 'edukacija-i-radionice';
update categories set name = 'Velike Manifestacije', sort_order = 6 where slug = 'manifestacije-i-feste';

-- Sigurno za brisanje: provjereno upitom prije migracije, 0 događaja u
-- produkciji koristi ova dva sluga.
delete from categories where slug in ('obitelj-i-djeca', 'ostalo');

comment on table categories is '6 fiksnih kategorija za v1 (ADR-013, zamjenjuje ADR-005 s 8 kategorija).';
