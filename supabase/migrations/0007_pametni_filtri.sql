-- Kam denes — pametni filtri raspoloženja/logistike (Razina 3 filter
-- sustava). 7 novih kolona na events, sve opcionalne (default false / null),
-- postavlja ih admin pri unosu — vidi DECISIONS.md ADR-013 kontekst.
--
-- `pace` je nullable (ne enum) jer je treće, "svejedno" stanje zapravo
-- odsutnost odabira, ne treća vrijednost koju bi admin eksplicitno birao.

alter table events
  add column is_free boolean not null default false,
  add column is_family_friendly boolean not null default false,
  add column is_dog_friendly boolean not null default false,
  add column is_solo_friendly boolean not null default false,
  add column is_romantic boolean not null default false,
  add column is_hidden_gem boolean not null default false,
  add column pace text check (pace in ('lagano', 'akcija'));

comment on column events.is_hidden_gem is
  'Ručna admin oznaka: manje/intimne, lokalno poznate lokacije — nikad kategorija "Velike Manifestacije" (provjereno u aplikacijskom sloju, ne DB constraintom).';
