import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { zagrebLocalToUtcIso } from "@/lib/zagreb-time";

/**
 * Dopušta samo apsolutne http(s) URL-ove za `image_url` (glavna fotografija
 * unesena kao vanjski link, ne upload). Bez ovoga bi relativna putanja
 * (otkriven pred-postojeći podatkovni rub-slučaj — vidi CHANGELOG.md Faza 8,
 * Dan 75/76) tiho prošla server-side validaciju, pa bi je HTML5 `type="url"`
 * polje na admin formi kasnije tiho odbilo pri sljedećem uređivanju (bez
 * ikakve poruke greške) — bolje odbiti odmah, uz jasnu poruku.
 */
export function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

const ALLOWED_RETURN_PATHS = new Set<string>([
  "/admin/dogadjaji",
  "/admin/dogadjaji/duplikati",
]);

/**
 * Sanitizira "vrati me natrag" putanju za tok brisanja događaja (pozivaju
 * ga i stranica za prikaz i server akcija — jedan izvor istine). Točno
 * podudaranje (ne `startsWith`) — bez ovoga bi `returnTo` iz URL-a/forme
 * postao open-redirect vektor.
 */
export function sanitizeAdminReturnPath(
  value: string | null | undefined,
): string {
  if (value && ALLOWED_RETURN_PATHS.has(value)) {
    return value;
  }
  return "/admin/dogadjaji";
}

export type AdminEventListItem = {
  id: string;
  title: string;
  slug: string;
  start_at: string;
  status: string;
  category_name: string;
  location_name: string;
  source_name: string | null;
  source_url: string | null;
  submitter_email: string | null;
  submitter_phone: string | null;
  is_archived: boolean;
};

type AdminEventListRow = {
  id: string;
  title: string;
  slug: string;
  start_at: string;
  status: string;
  source_name: string | null;
  source_url: string | null;
  submitter_email: string | null;
  submitter_phone: string | null;
  is_archived: boolean;
  category: { name: string } | null;
  location: { name: string } | null;
};

/**
 * Svi događaji (admin — RLS "events_admin_full_access"), najbliži početak
 * prvi (korisnikov zahtjev — današnji/skorašnji događaji na vrhu liste).
 * `status` filtrira na jedan status (npr. "Na čekanju" prečac u
 * `/admin/dogadjaji`) — bez njega vraća sve statuse. `categoryId`/
 * `locationId` filtriraju po FK-u izravno (id, ne slug — admin dropdown
 * već radi s idjevima, isti obrazac kao `EventForm`), bez njih vraća sve.
 */
export async function listEventsForAdmin(
  status?: string,
  categoryId?: string,
  locationId?: string,
): Promise<AdminEventListItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("events")
    .select(
      `
      id, title, slug, start_at, status, source_name, source_url,
      submitter_email, submitter_phone, is_archived,
      category:categories ( name ),
      location:locations ( name )
    `,
    )
    .order("start_at", { ascending: true });

  if (status) {
    query = query.eq("status", status);
  }
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  if (locationId) {
    query = query.eq("location_id", locationId);
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
    source_name: row.source_name,
    source_url: row.source_url,
    submitter_email: row.submitter_email,
    submitter_phone: row.submitter_phone,
    is_archived: row.is_archived,
    category_name: row.category?.name ?? "—",
    location_name: row.location?.name ?? "—",
  }));
}

export type PendingEventGroupKey = "cron" | "korisnici" | "rucno";

export type PendingEventGroup = {
  key: PendingEventGroupKey;
  label: string;
  events: AdminEventListItem[];
};

const PENDING_GROUP_LABELS: Record<PendingEventGroupKey, string> = {
  cron: "Cron/scraper",
  korisnici: "Korisnici",
  rucno: "Ručno (uključujući CSV uvoz)",
};

/**
 * Grupira događaje na čekanju po kanalu unosa radi lakšeg moderiranja —
 * porijeklo se raspoznaje kombinacijom postojećih stupaca (nema zasebnog
 * "source" enuma): scraper uvijek postavlja `source_name`, javna prijava
 * uvijek postavlja `submitter_email`/`submitter_phone`, a CSV uvoz i ručni
 * unos su međusobno nerazlučivi u bazi (oba admin-autentificirana, bez tih
 * polja) pa se namjerno svrstavaju u istu grupu.
 */
export function groupPendingEventsBySource(
  events: AdminEventListItem[],
): PendingEventGroup[] {
  const buckets: Record<PendingEventGroupKey, AdminEventListItem[]> = {
    cron: [],
    korisnici: [],
    rucno: [],
  };

  for (const event of events) {
    if (event.source_name) {
      buckets.cron.push(event);
    } else if (event.submitter_email || event.submitter_phone) {
      buckets.korisnici.push(event);
    } else {
      buckets.rucno.push(event);
    }
  }

  return (["cron", "korisnici", "rucno"] as const)
    .map((key) => ({ key, label: PENDING_GROUP_LABELS[key], events: buckets[key] }))
    .filter((group) => group.events.length > 0);
}

/**
 * Bulk odobri/odbaci više događaja odjednom (Faza 6-7, ADR-020) — čini
 * review scraped događaja praktičnim kad ih dolazi desetci odjednom, umjesto
 * pojedinačnog otvaranja svakog kroz /uredi. Isti "jedan update poziv"
 * obrazac kao `clearOtherAdminFeatured`.
 */
export async function bulkUpdateEventStatus(
  supabase: SupabaseClient,
  ids: string[],
  status: "published" | "rejected",
): Promise<{ error: string | null }> {
  if (ids.length === 0) return { error: null };

  const { error } = await supabase
    .from("events")
    .update({ status })
    .in("id", ids);

  if (error) {
    console.error("bulkUpdateEventStatus:", error.message);
    return { error: error.message };
  }

  return { error: null };
}

export type DuplicateCandidateEvent = {
  id: string;
  title: string;
  slug: string;
  start_at: string;
  status: string;
  location_id: string;
  location_name: string;
  source_name: string | null;
};

type DuplicateCandidateRow = {
  id: string;
  title: string;
  slug: string;
  start_at: string;
  status: string;
  location_id: string;
  source_name: string | null;
  location: { name: string } | null;
};

/**
 * Svi neodbijeni događaji, za alat za otkrivanje duplikata
 * (`/admin/dogadjaji/duplikati`) — vidi `@/lib/duplicates`. Odbijeni
 * događaji su već riješeni (ne prikazuju se nigdje), pa nema smisla
 * ponovno ih predlagati za brisanje.
 */
export async function listEventsForDuplicateScan(): Promise<
  DuplicateCandidateEvent[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      `
      id, title, slug, start_at, status, location_id, source_name,
      location:locations ( name )
    `,
    )
    .neq("status", "rejected")
    .order("start_at", { ascending: true });

  if (error) {
    console.error("listEventsForDuplicateScan:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as DuplicateCandidateRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    start_at: row.start_at,
    status: row.status,
    location_id: row.location_id,
    location_name: row.location?.name ?? "—",
    source_name: row.source_name,
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
  sponsored_until: string | null;
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
       sponsored_until, submitter_email, submitter_phone,
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

export type MergeCandidateEvent = AdminEventDetail & {
  source_name: string | null;
  created_at: string;
};

type MergeCandidateRow = Omit<AdminEventDetail, "gallery"> & {
  source_name: string | null;
  created_at: string;
  event_images: { id: string; url: string; sort_order: number }[] | null;
};

/** Puni skup polja za N kandidata istovremeno, za alat spajanja duplikata. */
export async function getEventsForMerge(
  ids: string[],
): Promise<MergeCandidateEvent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      `id, slug, title, description, category_id, location_id, venue_name,
       start_at, end_at, organizer_name, organizer_contact, source_url,
       image_url, status, is_free, is_family_friendly, is_dog_friendly,
       is_solo_friendly, is_romantic, is_hidden_gem, is_admin_featured,
       sponsored_until, submitter_email, submitter_phone, source_name,
       created_at,
       event_images ( id, url, sort_order )`,
    )
    .in("id", ids);

  if (error) {
    console.error("getEventsForMerge:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as MergeCandidateRow[]).map((row) => {
    const { event_images, ...rest } = row;
    return {
      ...rest,
      gallery: (event_images ?? [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((img) => ({ id: img.id, url: img.url })),
    };
  });
}

function readFormText(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? "").trim();
  return value || null;
}

function readFormBool(formData: FormData, field: string): boolean {
  return formData.get(field) === "on";
}

/**
 * Jezgra validacije + upisa `EventForm` podataka — dijeli je `updateEvent`
 * (uredi/actions.ts) i `mergeEvents` (duplikati/spoji/actions.ts), oba
 * ciljaju isti oblik forme. `options.existingGallery` nadjačava interni upit
 * za postojeću galeriju — nužno za spajanje, gdje se strop od 6 slika mora
 * računati preko unije galerija svih kandidata, ne samo cilja `id`.
 */
export async function applyEventFormUpdate(
  supabase: SupabaseClient,
  id: string,
  formData: FormData,
  options?: { existingGallery?: { id: string; url: string }[] },
): Promise<{ error: string | null }> {
  const title = readFormText(formData, "title");
  const categoryId = readFormText(formData, "category_id");
  const locationId = readFormText(formData, "location_id");
  const startAtLocal = readFormText(formData, "start_at");
  const endAtLocal = readFormText(formData, "end_at");
  const imageUrlText = readFormText(formData, "image_url");
  const imageFile = formData.get("image_file");
  const hasImageFile = imageFile instanceof File && imageFile.size > 0;
  const status = readFormText(formData, "status") ?? "published";

  if (
    !title ||
    !categoryId ||
    !locationId ||
    !startAtLocal ||
    (!imageUrlText && !hasImageFile)
  ) {
    return {
      error:
        "Naslov, kategorija, lokacija, početak i fotografija (URL ili datoteka) su obavezni.",
    };
  }

  const startAt = zagrebLocalToUtcIso(startAtLocal);
  const endAt = endAtLocal ? zagrebLocalToUtcIso(endAtLocal) : null;

  if (endAt && endAt < startAt) {
    return { error: "Kraj događaja ne može biti prije početka." };
  }

  if (imageUrlText && !hasImageFile && !isAbsoluteUrl(imageUrlText)) {
    return {
      error:
        "Fotografija (URL) mora biti puna adresa koja počinje s http:// ili https://.",
    };
  }

  const isHiddenGem = readFormBool(formData, "is_hidden_gem");
  const isAdminFeatured = readFormBool(formData, "is_admin_featured");
  const sponsoredUntilLocal = readFormText(formData, "sponsored_until");
  const sponsoredUntil = sponsoredUntilLocal
    ? zagrebLocalToUtcIso(sponsoredUntilLocal)
    : null;

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
      return {
        error:
          '"Skriveni dragulj" ne može biti označen uz kategoriju "Velike Manifestacije" (proturječno).',
      };
    }
  }

  let imageUrl = imageUrlText;
  if (hasImageFile) {
    try {
      imageUrl = await uploadEventImage(supabase, imageFile);
    } catch (err) {
      return { error: (err as Error).message };
    }
  }

  const galleryFiles = formData
    .getAll("gallery_files")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const deleteGalleryIds = new Set<string>();
  for (const key of formData.keys()) {
    if (key.startsWith("delete_gallery_") && formData.get(key) === "on") {
      deleteGalleryIds.add(key.slice("delete_gallery_".length));
    }
  }

  let gallery: { id: string; url: string }[];
  if (options?.existingGallery) {
    gallery = options.existingGallery;
  } else {
    const { data: existingGallery } = await supabase
      .from("event_images")
      .select("id, url")
      .eq("event_id", id);
    gallery = (existingGallery ?? []) as { id: string; url: string }[];
  }
  const imagesToDelete = gallery.filter((img) => deleteGalleryIds.has(img.id));
  const remainingCount = gallery.length - imagesToDelete.length;

  if (remainingCount + galleryFiles.length > 6) {
    return {
      error: `Galerija smije imati najviše 6 slika (ostalo bi ${remainingCount}, pokušaj dodati ${galleryFiles.length}).`,
    };
  }

  const { error } = await supabase
    .from("events")
    .update({
      title,
      description: readFormText(formData, "description"),
      category_id: categoryId,
      location_id: locationId,
      venue_name: readFormText(formData, "venue_name"),
      start_at: startAt,
      end_at: endAt,
      organizer_name: readFormText(formData, "organizer_name"),
      organizer_contact: readFormText(formData, "organizer_contact"),
      source_url: readFormText(formData, "source_url"),
      image_url: imageUrl,
      status,
      is_free: readFormBool(formData, "is_free"),
      is_family_friendly: readFormBool(formData, "is_family_friendly"),
      is_dog_friendly: readFormBool(formData, "is_dog_friendly"),
      is_solo_friendly: readFormBool(formData, "is_solo_friendly"),
      is_romantic: readFormBool(formData, "is_romantic"),
      is_hidden_gem: isHiddenGem,
      is_admin_featured: isAdminFeatured,
      sponsored_until: sponsoredUntil,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  await deleteEventGalleryImages(supabase, imagesToDelete);
  try {
    await addEventGalleryImages(supabase, id, galleryFiles, remainingCount);
  } catch (err) {
    return { error: (err as Error).message };
  }

  return { error: null };
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
