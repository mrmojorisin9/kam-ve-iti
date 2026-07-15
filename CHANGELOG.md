# Changelog

Svi značajniji zapisi promjena u ovom projektu bilježe se u ovoj datoteci.
Format se temelji na [Keep a Changelog](https://keepachangelog.com/), a projekt prati [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed
- Radni naziv projekta promijenjen: **Međimurje Events → Kam ve iti** (uključuje `package.json`, metadata stranice, README, PROJECT_BRIEF.md).

### Added
- Definiran master prompt i pravila razvoja projekta (uloga AI partnera, tehnološki stack, faze razvoja, način komunikacije).
- Uspostavljen sustav praćenja tehničkih odluka (`DECISIONS.md`) i promjena (`CHANGELOG.md`).
- Kreiran `PROJECT_BRIEF.md` (v0.1) — problem, ciljana publika, MVP opseg za v1, ne-funkcionalni zahtjevi, otvorena pitanja (Faza 1).
- Riješena sva otvorena pitanja iz `PROJECT_BRIEF.md`: 8 kategorija događanja (ADR-005), cijela županija od starta (ADR-004), ručni + CSV unos bez AI (ADR-004).
- **Faza 2, Dan 1 — inicijalizacija projekta:** Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS 4, ESLint + Prettier (`prettier-plugin-tailwindcss`), osnovna struktura `src/app`, `src/components`, `src/lib`, `src/types`, Git repozitorij s prvim commitom (ADR-006).
- **Faza 2, Dan 2 — env varijable i deploy priprema:** `.env.example` (Supabase placeholderi za Fazu 3, `NEXT_PUBLIC_SITE_URL`), `.gitignore` iznimka za `.env.example`, dokumentiran Vercel deploy tok u README-u. Faza 2 dovršena.
- **Faza 3, Dan 1 — dizajn podatkovnog modela:** `supabase/migrations/0001_init_schema.sql` (tablice `categories`, `locations`, `events`, `event_status` enum, indeksi, RLS politike) i `supabase/seed.sql` (8 kategorija, 25 lokacija cijele županije). Vidi ADR-007. Migracija još nije primijenjena na stvarni Supabase projekt.
- **Faza 3, Dan 2 — Supabase klijent:** instaliran `@supabase/supabase-js` + `@supabase/ssr`, `src/lib/supabase/client.ts` (Client Components) i `server.ts` (Server Components/Actions), `.env.example` ažuriran na trenutnu publishable/secret terminologiju. `tsc --noEmit` i lint prolaze čisto.
- **Faza 4, Dan 1 — javni portal, pregled "danas":** dizajn tokeni (tamna vinogradska paleta, Space Grotesk + Geist), `events_on_date()` SQL funkcija (Europe/Zagreb dan-granice, DST-safe), `src/lib/events.ts` + `format.ts`, `EventRow`/`EmptyState` komponente, prava (trenutno prazna) početna stranica. Potvrđeno da radi lokalno s pravom Supabase bazom.
- **Faza 4, Dan 2 — stranica pojedinog događaja:** `src/app/dogadjaji/[slug]/page.tsx` (dinamička ruta, `generateMetadata`, `notFound()` za nepostojeći/neobjavljeni slug), `getEventBySlug()` u `src/lib/events.ts` (omotan u React `cache()` radi izbjegavanja dvostrukog upita metadata/stranica), `formatEventDateTime`/`formatEventEnd` u `src/lib/format.ts`.
- **Faza 4, Dan 3 — "vikend" i "tjedan":** `supabase/migrations/0003_events_in_range.sql` (`events_in_range` SQL funkcija), `weekendRangeInZagreb()`/`weekRangeInZagreb()` u `src/lib/events.ts`, `RangeView` komponenta (grupiranje po danu), rute `/vikend` i `/tjedan`. Refaktoring: izvučen `PageHeader` iz `DayView`-a radi dijeljenja s `RangeView`-om.
- **Faza 4, Dan 4 — filtriranje po kategoriji i lokaciji:** `FilterBar` komponenta (obični `<form method="get">`, bez JS-a), `getCategories()`/`getLocations()` i filtriranje u `src/lib/events.ts` (aplikacijski sloj — ADR-008), query parametri `?kategorija=`/`?lokacija=` na sve 4 rute. Bugfix: `EmptyState` tekst generaliziran (prije hardkodirano "Danas nema...", pogrešno za /vikend i /tjedan).
- **Faza 5, Dan 1 — admin prijava:** `src/proxy.ts` (Next.js 16 preimenovao `middleware.ts` u `proxy.ts` — vidi node_modules/next/dist/docs) osvježava Supabase session cookie i optimistički štiti `/admin/*`; `src/app/admin/login` (forma + `signInWithPassword` Server Action, poruka o pogrešci kroz `?error=`); ruta `/admin` u `(protected)` route grupi s vlastitom provjerom sesije u layoutu (obrana u dubinu — provjera blizu podataka, ne samo u proxyju) i "Odjava" akcijom. Nema signup forme (ADR-007: admin računi se kreiraju ručno u Supabase dashboardu, javna registracija ostaje isključena).
### Fixed
- GitHub secret scanning blokirao push jer je stvarni Supabase secret key greškom završio u `.env.example` umjesto `.env.local` — očišćeno, ključ nikad nije stigao na remote.
- `.env.local` sadržavao dupliciranu/spojenu verziju varijabli (stari prazan predložak zalijepljen ispod novih vrijednosti) — kod dupliciranih `.env` varijabli zadnja definicija pobjeđuje, pa je prazna verzija odozdo prepisivala stvarni URL. Ubuduće: `.env.local` se puni SAMO stvarnim vrijednostima, bez ostataka predloška.

---
_Napomena: svaki dovršeni zadatak dobiva svoj zapis ovdje, grupiran po danu/verziji (npr. `## [0.1.0] - 2026-07-15`). Kategorije: Added / Changed / Fixed / Removed / Security._
