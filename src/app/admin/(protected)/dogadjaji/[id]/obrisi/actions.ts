"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteEventImageIfOrphaned } from "@/lib/admin-events";

export async function deleteEvent(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/admin/dogadjaji");
  }

  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    redirect(
      `/admin/dogadjaji/${id}/obrisi?error=${encodeURIComponent(error.message)}`,
    );
  }

  await deleteEventImageIfOrphaned(supabase, event?.image_url ?? null);

  redirect("/admin/dogadjaji?deleted=1");
}
