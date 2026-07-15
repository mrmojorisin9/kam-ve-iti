"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { zagrebLocalToUtcIso } from "@/lib/zagreb-time";
import { uniqueSlug } from "@/lib/admin-events";
import { parseCsv, detectDelimiter, stripBom } from "@/lib/csv";

const REQUIRED_COLUMNS = ["title", "category_slug", "location_slug", "start_at"];
const VALID_STATUSES = new Set(["draft", "pending_review", "published"]);
const DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const MAX_LISTED_ERRORS = 8;

function fail(message: string): never {
  redirect(`/admin/dogadjaji/uvoz?error=${encodeURIComponent(message)}`);
}

function cell(row: string[], index: Record<string, number>, name: string): string | null {
  const i = index[name];
  if (i === undefined) return null;
  const value = (row[i] ?? "").trim();
  return value || null;
}

export async function importCsv(formData: FormData) {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    fail("Odaberi CSV datoteku.");
  }

  const rawText = stripBom(await file.text());
  const firstLine = rawText.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = detectDelimiter(firstLine);
  const rows = parseCsv(rawText, delimiter);

  if (rows.length === 0) {
    fail("Datoteka je prazna.");
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const index: Record<string, number> = {};
  header.forEach((name, i) => {
    index[name] = i;
  });

  const missing = REQUIRED_COLUMNS.filter((col) => !(col in index));
  if (missing.length > 0) {
    fail(`Nedostaju obavezni stupci: ${missing.join(", ")}.`);
  }

  const dataRows = rows.slice(1).filter((r) => r.some((v) => v.trim() !== ""));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: categories }, { data: locations }] = await Promise.all([
    supabase.from("categories").select("id, slug"),
    supabase.from("locations").select("id, slug"),
  ]);
  const categoryIdBySlug = new Map(
    (categories ?? []).map((c) => [c.slug as string, c.id as string]),
  );
  const locationIdBySlug = new Map(
    (locations ?? []).map((l) => [l.slug as string, l.id as string]),
  );

  let imported = 0;
  const errors: string[] = [];

  for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
    const row = dataRows[rowIdx];
    const sheetRow = rowIdx + 2; // +1 za zaglavlje, +1 za 1-indeksiranje

    const title = cell(row, index, "title");
    const categorySlug = cell(row, index, "category_slug");
    const locationSlug = cell(row, index, "location_slug");
    const startAtLocal = cell(row, index, "start_at");
    const endAtLocal = cell(row, index, "end_at");
    const statusRaw = cell(row, index, "status");

    if (!title || !categorySlug || !locationSlug || !startAtLocal) {
      errors.push(`red ${sheetRow}: nedostaje obavezno polje`);
      continue;
    }

    const categoryId = categoryIdBySlug.get(categorySlug);
    if (!categoryId) {
      errors.push(`red ${sheetRow}: nepoznata kategorija "${categorySlug}"`);
      continue;
    }
    const locationId = locationIdBySlug.get(locationSlug);
    if (!locationId) {
      errors.push(`red ${sheetRow}: nepoznata lokacija "${locationSlug}"`);
      continue;
    }
    if (!DATETIME_PATTERN.test(startAtLocal)) {
      errors.push(`red ${sheetRow}: neispravan format početka (očekuje se GGGG-MM-DDTSS:mm)`);
      continue;
    }
    if (endAtLocal && !DATETIME_PATTERN.test(endAtLocal)) {
      errors.push(`red ${sheetRow}: neispravan format kraja (očekuje se GGGG-MM-DDTSS:mm)`);
      continue;
    }
    const status = statusRaw ?? "published";
    if (!VALID_STATUSES.has(status)) {
      errors.push(`red ${sheetRow}: nepoznat status "${status}"`);
      continue;
    }

    const startAt = zagrebLocalToUtcIso(startAtLocal);
    const endAt = endAtLocal ? zagrebLocalToUtcIso(endAtLocal) : null;
    if (endAt && endAt < startAt) {
      errors.push(`red ${sheetRow}: kraj je prije početka`);
      continue;
    }

    const baseSlug = slugify(title);
    if (!baseSlug) {
      errors.push(`red ${sheetRow}: naslov mora sadržavati slovo ili broj`);
      continue;
    }
    const slug = await uniqueSlug(supabase, baseSlug);

    const { error } = await supabase.from("events").insert({
      title,
      slug,
      description: cell(row, index, "description"),
      category_id: categoryId,
      location_id: locationId,
      venue_name: cell(row, index, "venue_name"),
      start_at: startAt,
      end_at: endAt,
      organizer_name: cell(row, index, "organizer_name"),
      organizer_contact: cell(row, index, "organizer_contact"),
      source_url: cell(row, index, "source_url"),
      image_url: cell(row, index, "image_url"),
      status,
      created_by: user?.id ?? null,
    });

    if (error) {
      errors.push(`red ${sheetRow}: ${error.message}`);
      continue;
    }

    imported++;
  }

  const params = new URLSearchParams();
  params.set("imported", String(imported));
  params.set("total", String(dataRows.length));
  if (errors.length > 0) {
    params.set("errors", errors.slice(0, MAX_LISTED_ERRORS).join("|"));
    if (errors.length > MAX_LISTED_ERRORS) {
      params.set("moreErrors", String(errors.length - MAX_LISTED_ERRORS));
    }
  }

  redirect(`/admin/dogadjaji/uvoz?${params.toString()}`);
}
