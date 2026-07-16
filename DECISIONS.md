# Odluke o arhitekturi i tehnologiji (Decision Log)

Svaka veća tehnička ili arhitekturna odluka bilježi se ovdje u ADR (Architecture Decision Record) formatu: kontekst → odluka → alternative → posljedice.

---

## ADR-001: Odabir tehnološkog stacka
**Datum:** 2026-07-14
**Status:** Prihvaćeno

**Kontekst:**
Potreban je moderan, skalabilan, SEO-optimiziran, mobile-first web portal koji jedan developer može samostalno održavati, uz mogućnost lakog dodavanja AI funkcionalnosti u kasnijim fazama.

**Odluka:**
Next.js + TypeScript (frontend, SSR, SEO) · Supabase / PostgreSQL (baza podataka i autentifikacija) · Vercel (hosting) · n8n (automatizacija i orkestracija) · Python (AI/data-processing skripte) · Claude API (AI funkcionalnosti).

**Razmotrene alternative:**
- WordPress + custom plugin — brže za MVP, ali teže skalabilno i teže za čistu AI integraciju.
- Firebase umjesto Supabase — slabija podrška za relacijske upite, bitne za filtriranje događaja po datumu/kategoriji/lokaciji.
- Django + PostgreSQL — solidna alternativa, ali dvostruki stack (poseban backend i frontend) povećava kompleksnost za samostalnog developera.

**Posljedice:**
Cijeli razvoj odvija se u TypeScript/Python okruženju; Supabase pokriva i bazu i autentifikaciju, čime se smanjuje broj pokretnih dijelova sustava.

---

## ADR-002: Ljudska provjera prije objave (human-in-the-loop)
**Datum:** 2026-07-14
**Status:** Prihvaćeno

**Kontekst:**
Projekt planira AI automatizaciju za pronalaženje, ekstrakciju i kategorizaciju događaja iz raspršenih izvora.

**Odluka:**
U prvoj verziji nijedan događaj ne ide automatski u javnu objavu — svaki prolazi kroz administratorsku provjeru prije nego postane vidljiv na portalu.

**Razmotrene alternative:**
- Potpuno automatska objava — brže, ali visok rizik od netočnih ili dupliciranih podataka i gubitka povjerenja korisnika.

**Posljedice:**
Administratorski sustav (Faza 5) mora imati review/queue sučelje prije nego AI modul (Faza 6) postane koristan u produkciji.

---

## ADR-003: Iterativni razvoj kroz faze — "jedan dan = jedan mali zadatak"
**Datum:** 2026-07-14
**Status:** Prihvaćeno

**Kontekst:**
Projekt razvija jedan developer uz AI asistenta, bez fiksnog roka i bez tima.

**Odluka:**
Razvoj se odvija kroz 8 jasno odvojenih faza (definicija → infrastruktura → baza → javni portal → admin → AI moduli → automatizacija → lansiranje); svaka faza završava prije početka sljedeće, a svaki radni dan pokriva jedan mali, jasno definiran zadatak.

**Posljedice:**
Sporiji ukupni tempo, ali manji rizik od nedovršenih ili neodrživih dijelova koda i lakše praćenje napretka kroz `CHANGELOG.md`.

---

## ADR-004: MVP opseg (v1) — što ulazi, a što ne
**Datum:** 2026-07-14
**Status:** Prihvaćeno (finalno)

**Kontekst:**
Potrebno je jasno razgraničiti što portal mora raditi u prvoj verziji da bi se izbjeglo "scope creep" prije nego infrastruktura i baza uopće postoje (Faze 2–3).

**Odluka:**
V1 = javni pregled događanja (danas/sutra/vikend/tjedan), filtriranje po kategoriji (ADR-005) i lokaciji, stranica događaja, admin unos putem **ručne forme i CSV uvoza** (oboje bez AI). Geografski opseg: **cijela Međimurska županija odmah od starta**, bez postupnog širenja. AI pronalaženje/ekstrakcija/dedup/sažeci/objave, korisnički računi i višejezičnost izlaze iz opsega v1.

**Razmotrene alternative:**
- Uključiti barem jednostavnu AI ekstrakciju već u v1 — odbačeno jer bi Faza 6 preduhitrila Faze 2–5 i narušila redoslijed faza definiran u master promptu.
- Postupno širenje po gradovima/općinama (npr. početi s Čakovcem) — odbačeno; korisnik je odlučio ići odmah na cijelu županiju jer je izvor podataka (admin unos) isti bez obzira na broj lokacija u v1.

**Posljedice:**
Admin sustav (Faza 5) mora podržati i ručni unos i CSV uvoz bez oslanjanja na AI. Podatkovni model (Faza 3) mora od početka sadržavati sve gradove/općine Međimurske županije, ne samo podskup.

---

## ADR-005: Kategorije događanja
**Datum:** 2026-07-14
**Status:** Prihvaćeno

**Kontekst:**
Filtriranje po kategoriji je jedan od temeljnih zahtjeva portala. Korisnik je zatražio 5–8 kategorija uz procjenu optimalnog broja.

**Odluka:**
8 kategorija: Kultura · Glazba i koncerti · Sport i rekreacija · Manifestacije i fešte · Obitelj i djeca · Edukacija i radionice · Gastronomija i vino · Ostalo.

**Obrazloženje:**
- Gornja granica raspona (8) opravdana je time što Međimurje ima izraženu gastro/vinsku ponudu (vinske ceste, tematske fešte) koja zaslužuje vlastitu kategoriju, a ne da se gubi pod "Ostalo".
- "Ostalo" je namjerno uključen kao ventil za admina — bez njega bi se rubni slučajevi silom gurali u pogrešnu kategoriju, što narušava kvalitetu podataka i kasnije AI kategorizaciju (Faza 6).
- Broj 8 ostaje unutar preporučenog raspona za filter UI (5–9) prije nego korisničko iskustvo postane nepregledno na mobitelu (mobile-first zahtjev).

**Razmotrene alternative:**
- 5 širih kategorija (npr. spajanje Glazbe i Manifestacija) — jednostavnije, ali previše generično za portal fokusiran na jednu županiju gdje su gastro/vinski događaji prepoznatljivi dio identiteta.
- 10+ užih kategorija (razdvajanje npr. Kazalište/Izložbe/Film unutar Kulture) — odbačeno, prerano za v1 bez stvarnih podataka o distribuciji događaja po tipu.

**Posljedice:**
Podatkovni model (Faza 3) definira `category` kao enum/tablicu s ovih 8 vrijednosti. Popis se može revidirati nakon prikupljanja stvarnih podataka (novi ADR ako se promijeni).

---

## ADR-006: Tailwind CSS kao pristup stiliziranju
**Datum:** 2026-07-14
**Status:** Prihvaćeno

**Kontekst:**
Master prompt ne definira CSS pristup. Next.js projekt (Faza 2) treba odluku prije pisanja prve komponente, a portal ima izričit mobile-first zahtjev.

**Odluka:**
Tailwind CSS 4 (uz standardnu `create-next-app` integraciju).

**Razmotrene alternative:**
- CSS Modules (ugrađeno u Next.js, bez dodatne ovisnosti) — solidno, ali sporije za dosljedan mobile-first responsive rad bez utility klasa; više boilerplate koda po komponenti.
- Plain CSS / SCSS — najviše kontrole, ali najviše ručnog posla oko konzistentnosti (spacing, breakpoints) na projektu koji jedan developer održava.
- CSS-in-JS (npr. styled-components) — dodaje runtime trošak i slabije se slaže sa Server Componentsima u App Routeru.

**Obrazloženje:**
Tailwind je danas de facto standard uz Next.js App Router, ima nultu runtime cijenu (kompajlira se u build-u), ubrzava mobile-first rad kroz breakpoint-prefikse (`sm:`, `md:`...), i ne uvodi arhitekturnu ovisnost izvan CSS sloja — nisko rizična odluka koja se uklapa u "ne uvoditi tehnologiju bez razloga".

**Posljedice:**
Sve buduće komponente (Faza 4+) pišu se Tailwind utility klasama. Dodan `prettier-plugin-tailwindcss` za automatsko sortiranje klasa i konzistentnost koda.

---

## ADR-007: Podatkovni model — Faza 3
**Datum:** 2026-07-14
**Status:** Prihvaćeno

**Kontekst:**
Potrebna je shema baze za `events`, `categories`, `locations` prije bilo kakvog razvoja javnog portala ili admin sučelja.

**Odluka:**
- **Kategorije → tablica**, ne enum. Enum u Postgresu se ne može mijenjati bez migracije (nema DROP VALUE); tablica dopušta buduće dodavanje ikone/boje/redoslijeda bez diranja sheme.
- **Status događaja → enum** (`draft`, `pending_review`, `published`, `rejected`). Fiksan, rijetko promjenjiv skup — enum daje striktnu validaciju na razini baze.
- **Lokacije → samo grad/općina** (25 fiksnih zapisa, cijela županija odmah — ADR-004). Konkretna adresa/dvorana ide u `events.venue_name` kao slobodan tekst; koordinate/karta nisu u MVP opsegu.
- **Admin autorizacija (RLS) → svaki autentificirani Supabase Auth korisnik = admin**, bez posebne role tablice.

**Razmotrene alternative:**
- Kategorije kao enum — odbačeno zbog rigidnosti pri budućim izmjenama.
- Puna adresa s geokodiranjem po događaju — odbačeno, karta nije u opsegu v1 (PROJECT_BRIEF §5).
- Posebna `profiles`/`roles` tablica za admin provjeru — odbačeno za v1 kao prerana kompleksnost dok postoji samo jedan/nekoliko povjerenih kuratora bez javne registracije.

**Posljedice / rizik:**
Pojednostavljena admin-provjera (authenticated = admin) je sigurna **samo dok Supabase Auth signup ostaje isključen za javnost**. Ako se ikad doda registracija za organizatore ili krajnje korisnike, ovo mora prijeći na pravu role-provjeru prije lansiranja te funkcionalnosti — inače bi svaki registrirani korisnik mogao uređivati sve događaje. TypeScript tipovi (`src/types/database.ts`) generiraju se iz sheme (`supabase gen types typescript`), ne pišu se ručno.

---
## ADR-008: Filtriranje događaja po kategoriji/lokaciji — aplikacijski sloj (v1)
**Datum:** 2026-07-15
**Status:** Prihvaćeno

**Kontekst:**
Potrebno filtriranje po kategoriji i lokaciji (PROJECT_BRIEF §4), primjenjivo na sve poglede (danas/sutra/vikend/tjedan).

**Odluka:**
Filtriranje se radi u aplikacijskom sloju (TypeScript, nakon dohvata iz `events_on_date`/`events_in_range`), ne dodavanjem WHERE uvjeta u SQL funkcije.

**Razmotrene alternative:**
- SQL-level filtriranje (dodatni parametri u RPC funkcijama) — ispravnije dugoročno, ali odbačeno za sada jer bi zahtijevalo izmjenu već deployane `events_on_date` funkcije bez uvida u njen točan trenutni izvor u tom trenutku razvoja.

**Posljedice:**
Prihvatljivo dok je broj događaja malen (kuriran ručni/CSV unos, jedna županija). Ako baza naraste, filtriranje treba prebaciti u SQL (WHERE + indeksi na category_id/location_id, već postoje iz ADR-007).

---

## ADR-009: Isključivanje streaming metadata (Next.js 16 `htmlLimitedBots`)
**Datum:** 2026-07-16
**Status:** Prihvaćeno

**Kontekst:**
Lighthouse audit (Faza 8, Dan 5) na `/dogadjaji/[slug]` prijavio je SEO 91/100 — "Document does not have a meta description". Istraga (`curl` na sirov HTML) pokazala je da `<meta name="description">`, OG i Twitter tagovi fizički završe *iza* `</head>`, u `<body>`. Uzrok: Next.js 16 po defaultu stream-a `generateMetadata` rezultat i ubrizgava ga u `<body>` za sve klijente osim interne liste botova koji izvršavaju JS ili su verificirani (Googlebot, Bingbot, Twitterbot, Slackbot) — vidi `node_modules/next/dist/docs/.../htmlLimitedBots.md`. Google/Bing/Twitter/Slack rade ispravno u oba slučaja, ali alati koji ne izvršavaju JS i nisu na toj listi (npr. LinkedIn, Discord, WhatsApp preview scraperi, mnogi SEO checkeri) ne bi vidjeli title/description/OG tagove na stranici pojedinog događaja — upravo ondje gdje su najvažniji (ADR iz Faze 8, Dan 1).

**Odluka:**
`htmlLimitedBots: /.*/` u `next.config.ts` — tretira sve klijente kao "HTML-limited", vraćajući pre-16 ponašanje (blokirajuće renderiranje metapodataka, uvijek u `<head>`).

**Razmotrene alternative:**
- Zadržati default (streaming) — odbačeno; korist (brži TTFB) je zanemariva jer je Supabase upit za `getEventBySlug` već brz (~20ms, izmjereno istim Lighthouse audit-om), dok je cijena (nepouzdan social-sharing preview i SEO alati izvan Google/Bing/Twitter/Slack) neprihvatljiva za portal kojem je SEO temeljni zahtjev (PROJECT_BRIEF §6).
- Suziti `htmlLimitedBots` na specifičan popis dodatnih botova umjesto `/.*/ ` — odbačeno, previše krhko (nova lista za održavati, propušta buduće/nepoznate crawlere).

**Posljedice:**
Lighthouse SEO 100/100 na `/dogadjaji/[slug]` (bilo 91/100), bez mjerljive štete na performance (LCP čak neznatno bolji u testu: 2.7s naspram 2.9s prije). Svaka buduća stranica koja koristi async `generateMetadata` automatski dobiva ovo ponašanje, nema dodatnog rada po ruti.

---

## ADR-010: Rekonstrukcija nedostajuće migracije `events_on_date`
**Datum:** 2026-07-16
**Status:** Prihvaćeno

**Kontekst:**
Priprema za Vercel/produkcijski deploy (Faza 8) otkrila je da `supabase/migrations/` sadrži `0001_init_schema.sql` i `0003_events_in_range.sql`, ali ne i `0002` — iako `src/lib/events.ts` (`getEventsForDate`) i sam komentar u `0003_events_in_range.sql` referenciraju `events_on_date (0002)`. Funkcija je u Fazi 4, Dan 1 očito primijenjena izravno kroz Supabase SQL Editor, a migracija nikad nije spremljena u repozitorij. Da je repo migracije primijenjen na svježu bazu (npr. da je odabrana strategija "novi produkcijski Supabase projekt"), `/` i `/sutra` bili bi potpuno slomljeni (RPC funkcija ne postoji).

**Odluka:**
Umjesto nagađanja, zatražena je stvarna definicija iz Supabase baze (`select pg_get_functiondef('events_on_date'::regproc)`) i spremljena bez izmjena kao `supabase/migrations/0002_events_on_date.sql`. Otkriveno je da `events_on_date` NE castа `start_at` na datum (kako je pogrešno tvrdio komentar u `0003`), nego uspoređuje `start_at >= /< ` s Europe/Zagreb ponoćnim granicama dana — ispravljen i taj komentar u `0003`.

**Razmotrene alternative:**
- Rekonstrukcija po analogiji s `0003` (cast na datum) — odbačeno nakon što je stvarna definicija pokazala drugačiji (ispravan) pristup; nagađanje bi ovdje uvelo suptilnu razliku u ponašanju oko granica dana koja ne bi bila odmah uočena testiranjem.

**Posljedice:**
Migracije u repozitoriju sada su potpune i primjenjive na svježu bazu (bitno ako se ikad odluči za odvojeni prod Supabase projekt umjesto dev=prod pristupa — vidi CHANGELOG Faza 8, Dan 6). Ubuduće: svaka SQL izmjena kroz Supabase dashboard mora odmah dobiti pripadajuću migraciju u repu, ne naknadno.

---

## ADR-011: Ažuriranje prema master promptu v2 — naziv, search, javna prijava
**Datum:** 2026-07-16
**Status:** Prihvaćeno

**Kontekst:**
Korisnik je dostavio ažuriranu verziju master prompta (v2, izvorno pod radnim nazivom "KAM DENES"), s razlikama u odnosu na v1 iz kojeg su nastali `PROJECT_BRIEF.md`/`DECISIONS.md`. Tri stavke izravno diraju već donesene odluke ili identitet projekta i traže eksplicitnu potvrdu prije unosa u dokumentaciju.

**Odluka:**
1. **Naziv:** Radni naziv mijenja se drugi put — "Kam ve iti" → "Kam denes" (stil: velika prva riječ, kao i prije). Ažurirano posvuda u kodu (metadata, UI tekst, `package.json`), `README.md`, `PROJECT_BRIEF.md`. Domena `kamdenes.hr` iz v2 još nije kupljena — ostaje plan, ne mijenjamo `NEXT_PUBLIC_SITE_URL`/Vercel domain postavke dok stvarno ne postoji. GitHub repo i Vercel projekt (trenutno `kam-ve-iti`) namjerno NISU preimenovani u ovom koraku — to je infrastrukturna promjena s vlastitim rizicima (rewrite URL-ova, mogući downtime) koju korisnik provodi zasebno kad odluči.
2. **Pretraživanje (search):** Eksplicitno izbačeno, ne ide čak ni u backlog — korisnik je to zatražio nakon što je ADR-008 filter po kategoriji/lokaciji ocijenjen dovoljnim za trenutnu veličinu baze.
3. **Javni obrazac "Prijavi događaj":** Ide u backlog (`PROJECT_BRIEF.md` §11), ADR-004 (unos isključivo putem admina) ostaje na snazi bez izmjena. Prije ikakve implementacije treba nov ADR jer zahtijeva stvarnu role-provjeru (trenutni RLS iz ADR-007 tretira svakog autenticiranog korisnika kao admina — javni obrazac bi to učinio nesigurnim).

Ostale v2 stavke bez sukoba (dugoročna vizija — "najveći lokalni vodič za slobodno vrijeme", backlog ideja poput karte/oznaka/countdowna) dodane su izravno u `PROJECT_BRIEF.md` §10–11 kao referenca za buduće planiranje, bez rasprave jer ne mijenjaju ništa već odlučeno.

**Razmotrene alternative:**
- Čuvati poseban `master-prompt.md` u repu kao treći izvor istine — odbačeno; `PROJECT_BRIEF.md` + `DECISIONS.md` + `CHANGELOG.md` već služe toj svrsi od Faze 1, dodatna datoteka bi značila dvostruko održavanje istog sadržaja.
- Preimenovati i GitHub repo/Vercel projekt odmah — odbačeno za sada; nema kupljene domene na koju bi se prešlo, pa bi preimenovanje samo promijenilo jedan `.vercel.app` URL u drugi bez stvarne koristi, uz rizik (postojeći linkovi/bookmarci na `kam-ve-iti.vercel.app`).

**Posljedice:**
Kod i dokumentacija dosljedno koriste "Kam denes". README napominje da infrastruktura (repo/Vercel/domena) čeka preimenovanje. Kad domena `kamdenes.hr` bude kupljena, treba: preimenovati Vercel projekt, dodati custom domenu, ažurirati `NEXT_PUBLIC_SITE_URL`, po želji preimenovati GitHub repo (mijenja git remote URL za sve lokalne kopije).

---
_Format za nove zapise:_
```
## ADR-00X: [naslov odluke]
**Datum:**
**Status:** Prihvaćeno / Odbačeno / Zamijenjeno ADR-00Y
**Kontekst:**
**Odluka:**
**Razmotrene alternative:**
**Posljedice:**
```
