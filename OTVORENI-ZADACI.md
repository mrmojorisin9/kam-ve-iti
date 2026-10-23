# Otvoreni zadaci

Živi popis onoga što je započeto ili poznato a nije zatvoreno. Detalji
pojedinih stavki su u `CHANGELOG.md`, `DECISIONS.md` i `HANDOFF.md`.
Zatvorene stavke se brišu odavde (trag ostaje u CHANGELOG-u).

_Zadnje ažuriranje: 2026-10-23_

## U tijeku

### ⚠️ PRIORITET: Google indeksiranje — kamdenes.hr ↔ www kružno preusmjeravanje
GSC izvoz 2026-10-12: indeksirano palo s 92 (11. 8.) na 13, nije
indeksirano 283, pojavljivanja ~0. Uzrok (provjereno uživo): Vercel
preusmjerava `kamdenes.hr` → `www.kamdenes.hr` (308), a sve stranice (i
sitemap, 306 URL-ova) navode canonical `https://kamdenes.hr/…` — Google
dobiva kružne signale. GSC svojstvo je `https://kamdenes.hr` (vidi samo
preusmjeravanja). 23 "noindex" su `/pretraga?q=` — namjerno, u redu.
- [x] Vercel → Settings → Domains: `kamdenes.hr` → Production (bez
  preusmjeravanja); `www.kamdenes.hr` → Redirect na `kamdenes.hr` (308).
  Kod nije trebalo mijenjati (canonical/sitemap/OG već koriste kamdenes.hr).
- [x] Provjera uživo (2026-10-12): `kamdenes.hr` 200, `www` 308 →
  `kamdenes.hr` (isprva 307, ispravljeno na 308), canonical = kamdenes.hr.
- [x] GSC: ponovno poslan sitemap, zatraženo indeksiranje glavnih stranica,
  pokrenuta potvrda popravka za "Stranica s preusmjeravanjem".
- [x] GSC izvoz 2026-10-23 (podaci do 16. 10.): oporavak radi — indeksirano
  13 → 45, pojavljivanja 0–3 → 77/dan. Nije indeksirano 320 = 123
  "Stranica s preusmjeravanjem" (ostatak, validacija pokrenuta, čisti se
  sama) + 24 noindex (`/pretraga`, namjerno) + 3 alternativna s canonicalom
  (filter URL-ovi `/?kategorija=…`, očekivano) + 162 "Otkriveno" + 8
  "Pretraženo" – nije indeksirano.
- [x] Uzrok zaostalih 170: 212 od 360 URL-ova u sitemapu bili su arhivirani
  (završeni) događaji — tanke stranice (~780 znakova, bez opisa/slike/
  JSON-LD-a), nigdje linkane. Maknuti iz sitemapa u kodu (2026-10-23,
  `getPublishedEventsForSitemap` filtrira `is_archived = false`); stranice i
  dalje vraćaju 200 (ADR-022). Lokalno: sitemap 360 → 148 URL-ova, build čist.
- [ ] **Promjena sitemapa još nije na produkciji** — commit + push (Vercel
  deploy), zatim provjeriti `https://kamdenes.hr/sitemap.xml` (očekuje se
  ~148 URL-ova) i u GSC-u ponovno poslati sitemap.
- [ ] Oko 2026-11-06: novi GSC izvoz i usporedba s 2026-10-23 (očekivanje:
  "Stranica s preusmjeravanjem" pada prema 0, "Indeksirano" raste prema
  ~150 = broj aktivnih događaja). Za potvrdu uzroka 170: GSC → Indeksiranje
  → Stranice → klik na razlog → primjeri URL-ova (izvoz ih ne sadrži).
- [ ] Interni linkovi: samo 43 od 143 aktivna događaja linkana su s naslovne
  (10-dnevni raspon), ostali se otkrivaju samo kroz sitemap. Ideja: stranica
  "Svi nadolazeći događaji" (npr. po mjesecima) linkana s naslovne/podnožja
  — povezano s backlogom "interaktivni kalendar".
- [ ] Podaci: 4 aktivna događaja imaju krivu godinu u datumu (→ kriv
  `startDate` u JSON-LD-u): `dan-caroline-reaper`, `handpan-koncert`,
  `tamburaski-koncert-pod-nazivom-nek-tambura-prica` (2016.) i
  `vedran-mlikota-u-murskom-srediscu-od-glume-do-vrhova-himalaje` (2031.).
  Ispraviti u adminu i provjeriti kako scraper parsira godinu.
- [ ] Nizak prioritet: `/dogadjaji/<nepostojeci-slug>` vraća 200 + noindex
  umjesto 404 (`src/app/dogadjaji/[slug]/loading.tsx` pošalje 200 prije
  `notFound()`). Google to ne kažnjava, ali obrisani/spojeni duplikati ne
  dobivaju pravi 404.

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
scraper trošak zatvoreni 2026-10-12 (vidi CHANGELOG).

## Ideje (backlog, bez dogovorenog redoslijeda)

Vidi `PROJECT_BRIEF.md` §11: „Događaj dana”/„Što danas?”, interaktivni
kalendar, karta događaja, tagovi (besplatno, za djecu…), odbrojavanje,
vremenska prognoza; dugoročno vodič za slobodno vrijeme (§10).
