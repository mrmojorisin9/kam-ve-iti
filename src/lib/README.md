# lib

Poslovna logika koja nije UI: Supabase klijent, upiti prema bazi, pomoćne
funkcije (formatiranje datuma, validacija). Nema React komponenti ovdje.

## supabase/

- `client.ts` — za Client Components (browser)
- `server.ts` — za Server Components / Server Actions / Route Handlere

Koji koristiti: ako je vrh datoteke `"use client"`, koristi `client.ts`.
Inače (Server Component, default u App Routeru), koristi `server.ts`.
