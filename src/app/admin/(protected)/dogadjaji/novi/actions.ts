"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { zagrebLocalToUtcIso } from "@/lib/zagreb-time";
import {
  uniqueSlug,
  uploadEventImage,
  clearOtherAdminFeatured,
} from "@/lib/admin-events";

function readText(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? "").trim();
  return value || null;
}

function readBool(formData: FormData, field: string): boolean {
  return formData.get(field) === "on";
}

function fail(message: string): never {
  redirect(`/admin/dogadjaji/novi?error=${encodeURIComponent(message)}`);
}

export async function createEvent(formData: FormData) {
  const title = readText(formData, "title");
  const categoryId = readText(formData, "category_id");
  const locationId = readText(formData, "location_id");
  const startAtLocal = readText(formData, "start_at");
  const endAtLocal = readText(formData, "end_at");
  const imageUrlText = readText(formData, "image_url");
  const imageFile = formData.get("image_file");
  const hasImageFile = imageFile instanceof File && imageFile.size > 0;
  const status = readText(formData, "status") ?? "published";

  if (
    !title ||
    !categoryId ||
    !locationId ||
    !startAtLocal ||
    (!imageUrlText && !hasImageFile)
  ) {
    fail(
      "Naslov, kategorija, lokacija, početak i fotografija (URL ili datoteka) su obavezni.",
    );
  }

  const startAt = zagrebLocalToUtcIso(startAtLocal);
  const endAt = endAtLocal ? zagrebLocalToUtcIso(endAtLocal) : null;

  if (endAt && endAt < startAt) {
    fail("Kraj događaja ne može biti prije početka.");
  }

  const isHiddenGem = readBool(formData, "is_hidden_gem");
  const isAdminFeatured = readBool(formData, "is_admin_featured");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isAdminFeatured) {
    await clearOtherAdminFeatured(supabase);
  }

  if (isHiddenGem) {
    const { data: category } = await supabase
      .from("categories")
      .select("slug")
      .eq("id", categoryId)
      .maybeSingle();
    if (category?.slug === "manifestacije-i-feste") {
      fail(
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
      fail((err as Error).message);
    }
  }

  const baseSlug = slugify(title);
  if (!baseSlug) {
    fail("Naslov mora sadržavati barem jedno slovo ili broj.");
  }
  const slug = await uniqueSlug(supabase, baseSlug);

  const { error } = await supabase.from("events").insert({
    title,
    slug,
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
    created_by: user?.id ?? null,
    is_free: readBool(formData, "is_free"),
    is_family_friendly: readBool(formData, "is_family_friendly"),
    is_dog_friendly: readBool(formData, "is_dog_friendly"),
    is_solo_friendly: readBool(formData, "is_solo_friendly"),
    is_romantic: readBool(formData, "is_romantic"),
    is_hidden_gem: isHiddenGem,
    is_admin_featured: isAdminFeatured,
  });

  if (error) {
    fail(error.message);
  }

  redirect(`/admin?created=${encodeURIComponent(slug)}`);
}
