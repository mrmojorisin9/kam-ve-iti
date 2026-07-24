"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { zagrebLocalToUtcIso } from "@/lib/zagreb-time";
import {
  uploadEventImage,
  clearOtherAdminFeatured,
  addEventGalleryImages,
  deleteEventGalleryImages,
} from "@/lib/admin-events";

function readText(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? "").trim();
  return value || null;
}

function readBool(formData: FormData, field: string): boolean {
  return formData.get(field) === "on";
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

  const isHiddenGem = readBool(formData, "is_hidden_gem");
  const isAdminFeatured = readBool(formData, "is_admin_featured");

  const supabase = await createClient();

  if (isAdminFeatured) {
    await clearOtherAdminFeatured(supabase, id);
  }

  if (isHiddenGem) {
    const { data: category } = await supabase
      .from("categories")
      .select("slug")
      .eq("id", categoryId)
      .maybeSingle();
    if (category?.slug === "manifestacije-i-feste") {
      fail(
        id,
        '"Skriveni dragulj" ne može biti označen uz kategoriju "Velike Manifestacije" (proturječno).',
      );
    }
  }

  // Priložena datoteka ima prednost pred URL poljem (korisnikov odabir).
  let imageUrl = imageUrlText;
  if (hasImageFile) {
    try {
      imageUrl = await uploadEventImage(supabase, imageFile);
    } catch (err) {
      fail(id, (err as Error).message);
    }
  }

  // Galerija (C4): checkboxovi "Ukloni" + nove datoteke iz iste forme.
  const galleryFiles = formData
    .getAll("gallery_files")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const deleteGalleryIds = new Set<string>();
  for (const key of formData.keys()) {
    if (key.startsWith("delete_gallery_") && formData.get(key) === "on") {
      deleteGalleryIds.add(key.slice("delete_gallery_".length));
    }
  }

  const { data: existingGallery } = await supabase
    .from("event_images")
    .select("id, url")
    .eq("event_id", id);
  const gallery = (existingGallery ?? []) as { id: string; url: string }[];
  const imagesToDelete = gallery.filter((img) => deleteGalleryIds.has(img.id));
  const remainingCount = gallery.length - imagesToDelete.length;

  if (remainingCount + galleryFiles.length > 6) {
    fail(
      id,
      `Galerija smije imati najviše 6 slika (ostalo bi ${remainingCount}, pokušaj dodati ${galleryFiles.length}).`,
    );
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
      is_free: readBool(formData, "is_free"),
      is_family_friendly: readBool(formData, "is_family_friendly"),
      is_dog_friendly: readBool(formData, "is_dog_friendly"),
      is_solo_friendly: readBool(formData, "is_solo_friendly"),
      is_romantic: readBool(formData, "is_romantic"),
      is_hidden_gem: isHiddenGem,
      is_admin_featured: isAdminFeatured,
    })
    .eq("id", id);

  if (error) {
    fail(id, error.message);
  }

  await deleteEventGalleryImages(supabase, imagesToDelete);
  try {
    await addEventGalleryImages(supabase, id, galleryFiles, remainingCount);
  } catch (err) {
    fail(id, (err as Error).message);
  }

  redirect("/admin/dogadjaji?updated=1");
}
