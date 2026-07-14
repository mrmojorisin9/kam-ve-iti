# Međimurje Events

Web portal koji objedinjuje sva javno dostupna događanja na području
Međimurske županije na jednom mjestu.

Projektna dokumentacija (problem, opseg, arhitekturne odluke) živi izvan ovog
foldera — vidi `PROJECT_BRIEF.md`, `DECISIONS.md` i `CHANGELOG.md` u korijenu
repozitorija.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com)
- ESLint (`eslint-config-next`) + Prettier

## Pokretanje

Preduvjet: Node.js 20+ (preporučeno 22 LTS).

```bash
npm install
npm run dev
```

Otvori [http://localhost:3000](http://localhost:3000).

## Skripte

| Skripta                | Opis                                   |
| ----------------------- | --------------------------------------- |
| `npm run dev`           | razvojni server (Turbopack)             |
| `npm run build`         | produkcijski build                      |
| `npm run start`         | pokretanje produkcijskog builda         |
| `npm run lint`          | ESLint provjera                         |
| `npm run format`        | Prettier — automatsko formatiranje      |
| `npm run format:check`  | Prettier — samo provjera, bez pisanja   |

## Struktura foldera

```
src/
  app/         Next.js App Router — rute i layouti
  components/  Ponovno iskoristive React komponente
  lib/         Poslovna logika, budući Supabase klijent, upiti, helperi
  types/       Zajednički TypeScript tipovi
```

## Status

Faza 2 (razvojno okruženje) u tijeku. Javni prikaz događanja dolazi u Fazi 4 —
vidi `PROJECT_BRIEF.md` za pregled svih faza.
