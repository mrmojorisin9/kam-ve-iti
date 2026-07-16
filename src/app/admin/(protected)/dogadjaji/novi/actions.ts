"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { zagrebLocalToUtcIso } from "@/lib/zagreb-time";
import { uniqueSlug } from "@/lib/admin-events";

function readText(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? "").trim();
  return value || null;
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
  const imageUrl = readText(formData, "image_url");
  const status = readText(formData, "status") ?? "published";

  if (!title || !categoryId || !locationId || !startAtLocal || !imageUrl) {
    fail("Naslov, kategorija, lokacija, početak i URL slike su obavezni.");
  }

  const startAt = zagrebLocalToUtcIso(startAtLocal);
  const endAt = endAtLocal ? zagrebLocalToUtcIso(endAtLocal) : null;

  if (endAt && endAt < startAt) {
    fail("Kraj događaja ne može biti prije početka.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  });

  if (error) {
    fail(error.message);
  }

  redirect(`/admin?created=${encodeURIComponent(slug)}`);
}
