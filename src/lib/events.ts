import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type EventListItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  venue_name: string | null;
  start_at: string;
  end_at: string | null;
  image_url: string | null;
  category_name: string;
  category_slug: string;
  location_name: string;
  location_slug: string;
};

export type EventDetail = EventListItem & {
  organizer_name: string | null;
  organizer_contact: string | null;
  source_url: string | null;
};

export type EventFilters = {
  categorySlug?: string;
  locationSlug?: string;
};

export type FilterOption = {
  slug: string;
  name: string;
};

type EventBySlugRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  venue_name: string | null;
  start_at: string;
  end_at: string | null;
  image_url: string | null;
  organizer_name: string | null;
  organizer_contact: string | null;
  source_url: string | null;
  category: { name: string; slug: string } | null;
  location: { name: string; slug: string } | null;
};

function zagrebDateFromInstant(instant: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zagreb",
  }).format(instant);
}

function zagrebDateToNoonInstant(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`);
}

function weekdayOf(dateStr: string): number {
  return zagrebDateToNoonInstant(dateStr).getDay();
}

function addDaysToZagrebDate(dateStr: string, days: number): string {
  const date = zagrebDateToNoonInstant(dateStr);
  date.setDate(date.getDate() + days);
  return zagrebDateFromInstant(date);
}

/**
 * Filtrira listu događaja po kategoriji/lokaciji u aplikacijskom sloju
 * (ne u SQL-u) — vidi DECISIONS.md ADR-008 za obrazloženje.
 */
function applyFilters(
  events: EventListItem[],
  filters?: EventFilters,
): EventListItem[] {
  if (!filters) return events;

  return events.filter((event) => {
    if (
      filters.categorySlug &&
      event.category_slug !== filters.categorySlug
    ) {
      return false;
    }
    if (
      filters.locationSlug &&
      event.location_slug !== filters.locationSlug
    ) {
      return false;
    }
    return true;
  });
}

/** Današnji datum (YYYY-MM-DD) po Europe/Zagreb vremenu. */
export function todayInZagreb(): string {
  return zagrebDateFromInstant(new Date());
}

/** Sutrašnji datum (YYYY-MM-DD) po Europe/Zagreb vremenu. */
export function tomorrowInZagreb(): string {
  return addDaysToZagrebDate(todayInZagreb(), 1);
}

/**
 * Raspon (YYYY-MM-DD) ovog vikenda: pon–pet → nadolazeća subota–nedjelja;
 * subota → danas i sutra; nedjelja → samo danas (subota je već prošla).
 */
export function weekendRangeInZagreb(): { start: string; end: string } {
  const today = todayInZagreb();
  const day = weekdayOf(today);

  if (day === 0) {
    return { start: today, end: today };
  }
  if (day === 6) {
    return { start: today, end: addDaysToZagrebDate(today, 1) };
  }
  const start = addDaysToZagrebDate(today, 6 - day);
  return { start, end: addDaysToZagrebDate(start, 1) };
}

/**
 * Raspon (YYYY-MM-DD) ovog tjedna: od danas do nedjelje istog tjedna
 * (tjedan počinje ponedjeljkom; prošli dani se ne prikazuju).
 */
export function weekRangeInZagreb(): { start: string; end: string } {
  const today = todayInZagreb();
  const day = weekdayOf(today);
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  return { start: today, end: addDaysToZagrebDate(today, daysUntilSunday) };
}

/**
 * Dohvaća objavljene događaje za zadani dan (Europe/Zagreb) preko
 * `events_on_date` SQL funkcije, uz opcionalno filtriranje po
 * kategoriji/lokaciji (aplikacijski sloj — vidi applyFilters).
 */
export async function getEventsForDate(
  date: string,
  filters?: EventFilters,
): Promise<EventListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("events_on_date", {
    target_date: date,
  });

  if (error) {
    console.error("getEventsForDate:", error.message);
    return [];
  }

  return applyFilters(data ?? [], filters);
}

/**
 * Dohvaća objavljene događaje unutar datumskog raspona (uključivo) preko
 * `events_in_range` SQL funkcije, uz opcionalno filtriranje po
 * kategoriji/lokaciji (aplikacijski sloj — vidi applyFilters).
 */
export async function getEventsInRange(
  start: string,
  end: string,
  filters?: EventFilters,
): Promise<EventListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("events_in_range", {
    range_start: start,
    range_end: end,
  });

  if (error) {
    console.error("getEventsInRange:", error.message);
    return [];
  }

  return applyFilters(data ?? [], filters);
}

/** Sve kategorije, za filter UI, poredane po sort_order (ADR-005). */
export async function getCategories(): Promise<FilterOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("slug, name")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getCategories:", error.message);
    return [];
  }

  return data ?? [];
}

export type SitemapEntry = { slug: string; updatedAt: string };

/**
 * Slug + zadnja izmjena svih objavljenih događaja, za `sitemap.ts`. RLS
 * ("events_public_read_published") već ograničava na objavljene za
 * neautenticirani zahtjev kojim crawler dohvaća /sitemap.xml — eksplicitni
 * filter ovdje samo dokumentira namjeru.
 */
export async function getPublishedEventsForSitemap(): Promise<
  SitemapEntry[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("slug, updated_at")
    .eq("status", "published");

  if (error) {
    console.error("getPublishedEventsForSitemap:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    slug: row.slug,
    updatedAt: row.updated_at,
  }));
}

/** Sve lokacije, za filter UI, poredane abecedno. */
export async function getLocations(): Promise<FilterOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .select("slug, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("getLocations:", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Dohvaća jedan događaj po slugu, s nazivom kategorije i lokacije.
 * `cache()` sprječava dvostruki upit prema bazi kad i `generateMetadata`
 * i sama stranica pozovu ovu funkciju za isti request. RLS
 * ("events_public_read_published") već skriva neobjavljene događaje od
 * javnosti, pa nema potrebe za ručnim filtriranjem statusa ovdje.
 *
 * Napomena: `category`/`location` se ovdje ručno castaju na `EventBySlugRow`
 * jer klijent (bez generiranih Database tipova iz `supabase gen types`) ne
 * zna da je FK veza jedan-na-jedan i inače bi ih pogrešno tipizirao kao
 * nizove. Kad se `src/types/database.ts` jednom generira, ovaj cast se
 * može ukloniti i klijent otipkati s `createClient<Database>()`.
 */
export const getEventBySlug = cache(
  async (slug: string): Promise<EventDetail | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        id,
        title,
        slug,
        description,
        venue_name,
        start_at,
        end_at,
        image_url,
        organizer_name,
        organizer_contact,
        source_url,
        category:categories ( name, slug ),
        location:locations ( name, slug )
      `,
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("getEventBySlug:", error.message);
      return null;
    }

    const row = data as EventBySlugRow | null;

    if (!row || !row.category || !row.location) {
      return null;
    }

    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      venue_name: row.venue_name,
      start_at: row.start_at,
      end_at: row.end_at,
      image_url: row.image_url,
      organizer_name: row.organizer_name,
      organizer_contact: row.organizer_contact,
      source_url: row.source_url,
      category_name: row.category.name,
      category_slug: row.category.slug,
      location_name: row.location.name,
      location_slug: row.location.slug,
    };
  },
);