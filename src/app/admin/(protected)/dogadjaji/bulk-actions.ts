"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bulkUpdateEventStatus } from "@/lib/admin-events";

/**
 * Bulk odobri/odbaci iz `/admin/dogadjaji?status=pending_review` (Faza 6-7,
 * ADR-020) — vezano preko `.bind(null, status)` na dva odvojena submit gumba
 * unutar iste forme (checkbox po redu), isti obrazac kao ostale admin
 * Server Action datoteke u ovom folderu.
 */
export async function bulkUpdateStatus(
  status: "published" | "rejected",
  formData: FormData,
) {
  const ids = formData.getAll("ids").map(String).filter(Boolean);

  if (ids.length === 0) {
    redirect("/admin/dogadjaji?status=pending_review");
  }

  const supabase = await createClient();
  const { error } = await bulkUpdateEventStatus(supabase, ids, status);

  if (error) {
    redirect(
      `/admin/dogadjaji?status=pending_review&bulkError=${encodeURIComponent(error)}`,
    );
  }

  redirect(`/admin/dogadjaji?status=pending_review&bulkUpdated=${ids.length}`);
}
