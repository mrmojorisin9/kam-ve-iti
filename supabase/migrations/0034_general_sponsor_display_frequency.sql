-- Kam denes — Generalni sponzor: podesiva učestalost prikaza (Faza 1
-- dopuna). Admin bira koliko često se full-screen splash (Faza 2) smije
-- prikazati istom korisniku: jednom/tri puta unutar 24h (localStorage
-- frequency cap, Faza 2) ili pri svakoj novoj sesiji (bez capa).

alter table general_sponsor
  add column display_frequency text not null default 'once_per_day'
  constraint general_sponsor_display_frequency_check
    check (display_frequency in ('once_per_day', 'three_per_day', 'every_session'));

-- general_sponsor nema column-level grant zamku poput events (ADR-016) —
-- read politika je "for select using (true)" na razini retka/tablice, pa
-- novi stupac nasljeđuje isto javno čitanje bez dodatnog grant koraka.
