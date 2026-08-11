"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * "Riješeno" — admin je ručno prenio podatke u novi događaj preko
 * /admin/dogadjaji/novi, redak više nije potreban (nema status stupac,
 * vidi 0036_event_link_submissions.sql — "riješeno" = obrisano).
 */
export async function deleteLinkSubmission(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (id) {
    const supabase = await createClient();
    await supabase.from("event_link_submissions").delete().eq("id", id);
  }

  redirect("/admin/dogadjaji?status=prijave-linkom");
}
