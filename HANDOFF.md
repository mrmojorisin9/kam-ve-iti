# HANDOFF — Kam denes (predaja projekta za budući razvoj)

**Datum predaje:** 2026-08-12
**Status u trenutku predaje:** v1 live u produkciji na `kamdenes.hr`. Portal
se **zamrzava u trenutnom stanju** — sljedeća promjena koda može doći tek za
~6 mjeseci, od novog developera. Ova datoteka je jedina namijenjena TOM
predajnom trenutku; ne ažurira se ubuduće (za tekuće stanje nakon što razvoj
nastavi, vidi opet `CHANGELOG.md`, koji se nastavlja puniti).

**Svrha ove datoteke:** sve što novi developer treba na jednom mjestu da
sigurno nastavi rad — pristupe, arhitekturu, poznata ograničenja i gdje dalje
čitati. Ovo NIJE zamjena za `PROJECT_BRIEF.md` (što/zašto), `DECISIONS.md`
(zašto baš tako — pun ADR log) i `CHANGELOG.md` (dnevni razvojni zapis, 96+
dana) — to troje ostaje izvor istine za detalje. Ova datoteka je ulazna
točka i operativni priručnik koji ih povezuje.

---

## 1. Vlasnik projekta / kontakt

- Vlasnik: Međimurje Events (Danijel Vinko)
- E-mail: danijel.vinko@net.hr
- Dosadašnji razvoj vođen je uz AI asistenta (Claude Code) — nema ljudskog
  prethodnog developera s kojim se može konzultirati. Sva "institucionalna
  memorija" projekta je u `PROJECT_BRIEF.md`/`DECISIONS.md`/`CHANGELOG.md`
  i ovoj datoteci.

---

## 2. Pristupi i kredencijali — GDJE ih naći

Nijedan stvarni secret nije ovdje. Vlasnik (danijel.vinko@net.hr) drži
pristupe; novi developer treba tražiti sljedeće od njega prije prvog rada:

| Sustav | Za što | Napomena |
|---|---|---|
| **GitHub** | repo `mrmojorisin9/kam-ve-iti` | Naziv repoa je i dalje stari `kam-ve-iti`, namjerno nije preimenovan (ADR-011) — ne dati se zbuniti, to je isti "Kam denes" projekt |
| **Vercel** | hosting, deploy, env varijable, domena | Projekt spojen izravno na GitHub repo, push na `main` = produkcijski deploy |
| **Supabase** | baza podataka, auth, storage | Dashboard pristup nužan — vidi §5, migracije se dosad primjenjivale ručno kroz SQL Editor, NE preko CLI-ja |
| **Domena kamdenes.hr** | registrar: domenar.hr (branding "Kuhada") | DNS je **u potpunosti delegiran na Vercelove nameservere** (`ns1/ns2.vercel-dns.com`) od 2026-08-06. Svaki budući DNS zapis (npr. MX/SPF za e-mail) mora ići u **Vercel dashboard → Domains → kamdenes.hr → Records**, NE u domenar.hr panel — taj više ne kontrolira živu zonu |
| **Anthropic API (Claude)** | ekstrakcija/kategorizacija u `automation/` pipelineu | Ključ u `automation/.env` (lokalno) i `automation/deploy/.env` (Docker) — nikad committan |
| **Admin login portala** | `kamdenes.hr/admin/login` | Račun kreiran ručno u Supabase Dashboardu (ADR-007) — nema self-service signup, namjerno |
| **n8n instanca** | cron orkestracija scrapera | Trenutno **lokalno na vlasnikovom Windows računalu** preko Docker Desktopa (`localhost:5678`), NE u cloudu — vidi §7 |

---

## 3. Arhitektura / tech stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript**, **React 19**
- **Tailwind CSS 4**
- **Supabase** (PostgreSQL + Auth + Storage) — jedina baza, dev=prod (nema
  odvojenog staging projekta, vidi §5)
- **Vercel** — hosting, CI/CD (auto-deploy na push u `main`)
- **n8n + Python + Claude API** — automatizirano prikupljanje događaja
  (Faza 6-7), radi izvan Vercela (§7)

### ⚠️ VAŽNO upozorenje iz `AGENTS.md`/`CLAUDE.md` (pročitati prvo)

> Ovaj Next.js nije onaj iz tvog treniranog znanja. Verzija 16 ima breaking
> changes u odnosu na starije Next.js konvencije koje developer (ljudski ili
> AI) možda očekuje. **Prije pisanja koda koji dira Next.js konvencije,
> pročitati `node_modules/next/dist/docs/`.**

Konkretni primjeri breaking changesa na koje se već nagazilo u ovom projektu:
- `middleware.ts` je preimenovan u **`proxy.ts`** (vidi `src/proxy.ts`)
- `error.tsx` prop `reset` je preimenovan u **`unstable_retry`**
- **Streaming metadata**: `generateMetadata` po defaultu ubrizgava tagove u
  `<body>`, ne `<head>`, za sve klijente izvan interne bot-liste — riješeno
  s `htmlLimitedBots: /.*/ ` u `next.config.ts` (vidi ADR-009). Ako se ta
  postavka ikad makne "radi čišćenja", SEO/social-sharing na stranici
  događaja se ponovno slama.
- Next.js metadata `openGraph` objekt je **shallow merge po segmentu, ne
  dubok** — svaka stranica koja override-a `openGraph` mora eksplicitno
  ponoviti `images` polje, inače gubi site-wide OG sliku (ADR-012)

---

## 4. Struktura repozitorija

```
kam-ve-iti/
├── PROJECT_BRIEF.md      problem, opseg, faze — pročitati PRVO
├── DECISIONS.md          ADR log (arhitekturne odluke, ~21+ ADR-ova) — zašto je nešto tako kako jest
├── CHANGELOG.md          dnevni razvojni zapis, 96+ unosa — najdetaljniji izvor "što je rađeno i zašto"
├── HANDOFF.md            ova datoteka
├── README.md             brzi setup (lokalni dev, env, deploy)
├── src/
│   ├── app/               Next.js App Router rute
│   │   ├── (home)/           naslovnica, ima svoj loading.tsx (route grupa)
│   │   ├── sutra/ vikend/    javne rute (kategorija/tjedan alias na `/`)
│   │   ├── dogadjaji/[slug]/ stranica pojedinog događaja
│   │   ├── prijavi-dogadaj/  javna prijava linkom (anon INSERT, ADR-016)
│   │   ├── pretraga/
│   │   ├── admin/login/
│   │   └── admin/(protected)/  admin sustav — layout radi vlastitu session provjeru
│   ├── components/        React komponente (i `admin/` podfolder)
│   ├── lib/                poslovna logika: `events.ts` (filtri/upiti),
│   │   │                   `admin-events.ts`, `zagreb-time.ts` (DST-safe
│   │   │                   Europe/Zagreb konverzije), `csv.ts` (ručni RFC4180
│   │   │                   parser), `structured-data.ts` (JSON-LD), `regions.ts`
│   │   │                   (statička lokacija→regija mapa), `duplicates.ts`
│   │   └── supabase/       client.ts (Client Components) / server.ts (Server Components/Actions)
│   ├── types/               `database.ts` NIJE trenutno generiran (vidi §5 napomenu)
│   └── proxy.ts            Next.js 16 "middleware" — osvježava Supabase session, štiti /admin/*
├── supabase/
│   ├── migrations/         0001–0036, KRONOLOŠKI, primjenjuju se ručno (§5!)
│   └── seed.sql             8→7→6→7 kategorija (finalno 7, ADR-017), 132 lokacije
└── automation/              Faza 6-7 — scraper pipeline, potpuno odvojen od Next.js appa
    ├── adapters/            po jedan modul po izvoru (emedjimurje, mnovine, prelog, evento, tribe_events base)
    ├── pipeline.py           CLI: fetch → Claude ekstrakcija → dedup → upis
    ├── db.py / dedup.py / extract.py
    ├── server.py             Flask HTTP wrapper (za n8n Docker poziv)
    ├── n8n/scraper-workflow.json   predložak, uvozi se RUČNO u n8n UI (uređivanje ove datoteke NE mijenja već uvezeni workflow)
    └── deploy/                Docker Compose (n8n + automation kontejneri), README s punim setup koracima
```

---

## 5. Baza podataka (Supabase) — KRITIČNE napomene

### ⚠️ Nema formalnog migration trackinga

Projekt **ne koristi Supabase CLI za primjenu migracija** (nema
`supabase/config.toml`, projekt nikad nije `supabase link`-an). Sve
migracije (`0001`–`0036`) su kroz cijeli razvoj primjenjivane **ručno,
kopiranjem SQL-a u Supabase Dashboard → SQL Editor**, jer service-role REST
klijent ne može izvršavati DDL. To znači:

- **Ne postoji pouzdan zapis u samoj bazi koje su migracije primijenjene.**
  `CHANGELOG.md` dokumentira svaki put kad je migracija napisana i (obično
  u istom ili idućem unosu) kad je korisnik potvrdio da ju je ručno
  zalijepio — ali to je log, ne izvor istine.
- **Prvi zadatak novog developera prije bilo kakve izmjene sheme:**
  usporediti stvarno stanje produkcijske baze (Supabase Dashboard →
  Database → Functions/Tables, ili `pg_get_functiondef`) sa svim datotekama
  u `supabase/migrations/` i potvrditi da su sve primijenjene i identične.
  Poznat presedan (ADR-010): jedna migracija (`0002`) je postojala samo u
  bazi, ne u repou, mjesecima — obrnuti scenarij (migracija u repou, ne u
  bazi) jednako je moguć i nije nikad sustavno provjeren.
- Ako se baza ikad presели na Supabase CLI-vođeni workflow, prvi korak je
  `supabase link` + `supabase db pull` da se stvarno stanje snimi kao
  baseline, PRIJE primjene ijedne nove migracije iz repoa.

### Osnovni model (ADR-007)

- `categories` (tablica, ne enum — trenutno 7: Glazba & Party, Kultura &
  Kazalište, Sport & Rekreacija, Gastro & Wine, Edukacija & Radionice,
  Velike Manifestacije, Društvo — ADR-013 + ADR-017)
- `locations` (132 zapisa — 25 gradova/općina + 107 naselja, ADR-004/Dan 24)
- `events` (glavna tablica — `status` enum `draft`/`pending_review`/
  `published`/`rejected`, plus akumulirano kroz migracije: pametni filtri
  ADR-013 dio 3, popularity/trending/view_count ADR-014, sponsorship,
  gallery, scraper source tracking, admin_edited_fields zaštita...)
- `event_interactions` (append-only, anonimno praćenje pregleda, ADR-014)
- `general_sponsor`, `page_views`, `event_link_submissions` (novije tablice)

### ⚠️ Admin autorizacijski model — poznat rizik (ADR-007)

**Svaki autenticirani Supabase Auth korisnik = admin.** Nema posebne
role/profiles tablice. Ovo je sigurno SAMO dok je javna registracija
(email signup) isključena u Supabase Auth postavkama — potvrđeno isključeno
2026-07-21 (ADR-018 dopuna), ali **novi developer mora to ponovno provjeriti**
prije bilo kakve promjene auth postavki. Ako se ikad doda registracija za
organizatore/korisnike, ovaj model MORA prijeći na pravu role-provjeru prije
lansiranja te funkcionalnosti.

### Column-level grant zamka (ADR-016)

Otkad su `submitter_email`/`submitter_phone` zaštićeni column-level
REVOKE-om (ne table-level RLS), **svaki novi stupac na `events` mora biti
eksplicitno dodan na `grant select (...)` popis** za anon rolu da bude
javno čitljiv — automatsko nasljeđivanje preko table-level granta ne vrijedi
više za tu tablicu. Lako se zaboravi kod dodavanja novog polja.

### Tipovi

`src/types/database.ts` se generira naredbom (vidi `README.md`), **ali
trenutno ne postoji u repou** (samo `README.md` u `src/types/`) — vjerojatno
nikad pokrenuto ili obrisano. Provjeriti kako se tipovi trenutno rješavaju
u `src/lib/events.ts`/`admin-events.ts` (ručni interface-i?) prije nego se
pretpostavi da CLI-generirani tip postoji.

---

## 6. Sigurnost — stanje na dan predaje

Pun audit proveden 2026-07-21 (OWASP ASVS Level 2 okvir), ocjena 67/100,
**bez Critical/High nalaza**. Detalji u ADR-018. Primijenjeno: HTTP security
headeri (bez stroge CSP script-src — App Router inline hydration/JSON-LD
scriptovi to sprječavaju bez nonce infrastrukture), image upload allowlist,
SECURITY DEFINER funkcije zaštićene od curenja podataka preko izravnog RPC
poziva, rate limiting na anon insertove (`event_interactions`,
`event_link_submissions`).

**Poznate otvorene stavke (niski prioritet, iz audit izvještaja, nisu
riješene):**
- `/prijavi-dogadaj` captcha je jednostavno računsko pitanje bez
  kriptografskog potpisa — dovoljno protiv generičkih botova, ne protiv
  ciljanog napada
- CSP nema `script-src`/`default-src` restrikciju (namjerna odluka, ADR-018)
- Nema Dependabot/automatiziranog dependency scanninga postavljenog

Osnovna zaštita od scraping botova dodana naknadno (commit `8f6f968`,
2026-08-11) — pogledati taj commit/`CHANGELOG.md` prije nadogradnje na
nešto jače (npr. Cloudflare) da se ne duplicira logika.

---

## 7. Automatizacija prikupljanja (Faza 6-7) — poseban sustav

**Ovo NIJE dio Next.js/Vercel deploya.** Radi potpuno odvojeno, lokalno na
vlasnikovom Windows računalu:

- Docker Desktop, dva kontejnera (`n8n` + `automation`, service Flask
  wrapper oko `pipeline.py`) — puni setup u `automation/deploy/README.md`
- **Cron unutar n8n-a okida SAMO dok je vlasnikovo računalo upaljeno i
  Docker Desktop pokrenut.** Ako se automatizacija treba učiniti pouzdanijom
  (24/7), sljedeći korak je premještanje istog `docker-compose.yml`/
  `Dockerfile` na pravi VM (Oracle Cloud je bio prvotni plan, ali
  registracija blokirana njihovim anti-fraud sustavom — vidi ADR-020,
  ponovni pokušaj ili druga VM opcija je otvorena stavka)
- 4 aktivna izvora: `emedjimurje.net.hr`, `mnovine.hr`, `prelog.hr`,
  `evento.sh` (posljednji dodan 2026-08-11/12, čisti REST API)
- Svaki novi izvor: pratiti checklistu u `automation/README.md`
  ("Dodavanje novog izvora") PRIJE pisanja adaptera — sprječava trošenje
  Claude API kredita na izvore koji se pokažu neisplativima
  (`visitmedimurje.com`, `msm.hr`, `medjimurjepress.net` već odbačeni,
  razlozi dokumentirani)
- **Nakon svake izmjene `automation/*.py`**: treba ručni
  `docker compose up -d --build automation` (rebuild) prije nego cron
  koristi novi kod — poznat presedan gdje je izmjena bila u repou tjednima
  dok kontejner nije rebuildan (Faza 6-7, Dan 90)
- Ako se `automation/n8n/scraper-workflow.json` uredi u repou, to **ne**
  mijenja već uvezeni/aktivni n8n workflow — treba ručno ponoviti import ili
  ručno dodati novi čvor u n8n UI

---

## 8. Poznata operativna stanja koja NISU bugovi

Ovo je da novi developer ne "popravlja" namjerne odluke bez pitanja:

- **"Test Sponzor d.o.o." može biti vidljiv na produkciji** (splash/widget/
  modal generalnog sponzora) — placeholder test podatak koji je vlasnik
  eksplicitno zatražio da ostane vidljiv umjesto gašenja, dok se ne nađe
  stvarni sponzor. Provjeriti `/admin/sponzor` za trenutno stanje, ne
  pretpostavljati da je zaboravljen test podatak.
- **GitHub repo i Vercel projekt i dalje se zovu `kam-ve-iti`**, ne
  "kam-denes" — namjerno nepreimenovano (ADR-011), izbjegava se rizik
  rewrite-a URL-ova. Kod/dokumentacija/domena koriste "Kam denes".
- **`/tjedan` je redirect (308) na `/`** — naslovna sad prikazuje isti
  10-dnevni raspon, `/tjedan` ruta je ukinuta ali stari linkovi/bookmarci
  i dalje rade preko `next.config.ts` redirecta.
- **4 GSC upozorenja i dalje otvorena** (`performer`/`offers`/`organizer`/
  `endDate` nedostaju na dijelu događaja) — stvaran nedostatak podataka
  (cijena ulaznice/izvođač se ne prikupljaju), ne bug. Rješenje zahtijeva
  nova polja u admin formi, otvorena stavka za buduću sesiju.

---

## 9. Preporučeni prvi koraci za novog developera

1. Pročitati `PROJECT_BRIEF.md` (opseg, filozofija) → `DECISIONS.md` u
   cijelosti (ADR log, ~1150 linija ali objašnjava SVAKU netrivijalnu
   odluku i poznatu zamku) → zadnjih ~20-ak unosa u `CHANGELOG.md` za
   trenutni kontekst.
2. Dobiti pristupe od vlasnika (§2).
3. **Prvo**: audit primijenjenih Supabase migracija naspram
   `supabase/migrations/` (§5) — ne pretpostavljati da je stanje sinkrono.
4. Lokalni setup po `README.md` (`npm install`, `.env.local`, `npm run dev`).
5. Ako se dira `automation/`: pratiti `automation/README.md` i
   `automation/deploy/README.md` setup korake, provjeriti da Docker
   kontejneri rade najnoviji kod (rebuild ako je prošlo vremena).
6. Prije pisanja koda koji dira Next.js konvencije: pogledati
   `node_modules/next/dist/docs/` za verziju 16 (vidi §3 upozorenje).
7. Za bilo koju promjenu sheme: nova migracija u
   `supabase/migrations/000X_opis.sql`, primijeniti ručno u SQL Editoru
   (dok se ne uspostavi CLI workflow), dokumentirati u `CHANGELOG.md` po
   istom obrascu kao dosadašnji unosi.

---

## 10. Backlog / planirano za v2+ (nije obećanje, samo smjer)

Iz `PROJECT_BRIEF.md` §10-11: interaktivni kalendar prikaz, karta događaja
(namjerno bez geokodiranja u v1, ADR-007), tagovi/oznake odvojeno od
kategorija, countdown do početka događaja, vremenska prognoza za outdoor
događaje, turistički vodiči/restorani/rute kao budući sadržajni stupovi.
Nijedno od ovoga nema commitment na redoslijed ili rok.
