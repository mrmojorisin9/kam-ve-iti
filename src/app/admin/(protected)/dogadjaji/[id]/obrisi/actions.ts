"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  deleteEventImageIfOrphaned,
  deleteEventGalleryImages,
  sanitizeAdminReturnPath,
} from "@/lib/admin-events";

export async function deleteEvent(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  // Re-sanitiziran ovdje neovisno o stranici — forma se može replay-ati
  // mimo renderiranog HTML-a, pa se serveru ne smije vjerovati klijentu.
  const returnTo = sanitizeAdminReturnPath(
    String(formData.get("returnTo") ?? ""),
  );

  if (!id) {
    redirect(returnTo);
  }

  const supabase = await createClient();

  const [{ data: event }, { data: galleryImages }] = await Promise.all([
    supabase.from("events").select("image_url").eq("id", id).maybeSingle(),
    supabase.from("event_images").select("id, url").eq("event_id", id),
  ]);

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    redirect(
      `/admin/dogadjaji/${id}/obrisi?error=${encodeURIComponent(error.message)}&returnTo=${encodeURIComponent(returnTo)}`,
    );
  }

  await deleteEventImageIfOrphaned(supabase, event?.image_url ?? null);
  // event_images retci su već obrisani (on delete cascade) — samo Storage
  // objekti trebaju ručno čišćenje, isti best-effort duh kao iznad.
  await deleteEventGalleryImages(
    supabase,
    (galleryImages ?? []) as { id: string; url: string }[],
  );

  redirect(`${returnTo}?deleted=1`);
}
