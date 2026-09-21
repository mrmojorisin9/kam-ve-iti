"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { bulkUpdateEventStatus, eventsListHref } from "@/lib/admin-events";

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

/**
 * Prvi korak bulk brisanja — ne briše ništa, samo preusmjerava na potvrdnu
 * stranicu (isti "bez window.confirm, zasebna stranica" obrazac kao
 * pojedinačno brisanje, obrisi/actions.ts). Dostupno na svim tabovima (ne
 * samo "Na čekanju" kao odobri/odbaci), zato prenosi status/kategorija/
 * lokacija kroz cijeli tok da se admin nakon brisanja vrati na isti pogled.
 */
export async function confirmBulkDelete(formData: FormData) {
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  const status = String(formData.get("status") ?? "") || undefined;
  const kategorija = String(formData.get("kategorija") ?? "") || undefined;
  const lokacija = String(formData.get("lokacija") ?? "") || undefined;
  const sort = String(formData.get("sort") ?? "") || undefined;

  if (ids.length === 0) {
    redirect(eventsListHref(status, kategorija, lokacija, sort));
  }

  const params = new URLSearchParams();
  params.set("ids", ids.join(","));
  if (status) params.set("status", status);
  if (kategorija) params.set("kategorija", kategorija);
  if (lokacija) params.set("lokacija", lokacija);
  if (sort) params.set("sort", sort);

  redirect(`/admin/dogadjaji/obrisi-vise?${params.toString()}`);
}
