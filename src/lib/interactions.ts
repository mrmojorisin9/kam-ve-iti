"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Bilježi anonimni pregled stranice događaja (Razina popularity score,
 * ADR-014) — poziva se isključivo iz klijentske komponente (ViewTracker)
 * preko useEffect, ne izravno iz Server Componente, jer bi Next.js
 * prefetch (Link u listama ulazi u viewport i prefetcha stranicu) inače
 * lažno napuhao brojač i prije stvarnog posjeta — vidi node_modules/next/
 * dist/docs/.../prefetching.md, "Triggering unwanted side-effects".
 */
export async function trackEventView(eventId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_interactions")
    .insert({ event_id: eventId, interaction_type: "view" });

  if (error) {
    console.error("trackEventView:", error.message);
  }
}
