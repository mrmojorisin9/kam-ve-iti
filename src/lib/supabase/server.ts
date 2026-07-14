import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase klijent za Server Components, Server Actions i Route Handlere.
 * Poziva se iznova u svakom zahtjevu (ne cachirati/dijeliti instancu) jer
 * nosi cookie kontekst trenutnog korisnika.
 *
 * Napomena: Server Components ne mogu pisati cookie (samo čitati), zato je
 * setAll u try/catch — to je očekivano i bezopasno dok ne dodamo pravi
 * session-refresh sloj (proxy.ts) u Fazi 5 uz admin login.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Poziv iz Server Componenta bez proxy/route handler sloja koji
            // osvježava sesiju — sigurno ignorirati za sada.
          }
        },
      },
    },
  );
}
