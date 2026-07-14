# types

Zajednički TypeScript tipovi/interfacei koji se koriste kroz više dijelova
aplikacije.

`database.ts` se **ne piše ručno** — generira se direktno iz Supabase sheme
naredbom `npx supabase gen types typescript`, tako da tipovi nikad ne odstupe
od stvarne baze. Vidi `supabase/migrations/` za shemu (Faza 3).
