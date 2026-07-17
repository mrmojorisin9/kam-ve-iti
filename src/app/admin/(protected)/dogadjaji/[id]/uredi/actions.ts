"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { zagrebLocalToUtcIso } from "@/lib/zagreb-time";
import { uploadEventImage } from "@/lib/admin-events";

function readText(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? "").trim();
  return value || null;
}

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
  const title = readText(formData, "title");
  const categoryId = readText(formData, "category_id");
  const locationId = readText(formData, "location_id");
  const startAtLocal = readText(formData, "start_at");
  const endAtLocal = readText(formData, "end_at");
  const imageUrlText = readText(formData, "image_url");
  const imageFile = formData.get("image_file");
  const hasImageFile = imageFile instanceof File && imageFile.size > 0;
  const status = readText(formData, "status") ?? "published";

  if (!id) {
    redirect("/admin/dogadjaji");
  }

  if (
    !title ||
    !categoryId ||
    !locationId ||
    !startAtLocal ||
    (!imageUrlText && !hasImageFile)
  ) {
    fail(
      id,
      "Naslov, kategorija, lokacija, početak i fotografija (URL ili datoteka) su obavezni.",
    );
  }

  const startAt = zagrebLocalToUtcIso(startAtLocal);
  const endAt = endAtLocal ? zagrebLocalToUtcIso(endAtLocal) : null;

  if (endAt && endAt < startAt) {
    fail(id, "Kraj događaja ne može biti prije početka.");
  }

  const supabase = await createClient();

  // Priložena datoteka ima prednost pred URL poljem (korisnikov odabir).
  let imageUrl = imageUrlText;
  if (hasImageFile) {
    try {
      imageUrl = await uploadEventImage(supabase, imageFile);
    } catch (err) {
      fail(id, (err as Error).message);
    }
  }

  const { error } = await supabase
    .from("events")
    .update({
      title,
      description: readText(formData, "description"),
      category_id: categoryId,
      location_id: locationId,
      venue_name: readText(formData, "venue_name"),
      start_at: startAt,
      end_at: endAt,
      organizer_name: readText(formData, "organizer_name"),
      organizer_contact: readText(formData, "organizer_contact"),
      source_url: readText(formData, "source_url"),
      image_url: imageUrl,
      status,
    })
    .eq("id", id);

  if (error) {
    fail(id, error.message);
  }

  redirect("/admin/dogadjaji?updated=1");
}
