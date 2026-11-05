"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  applyEventFormUpdate,
  deleteEventImageIfOrphaned,
  type EventFormActionResult,
} from "@/lib/admin-events";

/**
 * Spaja N duplikata u jedan zapis (`primary_id` preživljava, ostali se
 * brišu). Greška se vraća kao stanje (ne redirect) da forma zadrži sve unose.
 */
export async function mergeEvents(
  _prevState: EventFormActionResult,
  formData: FormData,
): Promise<EventFormActionResult> {
  const eventIds = String(formData.get("event_ids") ?? "")
    .split(",")
    .filter(Boolean);
  const primaryId = String(formData.get("primary_id") ?? "");

  if (eventIds.length < 2 || !eventIds.includes(primaryId)) {
    redirect("/admin/dogadjaji/duplikati");
  }

  const supabase = await createClient();

  const result = await applyEventFormUpdate(supabase, primaryId, formData);

  if (result.error) {
    return result;
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
