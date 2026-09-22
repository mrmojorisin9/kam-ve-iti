"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { zagrebLocalToUtcIso } from "@/lib/zagreb-time";
import { uniqueSlug, applyCsvRowUpdate } from "@/lib/admin-events";
import { parseCsv, detectDelimiter, stripBom } from "@/lib/csv";

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

function cellBool(row: string[], index: Record<string, number>, name: string): boolean {
  return (cell(row, index, name) ?? "").toLowerCase() === "true";
}

/**
 * Prevodi sirove Postgres/Supabase poruke greške (npr. "duplicate key value
 * violates unique constraint...") u razumljivu hrvatsku napomenu — korisnikov
 * zahtjev, sirove poruke bez konteksta o shemi baze bile su nerazumljive.
 * Nepoznata greška i dalje prikazuje izvornu poruku (bolje vidljiva
 * neprepoznata greška nego prešućena), samo s jasnom naznakom da je sirova.
 */
function friendlyDbError(message: string): string {
  if (message.includes("events_source_url_unique")) {
    return (
      'izvorni link ("source_url") u ovom retku već postoji na nekom drugom ' +
      "događaju u bazi (bez obzira na njegov status — uključujući odbijene/" +
      "arhivirane) ili se ponavlja unutar iste CSV datoteke. Svaki izvorni " +
      "link smije pripadati samo jednom događaju. Provjeri na " +
      '"/admin/dogadjaji" (tab "Svi") ili alatom "Mogući duplikati" radi li ' +
      "se o stvarnom duplikatu — ako ne, isprazni \"source_url\" polje za " +
      "ovaj redak (polje je opcionalno) i pokušaj ponovno."
    );
  }
  if (message.toLowerCase().includes("row-level security")) {
    return (
      "sesija prijave je istekla usred uvoza. Osvježi stranicu, ponovno se " +
      "prijavi i pokušaj uvoz ponovno."
    );
  }
  return `neočekivana greška baze (proslijeđeno bez prijevoda): ${message}`;
}

/**
 * Kao `cellBool`, ali razlikuje "polje uopće nije navedeno" (`null`) od
 * "izričito false" — potrebno za ažuriranje postojećeg događaja (korisnikov
 * zahtjev), gdje prazno/izostavljeno polje mora zadržati postojeću
 * vrijednost, ne tiho postaviti na false.
 */
function cellBoolOrNull(
  row: string[],
  index: Record<string, number>,
  name: string,
): boolean | null {
  const value = cell(row, index, name);
  if (value === null) return null;
  return value.toLowerCase() === "true";
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
  let updated = 0;
  const errors: string[] = [];

  for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
    const row = dataRows[rowIdx];
    const sheetRow = rowIdx + 2; // +1 za zaglavlje, +1 za 1-indeksiranje

    // Red s popunjenim "id" stupcem koji se podudara s postojećim
    // display_id ažurira TAJ događaj umjesto da uvijek stvara nov
    // (korisnikov zahtjev) — prazan/odsutan "id" znači "uvijek nov događaj",
    // nepromijenjeno ponašanje od prije.
    const idRaw = cell(row, index, "id");
    let targetDisplayId: number | null = null;
    if (idRaw) {
      const parsed = Number(idRaw);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        errors.push(`red ${sheetRow}: neispravan ID "${idRaw}"`);
        continue;
      }
      targetDisplayId = parsed;
    }
    const isUpdate = targetDisplayId !== null;

    const title = cell(row, index, "title");
    const categorySlug = cell(row, index, "category_slug");
    const locationSlug = cell(row, index, "location_slug");
    const startAtLocal = cell(row, index, "start_at");
    const endAtLocal = cell(row, index, "end_at");
    const imageUrl = cell(row, index, "image_url");
    const statusRaw = cell(row, index, "status");

    // Kod uvoza NOVOG događaja ova polja ostaju obavezna (nepromijenjeno).
    // Kod ažuriranja postojećeg, prazno polje znači "zadrži postojeću
    // vrijednost" — provjerava se samo ono što je stvarno navedeno.
    if (!isUpdate && (!title || !categorySlug || !locationSlug || !startAtLocal || !imageUrl)) {
      errors.push(`red ${sheetRow}: nedostaje obavezno polje`);
      continue;
    }

    let categoryId: string | undefined;
    if (categorySlug) {
      categoryId = categoryIdBySlug.get(categorySlug);
      if (!categoryId) {
        errors.push(`red ${sheetRow}: nepoznata kategorija "${categorySlug}"`);
        continue;
      }
    }

    let locationId: string | undefined;
    if (locationSlug) {
      locationId = locationIdBySlug.get(locationSlug);
      if (!locationId) {
        errors.push(`red ${sheetRow}: nepoznata lokacija "${locationSlug}"`);
        continue;
      }
    }

    if (startAtLocal && !DATETIME_PATTERN.test(startAtLocal)) {
      errors.push(`red ${sheetRow}: neispravan format početka (očekuje se GGGG-MM-DDTSS:mm)`);
      continue;
    }
    if (endAtLocal && !DATETIME_PATTERN.test(endAtLocal)) {
      errors.push(`red ${sheetRow}: neispravan format kraja (očekuje se GGGG-MM-DDTSS:mm)`);
      continue;
    }

    let status: string | undefined;
    if (statusRaw) {
      if (!VALID_STATUSES.has(statusRaw)) {
        errors.push(`red ${sheetRow}: nepoznat status "${statusRaw}"`);
        continue;
      }
      status = statusRaw;
    } else if (!isUpdate) {
      status = "pending_review";
    }

    const isHiddenGem = cellBoolOrNull(row, index, "is_hidden_gem");
    // Napomena: ako je ovo ažuriranje BEZ navedenog category_slug (kategorija
    // se ne mijenja), a is_hidden_gem se postavlja na true, ova provjera se
    // namjerno preskače (ne dohvaća postojeću kategoriju iz baze samo radi
    // ove provjere) — rubni slučaj, poznato ograničenje.
    if (isHiddenGem === true && categorySlug === "manifestacije-i-feste") {
      errors.push(
        `red ${sheetRow}: "skriveni dragulj" ne može biti uz kategoriju "Velike Manifestacije"`,
      );
      continue;
    }

    const startAt = startAtLocal ? zagrebLocalToUtcIso(startAtLocal) : undefined;
    let endAt: string | null | undefined;
    if (endAtLocal) {
      endAt = zagrebLocalToUtcIso(endAtLocal);
    } else if (!isUpdate) {
      endAt = null;
    } else {
      endAt = undefined; // ažuriranje, kraj nije naveden -> zadrži postojeći
    }

    if (startAt && endAt && endAt < startAt) {
      errors.push(`red ${sheetRow}: kraj je prije početka`);
      continue;
    }

    if (isUpdate) {
      const { error, notFound } = await applyCsvRowUpdate(supabase, targetDisplayId!, {
        title: title ?? undefined,
        description: cell(row, index, "description") ?? undefined,
        category_id: categoryId,
        location_id: locationId,
        venue_name: cell(row, index, "venue_name") ?? undefined,
        start_at: startAt,
        end_at: endAt,
        organizer_name: cell(row, index, "organizer_name") ?? undefined,
        organizer_contact: cell(row, index, "organizer_contact") ?? undefined,
        source_url: cell(row, index, "source_url") ?? undefined,
        image_url: imageUrl ?? undefined,
        status,
        is_free: cellBoolOrNull(row, index, "is_free") ?? undefined,
        is_family_friendly: cellBoolOrNull(row, index, "is_family_friendly") ?? undefined,
        is_dog_friendly: cellBoolOrNull(row, index, "is_dog_friendly") ?? undefined,
        is_solo_friendly: cellBoolOrNull(row, index, "is_solo_friendly") ?? undefined,
        is_romantic: cellBoolOrNull(row, index, "is_romantic") ?? undefined,
        is_hidden_gem: isHiddenGem ?? undefined,
      });

      if (notFound) {
        errors.push(`red ${sheetRow}: ID ${targetDisplayId} ne postoji, red preskočen`);
        continue;
      }
      if (error) {
        errors.push(`red ${sheetRow}: ${friendlyDbError(error)}`);
        continue;
      }

      updated++;
      continue;
    }

    // Od ovdje nadalje je isUpdate uvijek false (uvijek nov događaj) — sve
    // obavezno je već provjereno gore; ponovna provjera je čisto sigurnosna
    // mreža za TypeScript (ne bi se smjela stvarno okinuti).
    if (!title || !categoryId || !locationId || !startAt || !imageUrl || !status) {
      errors.push(`red ${sheetRow}: nedostaje obavezno polje`);
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
      end_at: endAt ?? null,
      organizer_name: cell(row, index, "organizer_name"),
      organizer_contact: cell(row, index, "organizer_contact"),
      source_url: cell(row, index, "source_url"),
      image_url: imageUrl,
      status,
      created_by: user?.id ?? null,
      is_free: cellBool(row, index, "is_free"),
      is_family_friendly: cellBool(row, index, "is_family_friendly"),
      is_dog_friendly: cellBool(row, index, "is_dog_friendly"),
      is_solo_friendly: cellBool(row, index, "is_solo_friendly"),
      is_romantic: cellBool(row, index, "is_romantic"),
      is_hidden_gem: isHiddenGem ?? false,
    });

    if (error) {
      errors.push(`red ${sheetRow}: ${friendlyDbError(error.message)}`);
      continue;
    }

    imported++;
  }

  const params = new URLSearchParams();
  params.set("imported", String(imported));
  params.set("updated", String(updated));
  params.set("total", String(dataRows.length));
  if (errors.length > 0) {
    params.set("errors", errors.slice(0, MAX_LISTED_ERRORS).join("|"));
    if (errors.length > MAX_LISTED_ERRORS) {
      params.set("moreErrors", String(errors.length - MAX_LISTED_ERRORS));
    }
  }

  redirect(`/admin/dogadjaji/uvoz?${params.toString()}`);
}
