# Otvoreni zadaci

Živi popis onoga što je započeto ili poznato a nije zatvoreno. Detalji
pojedinih stavki su u `CHANGELOG.md`, `DECISIONS.md` i `HANDOFF.md`.
Zatvorene stavke se brišu odavde (trag ostaje u CHANGELOG-u).

_Zadnje ažuriranje: 2026-10-12_

## U tijeku

### ⚠️ PRIORITET: Google indeksiranje — kamdenes.hr ↔ www kružno preusmjeravanje
GSC izvoz 2026-10-12: indeksirano palo s 92 (11. 8.) na 13, nije
indeksirano 283, pojavljivanja ~0. Uzrok (provjereno uživo): Vercel
preusmjerava `kamdenes.hr` → `www.kamdenes.hr` (308), a sve stranice (i
sitemap, 306 URL-ova) navode canonical `https://kamdenes.hr/…` — Google
dobiva kružne signale. GSC svojstvo je `https://kamdenes.hr` (vidi samo
preusmjeravanja). 23 "noindex" su `/pretraga?q=` — namjerno, u redu.
- [ ] Vercel → Settings → Domains: `kamdenes.hr` → Production (bez
  preusmjeravanja); `www.kamdenes.hr` → Redirect na `kamdenes.hr` (308).
  Kod ne treba mijenjati (canonical/sitemap/OG već koriste kamdenes.hr).
- [ ] Provjera uživo: `kamdenes.hr` 200, `www` 308 → `kamdenes.hr`.
- [ ] GSC: ponovno poslati sitemap, "Zatraži indeksiranje" za naslovnu i
  glavne stranice, "Potvrdi popravak" za "Stranica s preusmjeravanjem".
- [ ] Za nekoliko tjedana: novi GSC izvoz, provjeriti oporavak.

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

### mnovine.hr blokira scraper (403, Cloudflare)
Od 2026-10-12 mnovine.hr odbija naš scraper (Cloudflare bot zaštita, i za
`robots.txt`). Ne zaobilazi se lažiranjem preglednika. Odluka vlasnika:
- [ ] isključiti izvor (dio njihovih događaja ionako dolazi i preko
  emedjimurje.net.hr), ili
- [ ] javiti se mnovine.hr i zamoliti da propuste `KamDenesBot`.

## Poznato, nižeg prioriteta

Trenutno ništa — sve stavke iz sigurnosnog audita, GSC upozorenja, dedup i
scraper trošak zatvoreni 2026-10-13 (vidi CHANGELOG).

## Ideje (backlog, bez dogovorenog redoslijeda)

Vidi `PROJECT_BRIEF.md` §11: „Događaj dana”/„Što danas?”, interaktivni
kalendar, karta događaja, tagovi (besplatno, za djecu…), odbrojavanje,
vremenska prognoza; dugoročno vodič za slobodno vrijeme (§10).
