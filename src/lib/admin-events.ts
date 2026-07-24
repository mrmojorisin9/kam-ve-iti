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
 * Svi događaji (admin — RLS "events_admin_full_access"), najnoviji početak
 * prvi. `status` filtrira na jedan status (npr. "Na čekanju" prečac u
 * `/admin/dogadjaji`) — bez njega vraća sve statuse.
 */
export async function listEventsForAdmin(
  status?: string,
): Promise<AdminEventListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select(
      `
      id, title, slug, start_at, status,
      category:categories ( name ),
      location:locations ( name )
    `,
    )
    .order("start_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

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
  is_free: boolean;
  is_family_friendly: boolean;
  is_dog_friendly: boolean;
  is_solo_friendly: boolean;
  is_romantic: boolean;
  is_hidden_gem: boolean;
  is_admin_featured: boolean;
  submitter_email: string | null;
  submitter_phone: string | null;
  gallery: { id: string; url: string }[];
};

type AdminEventDetailRow = Omit<AdminEventDetail, "gallery"> & {
  event_images: { id: string; url: string; sort_order: number }[] | null;
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
       image_url, status, is_free, is_family_friendly, is_dog_friendly,
       is_solo_friendly, is_romantic, is_hidden_gem, is_admin_featured,
       submitter_email, submitter_phone,
       event_images ( id, url, sort_order )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getEventForEdit:", error.message);
    return null;
  }

  const row = data as AdminEventDetailRow | null;
  if (!row) return null;

  const { event_images, ...rest } = row;
  return {
    ...rest,
    gallery: (event_images ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => ({ id: img.id, url: img.url })),
  };
}

/**
 * Samo jedan događaj smije biti is_admin_featured u isto vrijeme
 * (ADR-014 dopuna) — provodi se ovdje u aplikacijskom sloju prije
 * upisa/izmjene novog istaknutog događaja, ne DB constraintom.
 */
export async function clearOtherAdminFeatured(
  supabase: SupabaseClient,
  exceptEventId?: string,
): Promise<void> {
  let query = supabase
    .from("events")
    .update({ is_admin_featured: false })
    .eq("is_admin_featured", true);

  if (exceptEventId) {
    query = query.neq("id", exceptEventId);
  }

  await query;
}

// Sigurnosni audit 2026-07-21, nalaz #5: ekstenzija se prije izvodila iz
// klijentski poslanog `file.name`, a `contentType` iz klijentski poslanog
// `file.type` — bez provjere, bucket je javan pa bi npr. `.svg` s ugrađenim
// <script>om ili proizvoljan contentType (npr. "text/html") bio uploadan i
// javno dostupan na svom URL-u. Popis dopuštenih tipova ujedno određuje
// ekstenziju (izvedeno iz provjerenog tipa, ne iz nepouzdanog `file.name`).
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const EVENT_IMAGES_URL_MARKER = "/storage/v1/object/public/event-images/";

/**
 * Uploada jednu datoteku u `event-images` Supabase Storage bucket (Faza 8,
 * Dan 22, vidi 0004_event_images_bucket.sql) i vraća njen javni URL. Naziv
 * datoteke je nasumičan (ne slug) jer slug pri kreiranju događaja u tom
 * trenutku možda još nije poznat. Dijele je glavna fotografija
 * (`uploadEventImage`) i galerija (`addEventGalleryImages`).
 */
async function uploadImageFile(
  supabase: SupabaseClient,
  file: File,
): Promise<string> {
  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) {
    throw new Error("Slika mora biti JPG, PNG ili WebP.");
  }
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("event-images")
    .upload(path, file, { contentType: file.type });

  if (error) {
    throw new Error(`Slika: ${error.message}`);
  }

  return supabase.storage.from("event-images").getPublicUrl(path).data
    .publicUrl;
}

/** Uploada glavnu fotografiju događaja — vidi `uploadImageFile`. */
export async function uploadEventImage(
  supabase: SupabaseClient,
  file: File,
): Promise<string> {
  return uploadImageFile(supabase, file);
}

const MAX_GALLERY_IMAGES = 6;

/**
 * Uploada nove galerija-slike i upisuje retke u `event_images` (Faza 8,
 * Dan 74, C4). Baca grešku prije ikakvog uploada ako bi ukupan broj
 * (postojeće + nove) prešao `MAX_GALLERY_IMAGES` — izbjegava djelomično
 * uploadane slike koje bi ionako trebalo ručno počistiti.
 */
export async function addEventGalleryImages(
  supabase: SupabaseClient,
  eventId: string,
  files: File[],
  currentCount: number,
): Promise<void> {
  if (files.length === 0) return;

  if (currentCount + files.length > MAX_GALLERY_IMAGES) {
    throw new Error(
      `Galerija smije imati najviše ${MAX_GALLERY_IMAGES} slika (trenutno ${currentCount}, pokušaj dodati ${files.length}).`,
    );
  }

  const urls: string[] = [];
  for (const file of files) {
    urls.push(await uploadImageFile(supabase, file));
  }

  const rows = urls.map((url, index) => ({
    event_id: eventId,
    url,
    sort_order: currentCount + index,
  }));

  const { error } = await supabase.from("event_images").insert(rows);
  if (error) {
    throw new Error(`Galerija: ${error.message}`);
  }
}

/**
 * Briše galerija-slike (Storage objekt + redak). Bez orphan-provjere kao
 * `deleteEventImageIfOrphaned` jer svaki galerija-redak posjeduje vlastitu
 * datoteku 1:1 (nasumični UUID naziv, nikad dijeljen/ručno unesen URL).
 * Best-effort na Storage brisanju — greška ne smije spriječiti brisanje retka.
 */
export async function deleteEventGalleryImages(
  supabase: SupabaseClient,
  images: { id: string; url: string }[],
): Promise<void> {
  if (images.length === 0) return;

  const paths = images
    .filter((img) => img.url.includes(EVENT_IMAGES_URL_MARKER))
    .map((img) => img.url.split(EVENT_IMAGES_URL_MARKER)[1])
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    try {
      await supabase.storage.from("event-images").remove(paths);
    } catch (err) {
      console.error("deleteEventGalleryImages storage:", err);
    }
  }

  const { error } = await supabase
    .from("event_images")
    .delete()
    .in(
      "id",
      images.map((img) => img.id),
    );

  if (error) {
    console.error("deleteEventGalleryImages:", error.message);
  }
}

/**
 * Briše uploadanu fotografiju iz `event-images` bucketa kad više nijedan
 * događaj ne referencira taj `image_url` — poziva se nakon brisanja
 * događaja (Faza 8, Dan 51). Bez ovoga uploadane slike ostaju u Storageu
 * kao osirotjele datoteke zauvijek (otkriveno uživo: 1 od 4 datoteke u
 * bucketu nije referencirala nijedan postojeći događaj). Vanjski URL-ovi
 * (nisu u našem bucketu) i `/event-placeholder.svg` (statična datoteka u
 * `public/`, ne Storage) se ignoriraju. Best-effort — greška u brisanju
 * ne smije prekinuti tok brisanja događaja koji ju poziva.
 */
export async function deleteEventImageIfOrphaned(
  supabase: SupabaseClient,
  imageUrl: string | null,
): Promise<void> {
  if (!imageUrl || !imageUrl.includes(EVENT_IMAGES_URL_MARKER)) return;

  const path = imageUrl.split(EVENT_IMAGES_URL_MARKER)[1];
  if (!path) return;

  const { count } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("image_url", imageUrl);

  if (count && count > 0) return;

  try {
    await supabase.storage.from("event-images").remove([path]);
  } catch (err) {
    console.error("deleteEventImageIfOrphaned:", err);
  }
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
