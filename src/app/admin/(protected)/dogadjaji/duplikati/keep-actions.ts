"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  deleteEventImageIfOrphaned,
  deleteEventGalleryImages,
} from "@/lib/admin-events";

/**
 * Brzi put za očite duplikate (korisnikov zahtjev — puni "Spoji grupu"
 * obrazac je pretežak kad su zapisi već identični, samo iz različitih
 * izvora): zadržava `keep_id` TOČNO kakav jest (bez ikakvog spajanja
 * polja/galerije — to je posao `mergeEvents`, `spoji/actions.ts`), briše
 * ostatak grupe. Isti "dohvati prije brisanja, Storage cleanup poslije"
 * obrazac kao `deleteEvent` (`[id]/obrisi/actions.ts`).
 */
export async function keepEvent(formData: FormData) {
  const eventIds = String(formData.get("event_ids") ?? "")
    .split(",")
    .filter(Boolean);
  const keepId = String(formData.get("keep_id") ?? "");

  if (eventIds.length < 2 || !eventIds.includes(keepId)) {
    redirect("/admin/dogadjaji/duplikati");
  }

  const losingIds = eventIds.filter((id) => id !== keepId);
  const supabase = await createClient();

  const [{ data: losingEvents }, { data: galleryRows }] = await Promise.all([
    supabase.from("events").select("id, image_url").in("id", losingIds),
    supabase.from("event_images").select("id, url").in("event_id", losingIds),
  ]);

  const { error } = await supabase.from("events").delete().in("id", losingIds);

  if (error) {
    redirect(
      `/admin/dogadjaji/duplikati?error=${encodeURIComponent(error.message)}`,
    );
  }

  for (const event of losingEvents ?? []) {
    await deleteEventImageIfOrphaned(supabase, event.image_url ?? null);
  }
  // event_images retci su vec obrisani (on delete cascade) — samo Storage
  // objekti trebaju rucno ciscenje, isti best-effort duh kao deleteEvent.
  await deleteEventGalleryImages(
    supabase,
    (galleryRows ?? []) as { id: string; url: string }[],
  );

  redirect("/admin/dogadjaji/duplikati?kept=1");
}
