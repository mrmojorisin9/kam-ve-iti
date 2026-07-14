import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase klijent za Client Components (kod koji se izvršava u browseru).
 * Koristi NEXT_PUBLIC_ varijable — sigurne za izlaganje na frontendu jer
 * pristup podacima štiti Row Level Security (vidi supabase/migrations).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
