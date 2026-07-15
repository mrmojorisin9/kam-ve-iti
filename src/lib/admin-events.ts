import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type AdminEventListItem = {
  id: string;
  title: string;
  slug: string;
  start_at: string;
  status: string;
  category_name: string;
  location_name: string;
};

type AdminEventListRow = {
  id: string;
  title: string;
  slug: string;
  start_at: string;
  status: string;
  category: { name: string } | null;
  location: { name: string } | null;
};

/**
 * Svi događaji, svih statusa (admin — RLS "events_admin_full_access"),
 * najnoviji početak prvi.
 */
export async function listEventsForAdmin(): Promise<AdminEventListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      `
      id, title, slug, start_at, status,
      category:categories ( name ),
      location:locations ( name )
    `,
    )
    .order("start_at", { ascending: false });

  if (error) {
    console.error("listEventsForAdmin:", error.message);
    return [];
  }

  // Cast nužan jer klijent (bez generiranih Database tipova) ne zna da je
  // FK veza jedan-na-jedan — vidi isto obrazloženje u events.ts getEventBySlug.
  return ((data ?? []) as unknown as AdminEventListRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    start_at: row.start_at,
    status: row.status,
    category_name: row.category?.name ?? "—",
    location_name: row.location?.name ?? "—",
  }));
}

export type AdminEventDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category_id: string;
  location_id: string;
  venue_name: string | null;
  start_at: string;
  end_at: string | null;
  organizer_name: string | null;
  organizer_contact: string | null;
  source_url: string | null;
  image_url: string | null;
  status: string;
};

/** Jedan događaj (bilo kojeg statusa) za admin formu za uređivanje. */
export async function getEventForEdit(
  id: string,
): Promise<AdminEventDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      `id, slug, title, description, category_id, location_id, venue_name,
       start_at, end_at, organizer_name, organizer_contact, source_url,
       image_url, status`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getEventForEdit:", error.message);
    return null;
  }

  return data as AdminEventDetail | null;
}

/**
 * Nalazi slobodan slug dodavanjem numeriranog sufiksa ("naslov-2", "-3", ...)
 * kad bazni slug već postoji. Dijeli ga ručna forma i CSV uvoz (Faza 5,
 * Dan 2/3) — poziva se sekvencijalno (ne Promise.all) kako bi svaki upit
 * vidio slugove upisane u prethodnom koraku iste serije.
 */
export async function uniqueSlug(
  supabase: SupabaseClient,
  baseSlug: string,
): Promise<string> {
  const { data } = await supabase
    .from("events")
    .select("slug")
    .like("slug", `${baseSlug}%`);

  const existing = new Set((data ?? []).map((row) => row.slug as string));
  if (!existing.has(baseSlug)) return baseSlug;

  let suffix = 2;
  while (existing.has(`${baseSlug}-${suffix}`)) suffix++;
  return `${baseSlug}-${suffix}`;
}
