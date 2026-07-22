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
**Status:** Zamijenjeno ADR-013

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

## ADR-012: OG slika po file-konvenciji ne stiže do stranica koje override-aju `openGraph`
**Datum:** 2026-07-16
**Status:** Prihvaćeno

**Kontekst:**
Dodana `src/app/opengraph-image.tsx` (Next.js file-based OG image konvencija, `next/og` `ImageResponse`) trebala je automatski ubrizgati `<meta property="og:image">` na svim javnim stranicama. Ruta `/opengraph-image` je ispravno generirala sliku (potvrđeno direktnim pozivom i vizualnim pregledom), ali `og:image` tag se nije pojavljivao ni na jednoj stvarnoj stranici (provjereno `curl` na `<head>`). Uzrok: sve četiri javne rute i stranica događaja već definiraju vlastiti `openGraph: { title, description, url }` metadata objekt (Faza 8, Dan 1). Next.js metadata "Merging" pravilo (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`) kaže da su ugniježđena polja poput `openGraph` **shallow merge-ana po segmentu, ne duboko** — segment koji definira `openGraph` u potpunosti zamjenjuje roditeljski `openGraph` objekt, uključujući automatski ubrizganu `images` vrijednost iz file-konvencije korijenskog layouta.

**Odluka:**
Svaka stranica koja definira vlastiti `openGraph` objekt mora eksplicitno navesti `images` polje: `images: ["/opengraph-image"]` za generičke stranice (`/`, `/sutra`, `/vikend`, `/tjedan`), `images: [event.image_url ?? "/opengraph-image"]` za stranicu događaja (prioritet vlastitoj slici događaja, fallback na site-wide sliku kad `image_url` nije postavljen).

**Razmotrene alternative:**
- Ukloniti page-level `openGraph` override i osloniti se isključivo na root layout — odbačeno; gubi se per-stranica `og:title`/`og:description` (bitno za SEO/social-sharing svake pojedine rute), bez sigurnosti da bi Next.js auto-derivirao te vrijednosti iz top-level `title`/`description` bez eksplicitnog `openGraph` objekta.

**Posljedice:**
Svaka buduća nova javna ruta koja definira vlastiti `openGraph` objekt mora ručno dodati `images` polje — file-konvencija (`opengraph-image.tsx`) sama po sebi to više ne pokriva čim stranica ima svoj `openGraph` override. Vrijedi i za buduću dinamičku po-događaju OG sliku ako se ikad implementira (PROJECT_BRIEF backlog).

---

## ADR-013: Kategorije v2 — 6 kategorija za trorazinski filter sustav
**Datum:** 2026-07-20
**Status:** Prihvaćeno

**Kontekst:**
Uvodi se napredni trorazinski filter sustav (tematska kategorija + mikro-lokacija + pametni filtri raspoloženja/logistike). Korisnik je za Razinu 1 (kategorija) dostavio novi popis od 6 stavki koji se ne poklapa s ADR-005 (8 kategorija): "Obitelj i djeca" izlazi kao zaseban filtar (postaje pametni tag `is_family_friendly` u budućoj shemi), "Ostalo" ventil se uklanja, "Manifestacije i fešte" postaje "Velike Manifestacije", a preostale četiri dobivaju nove dvočlane nazive (npr. "Kultura & Kazalište").

**Odluka:**
6 kategorija, redom (`sort_order`): Glazba & Party · Kultura & Kazalište · Sport & Rekreacija · Gastro & Wine · Edukacija & Radionice · Velike Manifestacije. Provedeno kao `UPDATE` (preimenovanje) na 6 postojećih redaka + `DELETE` na "obitelj-i-djeca"/"ostalo" (`supabase/migrations/0006_kategorije_v2.sql`), ne kao drop-and-recreate — prije brisanja potvrđeno upitom da 0 događaja u produkciji koristi ta dva sluga, pa nije bilo potrebe za re-tagiranjem postojećih podataka. Slugovi ostalih 6 kategorija namjerno nisu mijenjani (samo `name`/`sort_order`) da postojeći `?kategorija=` linkovi ne puknu.

**Razmotrene alternative:**
- Zadržati 8 kategorija i samo vizualno skratiti prikaz (kao `CARD_LABELS` iz Faze 8 Dan 19) — odbačeno; korisnik eksplicitno traži da "Obitelj i djeca" postane pametni filtar (multiselect tag), ne kategorija, što je stvarna promjena taksonomije, ne samo prikaza.
- Zadržati "Manifestacije i fešte" kao naziv — odbačeno; "Velike Manifestacije" nosi drugačiju semantiku (razmjer/poznatost događaja, izravno suprotstavljeno "Skrivenim draguljima" iz Razine 3 pametnih filtara), korisnikov izbor naziva to odražava.

**Posljedice:**
Broj kategorija (6) ostaje unutar preporučenog raspona iz ADR-005 (5–9) pa se UI logika za prikaz (grid/pill red) ne mijenja zbog broja stavki. `src/components/CategoryIcon.tsx` gubi `IconObitelj` funkciju i `obitelj-i-djeca`/`ostalo` unose u mapi ikona (mrtav kod nakon brisanja kategorija). "Obitelj i djeca" i "Ostalo" kao koncepti ne nestaju iz produkta — prvo postaje pametni filtar (Razina 3, buduća shema), drugo se namjerno gasi bez zamjene (ventil se pokazao nepotrebnim, 0 iskorištenih događaja u praksi).

---

## ADR-014: Popularity score — anonimno praćenje interakcija i automatske oznake
**Datum:** 2026-07-20
**Status:** Prihvaćeno

**Kontekst:**
Korisnik želi da portal automatski prepoznaje i ističe popularne/aktualne događaje (bez ručne kuracije, bez registracije korisnika) — oznake 🎉/🔥/⭐/📈, sortiranje unutar novog panela na naslovnici, temeljeno na stvarnoj interakciji posjetitelja.

**Odluka:**
- **Praćenje:** `event_interactions` tablica (append-only, `event_id`, `interaction_type` text s CHECK-om, `created_at`) bez ikakve identifikacije posjetitelja — nema kolačića/sesije/IP-a. RLS dopušta javni INSERT, ne i SELECT (agregacija ide preko `security definer` SQL funkcije, ne izravnim čitanjem). v1 prati samo `'view'` (otvaranje stranice događaja); `interaction_type` kao text (ne enum) čini dodavanje "share"/"calendar_add" jednolinijskom migracijom kasnije.
- **Formula:** `score = (Σ raspadnutih pregleda, poluživot 7 dana) × faktor_aktualnosti(start_at, poluživot 3 dana za nadolazeće)`. Izračun u SQL-u (ne aplikacijskom sloju) jer je agregacija nad potencijalno velikim brojem redaka prirodno zadatak baze, ne JS-a — iznimka od uobičajenog ADR-008 pristupa (filtriranje u app sloju), ali ADR-008 govori o filtriranju po kategoriji/regiji/tagovima nad već dohvaćenim retcima, ne o agregatnom izračunu preko log tablice.
- **Oznake (percentil trenutno prikazanih događaja, ne fiksni apsolutni pragovi):** 🎉 najviši rezultat idućih 7 dana, 🔥 top 10%, ⭐ top 25% (ispod 🔥 praga), 📈 stvarni trend (pregledi zadnja 3 dana > prethodna 3 dana), ne samo visok rezultat.
- **Kronološke liste (danas/sutra/vikend/tjedan) ostaju sortirane po `start_at`** — popularity score se koristi samo za oznake na karticama i za novi zaseban panel na naslovnici, ne mijenja temeljni redoslijed "što je danas na rasporedu".
- **Zaštita od zloupotrebe:** namjerno izostavljena u v1 (mali lokalni portal, nizak stvarni rizik) — ako se pokaže problem, dodaje se rate-limiting naknadno.

**Razmotrene alternative:**
- Deduplikacija posjetitelja (kolačić/sesija) — odbačeno, korisnik eksplicitno traži rješenje bez registracije/identifikacije, a session-tracking infrastruktura ne postoji nigdje drugdje u portalu.
- Fiksni apsolutni pragovi za oznake (npr. "score > 50 = 🔥") — odbačeno, zahtijeva stalno ručno podešavanje kako baza raste; percentilni pristup se sam prilagođava.
- Popularity score mijenja redoslijed glavnih kronoloških lista — odbačeno, portal je fundamentalno "što je danas na rasporedu" alat (Faza 4, Dan 1), miješanje s popularnošću bi zbunilo osnovnu svrhu.

**Posljedice:**
Prvi javni (neautenticirani) upisni put u portalu — RLS mora eksplicitno dopustiti anon INSERT na `event_interactions`, po prvi put izvan dosadašnjeg "javnost samo čita" obrasca. Buduće proširenje (share/calendar tracking, drugi kriteriji) zahtijeva samo novi `interaction_type` red u CHECK-u i eventualno novu težinu u formuli, ne novu shemu.

---

## ADR-015: Ručni admin odabir "TOP događaja" u panelu "U trendu"
**Datum:** 2026-07-20
**Status:** Prihvaćeno

**Kontekst:**
Korisnik želi da administrator, uz automatski popularity score (ADR-014), može ručno istaknuti jedan događaj po vlastitom izboru u panelu "U trendu" na naslovnoj — konzistentno s ADR-002 (ljudska provjera prije objave, human-in-the-loop) proširenim i na isticanje, ne samo objavu.

**Odluka:**
- `events.is_admin_featured` boolean stupac (`0012_admin_featured_event.sql`), zadano `false`.
- **Samo jedan događaj smije biti istaknut u isto vrijeme** — provodi se u aplikacijskom sloju (`clearOtherAdminFeatured()` u `src/lib/admin-events.ts`, poziva se prije svakog upisa/izmjene koja postavlja `is_admin_featured: true`), ne DB constraintom (partial unique index) — jednostavnije, dovoljno za jednog kuratora bez konkurentnih pisanja u isto vrijeme (isti duh kao ADR-006).
- Admin-istaknut događaj **uvijek zauzima prvo mjesto** u panelu "U trendu" (`getTrendingPanelEvents()`), bez obzira na vlastiti popularity_score — ostatak popunjava algoritam (`getTopPopularEvents()`), bez dupliciranja.
- Dobiva zasebnu, transparentnu oznaku **📌 Urednički izbor** (peti `PopularityBadge`), vizualno odvojenu od 4 algoritamske oznake (ADR-014) — korisnici portala trebaju moći razlikovati "ovo je algoritam izračunao" od "ovo je uredništvo odabralo".
- Istaknuti događaj mora biti nadolazeći (`start_at >= now()`) i objavljen da bi se prikazao — prošao/neobjavljen admin izbor jednostavno nestaje iz panela bez potrebe za pozadinskim zadatkom koji bi to čistio.

**Razmotrene alternative:**
- DB partial unique index za "samo jedan featured" — odbačeno kao prerana kompleksnost za jednog administratora; app-layer provjera je dovoljna i lakše razumljiva.
- Admin odabir bez posebne oznake (samo prvo mjesto, bez 📌) — odbačeno, netransparentno bi izgledalo kao da je događaj "najpopularniji" kad je zapravo ručni izbor.

**Posljedice:**
`src/components/admin/EventForm.tsx` dobiva treće fieldset polje (uz pametne filtre i status) za ovu opciju; `novi/actions.ts` i `uredi/actions.ts` pozivaju `clearOtherAdminFeatured()` prije upisa. Ako se u budućnosti doda drugi kurator (ADR-007 rizik — svaki autenticirani korisnik je admin), "posljednji pobjeđuje" ponašanje ovog jednostavnog pristupa ostaje prihvatljivo dok postoji samo jedan stvarni administrator.

---

## ADR-016: Javni obrazac "Prijavi događaj" — anon INSERT s pooštrenim RLS i column-level zaštitom kontakta
**Datum:** 2026-07-21
**Status:** Prihvaćeno

**Kontekst:**
PROJECT_BRIEF §5/§11 i ADR-011 stavljali su javni obrazac "Prijavi događaj" u backlog dok se ne donese novi ADR — sudarao se s ADR-004 (unos isključivo putem admina) i ADR-007 (RLS pretpostavlja "svaki autenticirani korisnik = admin", nema role-provjere). Korisnik sad traži da bilo koji posjetitelj bez registracije može predložiti događaj, uz zadržan human-in-the-loop princip (ADR-002): prijedlog ostaje `pending_review` dok ga admin ručno ne odobri/odbije kroz postojeći edit flow (`/admin/dogadjaji/[id]/uredi`, već ima status dropdown — ne treba nova admin queue stranica, samo lakše filtriranje).

**Odluka:**
- Prijedlozi idu izravno u `events` s `status='pending_review'` (postojeći `event_status` enum, ADR-007), ne u zasebnu staging tablicu — iskorištava infrastrukturu koja već postoji upravo za ovaj scenarij.
- Dva nova nullable stupca: `submitter_email` (obavezan na razini forme/Server Actiona, ne DB constrainta — isti obrazac kao `image_url` obaveznost, ADR iz Faze 8 Dan 13), `submitter_phone` (opcionalan). Null za sve postojeće admin-unesene događaje.
- **RLS `WITH CHECK` je stvarna granica sigurnosti, ne Next.js forma** — Supabase REST API je izravno dostupan bilo kome s anon (publishable) ključem, forma i Server Action se mogu zaobići izravnim POST-om. Nova politika `events_public_submit` (`for insert to anon`) provjerava `status = 'pending_review' and is_admin_featured = false and created_by is null` — bez obzira što klijent pošalje, red koji ne zadovoljava ta tri uvjeta se odbija. Sprječava anonimnog pošiljatelja da izravno objavi (`status='published'`), samoistakne (`is_admin_featured=true`, zaobilazeći ADR-015 "samo jedan admin izbor") ili se lažno predstavi kao admin-unos (`created_by` postavljen).
- **Column-level `REVOKE SELECT (submitter_email, submitter_phone) FROM anon`** — nezavisno od RLS-a. Postojeća `events_public_read_published` politika je row-level ("javnost vidi objavljene retke"), ne column-level ("javnost vidi ova polja") — bez eksplicitnog REVOKE-a, čim admin odobri prijedlog (status → published), bilo tko bi preko API-ja mogao upitati baš te dvije kolone i dobiti kontakt podatke prijavitelja koji su bili namijenjeni isključivo adminu.
- Captcha: jednostavno računsko pitanje generirano server-side (dva broja kao skriveni inputi + vidljivo polje za odgovor), obična usporedba na serveru — namjerno bez kriptografskog potpisa/HMAC-a i bez vanjskog servisa (reCAPTCHA i sl.), u duhu ADR-006 ("ne uvoditi tehnologiju/ovisnost bez razloga za problem ove veličine" — mali lokalni portal, cilj je generički bot promet, ne ciljani napad).
- Fotografija u javnoj formi: samo `image_url` polje, opcionalno (za razliku od admin forme gdje je obavezno, Dan 13/22) — bez uploada datoteke, postojeći `event-images` Storage bucket namjerno se ne dira (zahtijeva `authenticated`, otvaranje anon uploada je zaseban, veći sigurnosni rizik izvan opsega ovog zadatka).
- Javna forma je uža od admin forme: naslov, kategorija, lokacija, početak, kraj (opcionalno), opis, mjesto održavanja, URL fotografije (opcionalno), e-mail*, telefon (opcionalno). Bez `organizer_contact`/`source_url`/status polja — to admin po potrebi dopunjuje pri odobravanju.

**Razmotrene alternative:**
- Zasebna staging tablica za prijedloge, kopiranje u `events` tek pri odobrenju — odbačeno; `event_status` enum je od ADR-007 nadalje eksplicitno predviđen za točno ovaj scenarij, staging tablica bi duplicirala shemu i zahtijevala dodatan korak kopiranja bez stvarne koristi za portal ove veličine.
- Prava role-provjera (posebna `profiles`/`roles` tablica) prije javnog upisa — odbačeno, isto obrazloženje kao ADR-007: prerana kompleksnost dok postoji samo jedan/nekoliko povjerenih admina; anonimni upis se ovdje ionako ne oslanja na role-razlikovanje nego na RLS `WITH CHECK` koji ne ovisi o identitetu pošiljatelja.
- reCAPTCHA ili slična vanjska captcha usluga — odbačeno, dodaje vanjsku ovisnost i trošak za razinu zaštite koja ovdje nije potrebna (ADR-006 duh); jednostavno računsko pitanje dovoljno je protiv generičkih botova.
- Oslanjanje isključivo na RLS row-level politiku bez column-level REVOKE-a — odbačeno nakon što je analiza pokazala konkretan scenarij curenja podataka (kontakt prijavitelja čitljiv nakon objave) koji row-level RLS sam po sebi ne pokriva.

**Posljedice:**
Prvi anonimni upisni put u `events` tablicu (dosad su anon INSERT-i postojali samo na `event_interactions`, ADR-014 — bez osjetljivih podataka). Admin edit forma (`EventForm.tsx`) treba prikazati `submitter_email`/`submitter_phone` (samo autenticirano, Dan 3) i trenutno joj nedostaje "Odbijeno" (`rejected`) opcija u statusnom dropdownu (`STATUS_OPTIONS`) — uočeno pri reviewu postojećeg admin flowa, popravlja se u Danu 3 uz ostatak admin strane. Buduće izmjene RLS politika na `events` moraju uzeti u obzir da sad postoje dvije INSERT politike (`events_admin_full_access` za authenticated, `events_public_submit` za anon) s različitim `WITH CHECK` uvjetima — ne smiju se stopiti bez pažljive provjere da admin i dalje može postavljati `status='published'`/`is_admin_featured=true` slobodno.

**Ispravak (isti dan, otkriven uživo testiranjem):** `revoke select (submitter_email, submitter_phone) on events from anon;` iz `0014` pokazao se **neučinkovitim** — service-role/anon test skripta potvrdila je da je anon i dalje mogao pročitati obje kolone na objavljenom događaju. Uzrok je dokumentirana Postgres zamka: anon je SELECT na `events` imao dodijeljen na razini cijele tablice (Supabase to radi automatski pri kreiranju tablice), a column-level REVOKE ne oduzima pristup koji dolazi kroz taj širi table-level grant — mora se prvo ukloniti table-level SELECT pa eksplicitno dodijeliti SELECT na dopuštene kolone. Ispravljeno u `0015_fix_events_column_privileges.sql` (`revoke select on events from anon` + `grant select (...)` s eksplicitnim popisom svih kolona osim `submitter_email`/`submitter_phone`). Posljedica za buduće migracije: otkad je ovo primijenjeno, **svaki novi stupac na `events` mora biti eksplicitno dodan na `grant select (...)` popis** da bude javno čitljiv — automatsko nasljeđivanje preko table-level granta više ne vrijedi za anon rolu na ovoj tablici.

---

## ADR-017: Nova kategorija "Društvo" — 7. kategorija, dopunjuje ADR-013
**Datum:** 2026-07-21
**Status:** Prihvaćeno

**Kontekst:**
Korisnik je uočio da trenutnih 6 kategorija (ADR-013) nema mjesto za politička, vjerska i slična događanja (npr. sjednice, prosvjedi, hodočašća, crkveni blagdani, predstavljanja knjiga s društvenom tematikom) — ne uklapaju se prirodno ni u jednu postojeću kategoriju, a "Ostalo" je namjerno uklonjen kao ventil (ADR-013).

**Odluka:**
Dodaje se 7. kategorija: `slug='drustvo'`, `name='Društvo'`, `sort_order=7` (na kraju popisa). Provedeno kao čist `INSERT` (`0016_kategorija_drustvo.sql`), ne kao izmjena postojećih redaka — za razliku od ADR-013 gdje su se mijenjali/brisali postojeći redci, ovdje se ništa ne dira, pa nema rizika za postojeće `?kategorija=` linkove ili podatke. Nova ručno pisana SVG linijska ikona (`IconDrustvo` u `CategoryIcon.tsx`, dvije stilizirane osobe) u istom stilu kao ostalih 6 (ADR-006 — bez ikonografske biblioteke). Sva ostala mjesta (`FilterBar`, `CategoryStrip`, admin `EventForm`, javna `/prijavi-dogadaj` forma) dohvaćaju kategorije dinamički iz baze pa ne trebaju izmjenu koda — nova kategorija se pojavljuje automatski svugdje čim je red u bazi.

**Razmotrene alternative:**
- Uklopiti politička/vjerska događanja u "Velike Manifestacije" ili "Kultura & Kazalište" — odbačeno, korisnik eksplicitno traži zasebnu kategoriju jer se ne uklapaju semantički (velika manifestacija implicira razmjer/poznatost, kultura&kazalište implicira umjetnički sadržaj).
- Širi naziv poput "Društvo & Politika" — odbačeno, korisnik je izričito zatražio kratki naziv "Društvo" koji već prirodno pokriva i vjerski segment bez potrebe za dužim nazivom.

**Posljedice:**
Broj kategorija raste s 6 na 7, i dalje unutar preporučenog raspona za filter UI (5-9, ADR-005). `CategoryStrip` pill red (Dan 29) automatski dobiva 8. pilulu (7 kategorija + "Sve") — horizontalni scroll red već je dizajniran za promjenjiv broj stavki, nema potrebe za dodatnom prilagodbom layouta.

---

## ADR-018: Sigurnosni audit (2026-07-21) — headeri, image upload allowlist, SECURITY DEFINER status-check, rate limit na event_interactions
**Datum:** 2026-07-21
**Status:** Prihvaćeno

**Kontekst:**
Korisnik je zatražio potpuni enterprise-stil sigurnosni audit (OWASP ASVS Level 2 okvir, 20 sekcija: secrets/dependency/Next.js/auth/authz/input-validation/API/HTTP headers/frontend/Vercel/GitHub/DAST/risk-assessment). Statička analiza cijelog `src/`, `supabase/migrations/`, konfiguracije, `npm audit`, `git log` za povijest tajni, i pasivna provjera produkcije (`curl` na headere/robots/sourcemape, bez aktivnog fuzzinga). Puni izvještaj (`SECURITY_AUDIT_2026-07-21.md`, poslan korisniku, nije committan u repo) dao je ocjenu 67/100 bez ijednog Critical/High nalaza — očekivano za mali solo-developer portal bez korisničkih računa, plaćanja ili PII na velikoj skali. Četiri nalaza odabrana za popravak u istoj sesiji, redoslijedom po omjeru učinak/trud:

**Odluka:**

1. **HTTP security headeri** (`next.config.ts`) — dodan `headers()` i `poweredByHeader: false`. Namjerno BEZ `script-src`/`default-src` restrikcije u ovoj iteraciji: Next.js App Router ubrizgava inline hydration `<script>` tagove, a stranica događaja ima vlastiti inline JSON-LD `<script>` (`structured-data.ts`) — stroga CSP bez nonce-a bi ih blokirala bez prethodnog uvida u razmjer promjene. Dodano: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, i CSP ograničen na `frame-ancestors 'none'; base-uri 'self'; form-action 'self'` (ne dira script loading). Uživo provjereno: dev server je hot-reloadao config, `curl` potvrđuje sve headere prisutne i `X-Powered-By` uklonjen, naslovna i stranica događaja (`/dogadjaji/belot`) rendaju bez console grešaka, JSON-LD `<script>` i dalje parsira ispravno.
2. **Image upload allowlist** (`src/lib/admin-events.ts`, `uploadEventImage`) — ekstenzija se prije izvodila iz klijentski poslanog `file.name`, `contentType` iz klijentski poslanog `file.type`, bez provjere; bucket je javan pa bi npr. `.svg` s ugrađenim `<script>`om bio uploadan i javno dostupan na svom URL-u. Popravak: `ALLOWED_IMAGE_TYPES` mapa (`image/jpeg`/`image/png`/`image/webp`) određuje i dopušten tip i ekstenziju — bilo što drugo se odbija prije poziva Storage-u. Rizik je bio nizak već i prije popravka (zahtijeva autenticiranu admin sesiju, ADR-007), ali bi eskalirao da ADR-007 pretpostavka ikad pukne. Uživo provjereno service-role skriptom na stvarnom `event-images` bucketu: legitiman PNG upload i dalje uspijeva i javno je dostupan s ispravnim `content-type`, testna datoteka obrisana nakon provjere.
3. **SECURITY DEFINER status-check** (`event_popularity_score`/`event_is_trending`/`event_view_count`, migracija `0017`) — **CONFIRMED live testom, ne samo čitanjem koda**: service-role je napravio skriven `pending_review` event s 3 lažna pregleda; anon `SELECT` na `events` ispravno vratio prazan niz (RLS radi), ali `anon.rpc('event_view_count', {p_event_id: <taj id>})` vratio **3**, `event_is_trending` **true**, `event_popularity_score` stvaran broj — sve dok je pozivatelj znao/pogodio UUID skrivenog reda. Uzrok: te tri funkcije su SECURITY DEFINER namjerno (bypass RLS na `event_interactions` radi javne agregacije unutar `events_on_date`/`events_in_range`/`top_popular_events`, ADR-014), ali nikad nisu same provjeravale je li `p_event_id` uopće `status='published'` — pozivateljske funkcije to filtriraju PRIJE poziva za interni put, ali izravan RPC poziv (anon.rpc(...) izravno na REST API, mimo liste) tu provjeru nije imao. Popravak: `exists (select 1 from events e where e.id = p_event_id and e.status = 'published')` provjera dodana unutar sve tri funkcije (`CREATE OR REPLACE`, potpis nepromijenjen). Uživo re-testirano nakon primjene: identičan scenarij sad vraća `0`/`false`/`0`, kontrola na `published` eventu i dalje vraća stvaran broj (2).
4. **Rate limit na `event_interactions` insert** (migracija `0018`, ispravljena u `0019`) — anon INSERT je bio potpuno otvoren (`with check (true)`, 0009), bez ikakvog ograničenja; skripta koja ponavlja insert na isti `event_id` može umjetno naduvati popularity_score i 🔥/📈 oznake (ADR-014) i poziciju u "U trendu" panelu. Korisnikova odluka o pragu: **20 upisa / 60 sekundi po jednom `event_id`** (ne po posjetitelju — nema identifikacije, namjerno, ADR-014; ne sprječava distribuirani spam preko više eventa, ali brani naduvavanje jednog konkretnog eventa preko realnog broja pregleda malog regionalnog portala). Implementirano kao `BEFORE INSERT` trigger + kompozitni indeks (`event_id, created_at`).

**Ispravak (isti dan, otkriven uživo testiranjem — isti obrazac kao ADR-016/0014→0015):** prva verzija triggera (`0018`) bila je obična (SECURITY INVOKER) plpgsql funkcija. Live test je pokazao: pozvana kao service-role, ispravno blokira nakon 20 insertova; pozvana kao anon, **svih 25 test-insertova prošlo bez greške**. Uzrok: trigger-ova vlastita `select count(*) from event_interactions ...` izvršava se s privilegijama pozivatelja (anon), a anon nema NIKAKVU SELECT politiku na `event_interactions` (samo INSERT, namjerno, ADR-014/0009) — RLS je triggeru vraćao 0 redaka bez obzira koliko ih stvarno postoji, limit se nikad nije mogao dosegnuti. Popravljeno u `0019`: funkcija postaje `SECURITY DEFINER` (isti obrazac kao #3 gore), broji retke s privilegijama vlasnika funkcije bez izlaganja redaka pozivatelju. Uživo re-testirano: točno 20 anon insertova uspijeva, 21. odbijen s očekivanom porukom, stvaran broj redaka u bazi = 20, normalno praćenje jednog pregleda (`ViewTracker` scenarij) i dalje radi bez greške.

**Razmotrene alternative:**
- Stroža CSP (`script-src 'self'` bez `unsafe-inline`) odmah u prvoj iteraciji — odbačeno, prevelik rizik slomiti JSON-LD/hydration bez nonce-infrastrukture i opsežnog testiranja svih ruta; ostavljeno kao poznat sljedeći korak.
- Rate limit po IP-u/posjetitelju umjesto po eventu — odbačeno, zahtijevao bi identifikaciju posjetitelja koju ADR-014 eksplicitno izbjegava, ili vanjsku infrastrukturu (npr. Upstash Redis za Vercel serverless shared state) — nova ovisnost protiv ADR-006 duha dok postojeći per-event pristup dovoljno brani stvarno napadnutu površinu.
- reCAPTCHA ili slična vanjska captcha usluga za `/prijavi-dogadaj` (spomenuto u audit izvještaju kao mogući popravak za trivijalno zaobilazivu captchu) — nije primijenjeno u ovoj sesiji, ostaje otvorena stavka niskog prioriteta.

**Posljedice:**
Tri migracije u repozitoriju (`0017`, `0018`, `0019`), sve primijenjene ručno u Supabase SQL Editoru. `next.config.ts` i `src/lib/admin-events.ts` izmijenjeni. Preostale stavke iz punog audit izvještaja (potpisana/HMAC captcha na `/prijavi-dogadaj`, ujednačen error-handling u admin Server Actions, `poweredByHeader`/CSP daljnje pooštravanje sa nonce-ovima, Dependabot, ručna provjera Vercel Preview/Production env razdvojenosti i Supabase Auth rate-limit postavki) ostaju u backlogu, nisu dio ove ADR odluke. **Metodološka pouka potvrđena drugi put u ovom projektu**: SECURITY DEFINER/RLS interakcije (i sad: trigger-privilege/RLS interakcije) se moraju live testirati service-role+anon skriptom prije nego se bilo koji nalaz proglasi zatvorenim — statička analiza koda nije dovoljna niti za pronalaženje niti za potvrdu popravka takvih problema.

**Dopuna (2026-07-21, ručno potvrđeno u Supabase Dashboardu od strane korisnika):** Authentication → Providers/Settings — javna registracija (email signup) je **isključena**. Ovim je potvrđeno da ADR-007 pretpostavka ("svaki autenticirani Supabase Auth korisnik = admin") trenutno vrijedi bez rizika neovlaštene registracije — poznat rizik iz ADR-007 od 2026-07-14 prvi put stvarno provjeren, ne samo pretpostavljen. Rate limit na sign in/sign up pokušajima: **30 pokušaja / 5 minuta (do 360/sat)** — Supabase GoTrue default, dovoljna osnovna brute-force zaštita za jedan admin račun s jakom lozinkom (nije mijenjano, procijenjeno kao razumno za trenutni opseg). Ovim je zatvorena posljednja "Nije potvrđeno" stavka iz sigurnosnog audita (§16 nalaz #8 / §20 akcijski plan, izvještaj 2026-07-21) — nema koda za promijeniti, samo verifikacija postojeće postavke.

**Dopuna (2026-07-22) — globalni rate limit na javne prijave događaja (`/prijavi-dogadaj`):** posljednja preostala stavka iz audit nalaza #2/#3 (captcha na javnoj formi je trivijalno zaobrediva — brojevi u hidden inputima, vidljivi u HTML izvoru — i sam insert nije imao ikakav rate limit). Za razliku od `event_interactions` (0018/0019), svaka javna prijava stvara NOVI red u `events` — nema zajedničkog `event_id` na koji bi se vezao per-row trigger — pa je ovo **globalni** prag preko svih anon prijava zajedno, ne po posjetitelju (nema identifikacije, isti duh kao ADR-014). Korisnikova odluka o pragu: **5 prijava / 10 minuta, globalno**. Trigger (`0020_public_submission_rate_limit.sql`) prepoznaje "javnu prijavu" po istom obrascu koji već zahtijeva RLS `WITH CHECK` politika `events_public_submit` (0014): `status = 'pending_review' AND created_by IS NULL` — admin ručno postavljen "Na čekanju" status uvijek ima `created_by` postavljen, pa se ne računa u prag. Funkcija je postavljena **`SECURITY DEFINER` od početka** (naučeno iz 0018→0019 iste-dan greške): anon nema nikakvu SELECT politiku na `events` za status različit od `published`, pa bi obična (SECURITY INVOKER) trigger funkcija bila RLS-blind na isti način kao prošli put — ovaj put je to ugrađeno u prvu verziju migracije, ne otkriveno naknadno live testom.

Uživo provjereno service-role+anon skriptom: 7 uzastopnih anon prijava — točno 5 uspješnih, 6. odbijena s očekivanom porukom ("public event submission rate limit exceeded"), 7. također odbijena. Nakon service-role čišćenja test-redaka, jedna nova anon prijava opet prolazi bez greške (limit je dinamičan, ne trajno zaključan). Test-skripta prvotno je pogrešno prijavila RLS grešku na SVIH 7 pokušaja zbog vlastite greške (`.select()` nakon anon inserta pokušava pročitati natrag `pending_review` red, što RLS SELECT politika ne pokriva — identična zamka kao ona dokumentirana u CHANGELOG-u za `submitEvent` samu, Dan 45) — ispravljeno uklanjanjem `.select()` iz test-skripte (ne iz aplikacijskog koda, koji to već ispravno izbjegava), nakon čega je test ispravno pokazao 5/6/7 ponašanje. Nema izmjene u `src/app/prijavi-dogadaj/actions.ts` — postojeće rukovanje greškama (generička poruka za bilo koju grešku osim 23505 sudara sluga) već ispravno pokriva i ovaj novi slučaj.

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
