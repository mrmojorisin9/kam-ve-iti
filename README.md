# Kam denes

Web portal koji objedinjuje sva javno dostupna događanja na području
Međimurske županije na jednom mjestu.

Projektna dokumentacija (problem, opseg, arhitekturne odluke) živi izvan ovog
foldera — vidi `PROJECT_BRIEF.md`, `DECISIONS.md` i `CHANGELOG.md` u korijenu
repozitorija.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com)
- ESLint (`eslint-config-next`) + Prettier

## Baza podataka (Supabase)

1. Kreiraj projekt na [database.new](https://database.new)
2. U **SQL Editor** pokreni redom: `supabase/migrations/0001_init_schema.sql`, zatim `supabase/seed.sql`
3. Iz **Project Settings → API Keys** popuni `.env.local` (vidi `.env.example` za objašnjenje svake varijable)
4. TypeScript tipovi generiraju se iz sheme, ne pišu se ručno:
   ```bash
   npx supabase login
   npx supabase gen types typescript --project-id TVOJ-PROJECT-REF > src/types/database.ts
   ```

## Environment varijable

```bash
cp .env.example .env.local
```

Trenutno nema obaveznih vrijednosti za popuniti (Supabase dolazi u Fazi 3) —
`.env.local` je pripremljen unaprijed da se izbjegne dodatni korak kasnije.
Vidi komentare u `.env.example` za objašnjenje svake varijable.

## Pokretanje

Preduvjet: Node.js 20+ (preporučeno 22 LTS).

```bash
npm install
npm run dev
```

Otvori [http://localhost:3000](http://localhost:3000).

## Skripte

| Skripta                | Opis                                  |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | razvojni server (Turbopack)           |
| `npm run build`        | produkcijski build                    |
| `npm run start`        | pokretanje produkcijskog builda       |
| `npm run lint`         | ESLint provjera                       |
| `npm run format`       | Prettier — automatsko formatiranje    |
| `npm run format:check` | Prettier — samo provjera, bez pisanja |

## Struktura foldera

```
src/
  app/         Next.js App Router — rute i layouti
  components/  Ponovno iskoristive React komponente
  lib/         Poslovna logika, budući Supabase klijent, upiti, helperi
  types/       Zajednički TypeScript tipovi
```

## Status

Live: [kam-ve-iti.vercel.app](https://kam-ve-iti.vercel.app) — GitHub repo,
Vercel projekt i domena (planirano: `kamdenes.hr`, još nekupljena) i dalje
čekaju preimenovanje u "Kam denes" na razini infrastrukture; kod i
dokumentacija su već ažurirani (vidi `CHANGELOG.md`). Faze 1–5 (portal,
admin sustav) i Faza 8 (SEO, pristupačnost, deploy) dovršene — vidi
`CHANGELOG.md` za detalje i `PROJECT_BRIEF.md` za pregled svih faza.

## Deploy

Hosting: [Vercel](https://vercel.com), spojen izravno na ovaj GitHub
repozitorij.

- Push na `main` → produkcijski deploy.
- Svaki branch / pull request → automatski preview deploy s vlastitim URL-om.
- Environment varijable (kad zatrebaju, od Faze 3) postavljaju se u
  Vercel dashboardu: **Project → Settings → Environment Variables** —
  ne u kodu, ne u `.env.local` (taj je samo lokalan).
