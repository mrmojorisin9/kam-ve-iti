"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { applyEventFormUpdate, eventsListHref } from "@/lib/admin-events";

function readListParam(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? "").trim();
  return value || null;
}

/**
 * Slug se namjerno ne mijenja pri uređivanju (i kad se naslov promijeni) —
 * javna stranica događaja i eventualne vanjske poveznice na
 * `/dogadjaji/[slug]` ostaju stabilne.
 *
 * Nakon spremanja vraća na ISTI prikaz popisa s kojeg je došao "Uredi"
 * (tab/filter/sort iz skrivenih `list_*` polja) i do uređenog retka
 * (`fokus`, ScrollToEvent) — korisnikov zahtjev 2026-10-12. Putanja se
 * gradi preko `eventsListHref` (fiksna putanja + query), bez
 * open-redirect površine.
 */
export async function updateEvent(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = readListParam(formData, "list_status");
  const kategorija = readListParam(formData, "list_kategorija");
  const lokacija = readListParam(formData, "list_lokacija");
  const sort = readListParam(formData, "list_sort");
  const listHref = eventsListHref(status, kategorija, lokacija, sort);
  const listQuery = listHref.split("?")[1];

  if (!id) {
    redirect(listHref);
  }

  const supabase = await createClient();
  const { error } = await applyEventFormUpdate(supabase, id, formData);

  if (error) {
    redirect(
      `/admin/dogadjaji/${id}/uredi?error=${encodeURIComponent(error)}${listQuery ? `&${listQuery}` : ""}`,
    );
  }

  const separator = listHref.includes("?") ? "&" : "?";
  redirect(`${listHref}${separator}updated=1&fokus=${encodeURIComponent(id)}`);
}
