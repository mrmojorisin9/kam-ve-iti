"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateGeneralSponsor } from "@/lib/admin-sponsor";

function fail(message: string): never {
  redirect(`/admin/sponzor?error=${encodeURIComponent(message)}`);
}

export async function saveSponsor(formData: FormData) {
  const supabase = await createClient();
  const { error } = await updateGeneralSponsor(supabase, formData);

  if (error) {
    fail(error);
  }

  redirect("/admin/sponzor?saved=1");
}
