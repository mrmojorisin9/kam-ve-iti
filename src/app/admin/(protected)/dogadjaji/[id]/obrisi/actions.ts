"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function deleteEvent(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/admin/dogadjaji");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    redirect(
      `/admin/dogadjaji/${id}/obrisi?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect("/admin/dogadjaji?deleted=1");
}
