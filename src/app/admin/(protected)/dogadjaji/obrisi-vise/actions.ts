"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bulkDeleteEvents, eventsListHref } from "@/lib/admin-events";

export async function confirmedBulkDelete(formData: FormData) {
  const ids = String(formData.get("ids") ?? "")
    .split(",")
    .filter(Boolean);
  const status = String(formData.get("status") ?? "") || undefined;
  const kategorija = String(formData.get("kategorija") ?? "") || undefined;
  const lokacija = String(formData.get("lokacija") ?? "") || undefined;
  const returnTo = eventsListHref(status, kategorija, lokacija);

  if (ids.length === 0) {
    redirect(returnTo);
  }

  const supabase = await createClient();
  const { error } = await bulkDeleteEvents(supabase, ids);

  if (error) {
    const params = new URLSearchParams();
    params.set("ids", ids.join(","));
    if (status) params.set("status", status);
    if (kategorija) params.set("kategorija", kategorija);
    if (lokacija) params.set("lokacija", lokacija);
    params.set("error", error);
    redirect(`/admin/dogadjaji/obrisi-vise?${params.toString()}`);
  }

  const separator = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${separator}bulkDeleted=${ids.length}`);
}
