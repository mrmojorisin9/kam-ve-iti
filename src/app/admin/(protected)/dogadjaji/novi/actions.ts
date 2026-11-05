"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { zagrebLocalToUtcIso } from "@/lib/zagreb-time";
import {
  uniqueSlug,
  uploadEventImage,
  clearOtherAdminFeatured,
  isAbsoluteUrl,
  readFormPrice,
  findMissingRequiredField,
  type EventFormActionResult,
} from "@/lib/admin-events";

function readText(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? "").trim();
  return value || null;
}

function readBool(formData: FormData, field: string): boolean {
  return formData.get(field) === "on";
}

function fail(error: string, field?: string): EventFormActionResult {
  return { error, field };
}

/**
 * Greška se NE vraća redirectom nego kao stanje (`useActionState` u
 * `EventForm`) — forma ostaje kakva jest, a samo se označi neispravno polje
 * (`field`). Redirect ostaje samo za uspjeh.
 */
export async function createEvent(
  _prevState: EventFormActionResult,
  formData: FormData,
): Promise<EventFormActionResult> {
  const title = readText(formData, "title");
  const categoryId = readText(formData, "category_id");
  const locationId = readText(formData, "location_id");
  const startAtLocal = readText(formData, "start_at");
  const endAtLocal = readText(formData, "end_at");
  const imageUrlText = readText(formData, "image_url");
  const imageFile = formData.get("image_file");
  const hasImageFile = imageFile instanceof File && imageFile.size > 0;
  const status = readText(formData, "status") ?? "published";

  const missing = findMissingRequiredField({
    title,
    categoryId,
    locationId,
    startAtLocal,
    hasImage: Boolean(imageUrlText) || hasImageFile,
  });
  if (missing) return fail(missing.error, missing.field);

  const startAt = zagrebLocalToUtcIso(startAtLocal!);
  const endAt = endAtLocal ? zagrebLocalToUtcIso(endAtLocal) : null;

  if (endAt && endAt < startAt) {
    return fail("Kraj događaja ne može biti prije početka.", "end_at");
  }

  // Datoteka ima prednost pa se URL polje tada zanemaruje (vidi niže) —
  // validacija ima smisla samo kad URL stvarno postaje spremljena vrijednost.
  if (imageUrlText && !hasImageFile && !isAbsoluteUrl(imageUrlText)) {
    return fail(
      "Fotografija (URL) mora biti puna adresa koja počinje s http:// ili https://.",
      "image_url",
    );
  }

  const sponsoredUntilLocal = readText(formData, "sponsored_until");
  const sponsoredUntil = sponsoredUntilLocal
    ? zagrebLocalToUtcIso(sponsoredUntilLocal)
    : null;

  const isHiddenGem = readBool(formData, "is_hidden_gem");
  const isAdminFeatured = readBool(formData, "is_admin_featured");

  const priceEur = readFormPrice(formData);
  if (priceEur === undefined) {
    return fail(
      "Cijena ulaznice mora biti broj veći ili jednak 0 (npr. 10 ili 12,50).",
      "price_eur",
    );
  }

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
      .eq("id", categoryId!)
      .maybeSingle();
    if (category?.slug === "manifestacije-i-feste") {
      return fail(
        '"Skriveni dragulj" ne može biti označen uz kategoriju "Velike Manifestacije" (proturječno).',
        "is_hidden_gem",
      );
    }
  }

  // Priložena datoteka ima prednost pred URL poljem (korisnikov odabir).
  let imageUrl = imageUrlText;
  if (hasImageFile) {
    try {
      imageUrl = await uploadEventImage(supabase, imageFile);
    } catch (err) {
      return fail((err as Error).message, "image_file");
    }
  }

  const baseSlug = slugify(title!);
  if (!baseSlug) {
    return fail("Naslov mora sadržavati barem jedno slovo ili broj.", "title");
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
    performer: readText(formData, "performer"),
    price_eur: priceEur,
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
    sponsored_until: sponsoredUntil,
  });

  if (error) {
    return fail(error.message);
  }

  redirect(`/admin?created=${encodeURIComponent(slug)}`);
}
