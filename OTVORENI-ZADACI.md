# Otvoreni zadaci

Živi popis onoga što je započeto ili poznato a nije zatvoreno. Detalji
pojedinih stavki su u `CHANGELOG.md`, `DECISIONS.md` i `HANDOFF.md`.
Zatvorene stavke se brišu odavde (trag ostaje u CHANGELOG-u).

_Zadnje ažuriranje: 2026-10-12_

## U tijeku

### Scraper (n8n) na Oracle Cloud — rad 24/7 i pristup od bilo kuda
Cilj: n8n + `automation` ne ovise o tome je li vlasnikovo računalo upaljeno,
a n8n sučelje dostupno je s bilo kojeg uređaja.

- [x] Oracle Cloud račun registriran (2026-10-06, drugi pokušaj nakon
  odbijanja u kolovozu, ADR-020). Matična regija: **Italy Northwest
  (Milan), eu-milan-1** — ne može se promijeniti.
- [x] Postavke servera odabrane: Ubuntu 24.04, `VM.Standard.A1.Flex`
  (1 OCPU / 6 GB, Always Free), nova VCN s javnim subnetom, generiran SSH
  par ključeva.
- [ ] **Izrada servera** — 2026-10-06 Oracle javio *„Out of capacity for
  shape VM.Standard.A1.Flex in AD-1”* (Milano ima samo AD-1). Sljedeće:
  povremeno ponavljati *Create* i/ili **nadograditi račun na Pay As You Go**
  (lakše dobije A1 kapacitet i sprječava gašenje neaktivnih besplatnih
  servera; uz to odmah postaviti **budget alert ~1 €**).
- [ ] DNS zapis `n8n.kamdenes.hr` → javna IP servera (u **Vercel**
  dashboardu, ne kod registrara).
- [ ] Docker postavke za server: Caddy (HTTPS) ispred n8n-a, portovi 80/443.
  **Prije pisanja tražiti izričito odobrenje vlasnika** (prvi pokušaj
  blokirala je sigurnosna provjera sesije).
- [ ] Vatrozid: Oracle Security List (ingress 80/443) + iptables pravila na
  Ubuntu slici; `automation` (8000) i n8n (5678) ostaju samo na localhostu.
- [ ] Prijenos: `automation/deploy/.env`, uvoz workflowa (uključuje čvor
  „Pokreni scraper (uvoz)”), novi n8n owner račun + 2FA.
- [ ] Mapa `automation/uvoz/` je tada na serveru — odlučiti način ubacivanja
  `.jsonl` datoteka (obrazac u n8n-u ili SFTP).
- [ ] Gašenje lokalnog Docker Desktop setupa tek kad server radi
  (izbjeći dupli cron).
- **Rezervni plan** ako A1 kapacitet ne bude dostupan: mali plaćeni VPS
  (~4–6 €/mj.), iste Docker postavke.

### Migracija 0038 (scraper pamti obrađene zapise)
- [ ] Vlasnik primjenjuje `supabase/migrations/0038_scraper_seen.sql` u
  Supabase SQL Editoru.
- [ ] Provjera upisa/čitanja tablice + rebuild `automation` kontejnera.

### Prvi stvarni JSONL uvoz kroz n8n
- [ ] Kod prve prave datoteke u `automation/uvoz/` provjeriti da je
  premještena u `uvoz/obradjeno/` i da su događaji na čekanju u
  `/admin/dogadjaji` (do sad provjereno samo dry-runom i testom bez upisa).

## Poznato, nižeg prioriteta

- **Google Search Console — 4 upozorenja** (`performer`, `offers`,
  `organizer`, `endDate` nedostaju na dijelu događaja): zahtijeva nova polja
  u admin formi (cijena ulaznice, izvođač…).
- **Dedup — rubni slučaj:** isti višednevni događaj s dva izvora, datumi
  pomaknuti 1 dan + vrlo različiti naslovi ne prepoznaje se kao duplikat
  („Notorious Festival”, DECISIONS ADR-020 dopuna).
- **Sigurnost (audit 2026-07-21, bez kritičnih nalaza):** CSP bez
  `script-src` (ADR-018, treba nonce infrastruktura).

## Ideje (backlog, bez dogovorenog redoslijeda)

Vidi `PROJECT_BRIEF.md` §11: „Događaj dana”/„Što danas?”, interaktivni
kalendar, karta događaja, tagovi (besplatno, za djecu…), odbrojavanje,
vremenska prognoza; dugoročno vodič za slobodno vrijeme (§10).
