-- Kam denes — cijena ulaznice i izvođač na događaju (Google Search Console
-- upozorenja "offers"/"performer" nedostaju, otvorena stavka od 2026-08;
-- korisnikov odabir 2026-10-13: polja u admin formi + Claude ih izvlači pri
-- scrapanju kad ih izvor navodi).
--
-- price_eur: najniža cijena ulaznice u eurima ("od"); NULL = nepoznato.
-- Besplatni događaji i dalje preko postojećeg is_free (cijena se tada ne
-- upisuje). performer: slobodan tekst (izvođač/izvođači, npr. "Gibonni" ili
-- "KUD Seljačka sloga, tamburaški sastav Ravnica").

alter table events
  add column price_eur numeric(8, 2) check (price_eur is null or price_eur >= 0),
  add column performer text;

-- Column-level grant za anon (ADR-016 "Ispravak" zamka, 0015/0024): novi
-- javno-vidljivi stupci MORAJU biti eksplicitno dodani, inače ih stranica
-- događaja (anon klijent) ne može pročitati.
grant select (price_eur, performer) on events to anon;
