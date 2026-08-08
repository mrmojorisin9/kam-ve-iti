"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { applyEventFormUpdate, deleteEventImageIfOrphaned } from "@/lib/admin-events";

function fail(ids: string[], message: string): never {
  redirect(
    `/admin/dogadjaji/duplikati/spoji?ids=${encodeURIComponent(ids.join(","))}&error=${encodeURIComponent(message)}`,
  );
}

/**
 * Spaja N duplikata u jedan zapis (`primary_id` preživljava, ostali se
 * brišu). Galerija svih kandidata se tretira kao jedna unija — strop od 6
 * slika i "Ukloni" checkboxovi u `EventForm` moraju pokrivati cijelu grupu,
 * ne samo primarnog, pa se `existingGallery` eksplicitno prosljeđuje umjesto
 * oslanjanja na interni upit u `applyEventFormUpdate`.
 */
export async function mergeEvents(formData: FormData) {
  const eventIds = String(formData.get("event_ids") ?? "")
    .split(",")
    .filter(Boolean);
  const primaryId = String(formData.get("primary_id") ?? "");

  if (eventIds.length < 2 || !eventIds.includes(primaryId)) {
    redirect("/admin/dogadjaji/duplikati");
  }

  const supabase = await createClient();

  const { data: galleryRows } = await supabase
    .from("event_images")
    .select("id, url, event_id")
    .in("event_id", eventIds);
  const existingGallery = (galleryRows ?? []) as {
    id: string;
    url: string;
    event_id: string;
  }[];

  const { error } = await applyEventFormUpdate(supabase, primaryId, formData, {
    existingGallery: existingGallery.map(({ id, url }) => ({ id, url })),
  });

  if (error) {
    fail(eventIds, error);
  }

  // Slike koje su preživjele ("Ukloni" checkbox nije označen) a pripadaju
  // ne-primarnom kandidatu moraju se prebaciti na primarni PRIJE brisanja
  // gubitničkih eventova — inače bi ih on-delete-cascade obrisao skupa s njima.
  const deleteGalleryIds = new Set<string>();
  for (const key of formData.keys()) {
    if (key.startsWith("delete_gallery_") && formData.get(key) === "on") {
      deleteGalleryIds.add(key.slice("delete_gallery_".length));
    }
  }
  const toReassign = existingGallery
    .filter(
      (img) => img.event_id !== primaryId && !deleteGalleryIds.has(img.id),
    )
    .map((img) => img.id);

  if (toReassign.length > 0) {
    await supabase
      .from("event_images")
      .update({ event_id: primaryId })
      .in("id", toReassign);
  }

  const losingIds = eventIds.filter((id) => id !== primaryId);
  const { data: losingEvents } = await supabase
    .from("events")
    .select("id, image_url")
    .in("id", losingIds);

  await supabase.from("events").delete().in("id", losingIds);

  for (const event of losingEvents ?? []) {
    await deleteEventImageIfOrphaned(supabase, event.image_url ?? null);
  }

  redirect("/admin/dogadjaji/duplikati?merged=1");
}
