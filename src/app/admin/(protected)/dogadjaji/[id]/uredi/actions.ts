"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { applyEventFormUpdate } from "@/lib/admin-events";

function fail(id: string, message: string): never {
  redirect(`/admin/dogadjaji/${id}/uredi?error=${encodeURIComponent(message)}`);
}

/**
 * Slug se namjerno ne mijenja pri uređivanju (i kad se naslov promijeni) —
 * javna stranica događaja i eventualne vanjske poveznice na
 * `/dogadjaji/[slug]` ostaju stabilne.
 */
export async function updateEvent(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/admin/dogadjaji");
  }

  const supabase = await createClient();
  const { error } = await applyEventFormUpdate(supabase, id, formData);

  if (error) {
    fail(id, error);
  }

  redirect("/admin/dogadjaji?updated=1");
}
