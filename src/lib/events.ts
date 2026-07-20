import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { LOCATION_TO_REGION } from "@/lib/regions";

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
  is_free: boolean;
  is_family_friendly: boolean;
  is_dog_friendly: boolean;
  is_solo_friendly: boolean;
  is_romantic: boolean;
  is_hidden_gem: boolean;
  /** Vidi DECISIONS.md ADR-014 — odsutan (undefined) za upite koji ga ne
   * računaju (npr. getEventBySlug), prisutan za sve RPC liste događaja. */
  popularity_score?: number;
  /** Pregledi zadnja 3 dana > prethodna 3 dana (event_is_trending SQL). */
  is_trending?: boolean;
  /** Ručni admin odabir za panel "U trendu" — vidi getAdminFeaturedEvent. */
  is_admin_featured?: boolean;
  /** Sirovi (ne raspadajući) ukupni broj pregleda — diskretni brojač na kartici. */
  view_count?: number;
};

export type EventDetail = EventListItem & {
  organizer_name: string | null;
  organizer_contact: string | null;
  source_url: string | null;
};

export type EventFilters = {
  categorySlug?: string;
  regionSlug?: string;
  isFree?: boolean;
  isFamilyFriendly?: boolean;
  isDogFriendly?: boolean;
  isSoloFriendly?: boolean;
  isRomantic?: boolean;
  isHiddenGem?: boolean;
};

/**
 * Definicije 6 pametnih filtera (Razina 3) — dijele je FilterBar
 * (checkboxovi) i ActiveFilters (uklonjivi chipovi) da naziv/oznaka
 * postoje na jednom mjestu.
 */
export const SMART_TAG_DEFS: {
  key: "isFree" | "isFamilyFriendly" | "isDogFriendly" | "isSoloFriendly" | "isRomantic" | "isHiddenGem";
  param: string;
  label: string;
}[] = [
  { key: "isFree", param: "besplatno", label: "Potpuno besplatno" },
  { key: "isFamilyFriendly", param: "obitelj", label: "Za obitelji s djecom" },
  { key: "isDogFriendly", param: "dog", label: "Dog-friendly" },
  { key: "isSoloFriendly", param: "solo", label: "Idem solo" },
  { key: "isRomantic", param: "romanticno", label: "Romantični izlazak" },
  { key: "isHiddenGem", param: "dragulj", label: "💎 Skriveni dragulji" },
];

/** Sirovi (string) GET query parametri s javnih ruta prije parsiranja. */
export type RawEventSearchParams = {
  kategorija?: string;
  regija?: string;
  besplatno?: string;
  obitelj?: string;
  dog?: string;
  solo?: string;
  romanticno?: string;
  dragulj?: string;
};

/**
 * Pretvara query parametre GET forme (FilterBar) u EventFilters. Dijele je
 * sve 4 javne rute da se ovo parsiranje ne ponavlja — checkboxovi šalju
 * "on" kad su označeni, izostaju iz query stringa kad nisu.
 */
export function parseEventFilters(params: RawEventSearchParams): EventFilters {
  return {
    categorySlug: params.kategorija || undefined,
    regionSlug: params.regija || undefined,
    isFree: params.besplatno === "on" || undefined,
    isFamilyFriendly: params.obitelj === "on" || undefined,
    isDogFriendly: params.dog === "on" || undefined,
    isSoloFriendly: params.solo === "on" || undefined,
    isRomantic: params.romanticno === "on" || undefined,
    isHiddenGem: params.dragulj === "on" || undefined,
  };
}

/**
 * Obrat od parseEventFilters — pretvara EventFilters natrag u query
 * parametre. Koristi ga ActiveFilters za izradu linkova koji uklanjaju
 * samo jedan filtar, zadržavajući ostale.
 */
export function filtersToParams(filters: EventFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.categorySlug) params.kategorija = filters.categorySlug;
  if (filters.regionSlug) params.regija = filters.regionSlug;
  if (filters.isFree) params.besplatno = "on";
  if (filters.isFamilyFriendly) params.obitelj = "on";
  if (filters.isDogFriendly) params.dog = "on";
  if (filters.isSoloFriendly) params.solo = "on";
  if (filters.isRomantic) params.romanticno = "on";
  if (filters.isHiddenGem) params.dragulj = "on";
  return params;
}

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
  is_free: boolean;
  is_family_friendly: boolean;
  is_dog_friendly: boolean;
  is_solo_friendly: boolean;
  is_romantic: boolean;
  is_hidden_gem: boolean;
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
 * Filtrira listu događaja po kategoriji/regiji/pametnim filtrima u
 * aplikacijskom sloju (ne u SQL-u) — vidi DECISIONS.md ADR-008 za
 * obrazloženje. Regija se provjerava preko LOCATION_TO_REGION (naselje →
 * regija), ne izravnom usporedbom sluga — vidi src/lib/regions.ts.
 * Pametni filtri (Razina 3) kombiniraju se AND logikom — svaki odabrani
 * tag mora biti zadovoljen, ne dovoljan je bilo koji.
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
      filters.regionSlug &&
      LOCATION_TO_REGION[event.location_slug] !== filters.regionSlug
    ) {
      return false;
    }
    if (filters.isFree && !event.is_free) return false;
    if (filters.isFamilyFriendly && !event.is_family_friendly) return false;
    if (filters.isDogFriendly && !event.is_dog_friendly) return false;
    if (filters.isSoloFriendly && !event.is_solo_friendly) return false;
    if (filters.isRomantic && !event.is_romantic) return false;
    if (filters.isHiddenGem && !event.is_hidden_gem) return false;
    return true;
  });
}

export type EventQueryResult = {
  events: EventListItem[];
  /** Postavljeno kad je točan presjek dao 0 rezultata pa je sustav progresivno
   * popustio filtre (nikad kategoriju) da ponudi nešto umjesto prazne stranice. */
  relaxedFrom?: "tags" | "region";
};

function hasActiveSmartFilters(filters?: EventFilters): boolean {
  if (!filters) return false;
  return SMART_TAG_DEFS.some((tag) => filters[tag.key]);
}

/**
 * Kao applyFilters, ali kad točan presjek svih razina da 0 rezultata,
 * progresivno popušta od najmanje bitnog filtra prema najbitnijem:
 * prvo pametni tagovi (Razina 3), zatim regija (Razina 2), kategorija
 * (Razina 1) se nikad ne miče jer je to primarna namjera korisnika.
 */
function applyFiltersWithFallback(
  events: EventListItem[],
  filters?: EventFilters,
): EventQueryResult {
  const exact = applyFilters(events, filters);
  if (exact.length > 0 || !filters) {
    return { events: exact };
  }

  if (hasActiveSmartFilters(filters)) {
    const withoutTags = applyFilters(events, {
      categorySlug: filters.categorySlug,
      regionSlug: filters.regionSlug,
    });
    if (withoutTags.length > 0) {
      return { events: withoutTags, relaxedFrom: "tags" };
    }
  }

  if (filters.regionSlug) {
    const withoutRegion = applyFilters(events, {
      categorySlug: filters.categorySlug,
    });
    if (withoutRegion.length > 0) {
      return { events: withoutRegion, relaxedFrom: "region" };
    }
  }

  return { events: [] };
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
 * Raspon (YYYY-MM-DD) za naslovnu (/, "Tjedan" tab): rolling 11-dnevni
 * prozor od danas do danas+10 (uključivo), ne kalendarski tjedan (izmjena,
 * ranije je bio ponedjeljak-nedjelja istog tjedna, potom zaseban /tjedan
 * prije nego je naslovna preuzela isti raspon — vidi CHANGELOG).
 */
export function weekRangeInZagreb(): { start: string; end: string } {
  const today = todayInZagreb();
  return { start: today, end: addDaysToZagrebDate(today, 10) };
}

/**
 * Dohvaća objavljene događaje za zadani dan (Europe/Zagreb) preko
 * `events_on_date` SQL funkcije, uz opcionalno filtriranje po
 * kategoriji/regiji/pametnim filtrima (aplikacijski sloj — vidi
 * applyFiltersWithFallback). RPC poziv ne ovisi o filterima (samo o
 * datumu) pa se popuštanje filtara radi lokalno bez dodatnog upita.
 */
export async function getEventsForDate(
  date: string,
  filters?: EventFilters,
): Promise<EventQueryResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("events_on_date", {
    target_date: date,
  });

  if (error) {
    console.error("getEventsForDate:", error.message);
    return { events: [] };
  }

  return applyFiltersWithFallback(data ?? [], filters);
}

/**
 * Dohvaća objavljene događaje unutar datumskog raspona (uključivo) preko
 * `events_in_range` SQL funkcije, uz opcionalno filtriranje po
 * kategoriji/regiji/pametnim filtrima (aplikacijski sloj — vidi
 * applyFiltersWithFallback).
 */
export async function getEventsInRange(
  start: string,
  end: string,
  filters?: EventFilters,
): Promise<EventQueryResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("events_in_range", {
    range_start: start,
    range_end: end,
  });

  if (error) {
    console.error("getEventsInRange:", error.message);
    return { events: [] };
  }

  return applyFiltersWithFallback(data ?? [], filters);
}

type AdminFeaturedRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  venue_name: string | null;
  start_at: string;
  end_at: string | null;
  image_url: string | null;
  category: { name: string; slug: string } | null;
  location: { name: string; slug: string } | null;
  is_free: boolean;
  is_family_friendly: boolean;
  is_dog_friendly: boolean;
  is_solo_friendly: boolean;
  is_romantic: boolean;
  is_hidden_gem: boolean;
};

/**
 * Događaj za panel "U trendu" na naslovnoj (ADR-014/015) — ISKLJUČIVO
 * administratorov ručni odabir (korisnikova izmjena: algoritamski "top"
 * događaji se u ovom panelu nikad ne prikazuju). `null` (panel se ne
 * renderira) ako admin nije ništa istaknuo, ili je istaknuti događaj
 * prošao/neobjavljen.
 */
export async function getAdminFeaturedEvent(): Promise<EventListItem | null> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("events")
    .select(
      `
      id, title, slug, description, venue_name, start_at, end_at, image_url,
      category:categories ( name, slug ),
      location:locations ( name, slug ),
      is_free, is_family_friendly, is_dog_friendly, is_solo_friendly,
      is_romantic, is_hidden_gem
    `,
    )
    .eq("is_admin_featured", true)
    .eq("status", "published")
    .gte("start_at", new Date().toISOString())
    .maybeSingle();

  const featured = row as AdminFeaturedRow | null;
  if (!featured || !featured.category || !featured.location) {
    return null;
  }

  const [{ data: isTrending }, { data: viewCount }] = await Promise.all([
    supabase.rpc("event_is_trending", { p_event_id: featured.id }),
    supabase.rpc("event_view_count", { p_event_id: featured.id }),
  ]);

  return {
    id: featured.id,
    title: featured.title,
    slug: featured.slug,
    description: featured.description,
    venue_name: featured.venue_name,
    start_at: featured.start_at,
    end_at: featured.end_at,
    image_url: featured.image_url,
    category_name: featured.category.name,
    category_slug: featured.category.slug,
    location_name: featured.location.name,
    location_slug: featured.location.slug,
    is_free: featured.is_free,
    is_family_friendly: featured.is_family_friendly,
    is_dog_friendly: featured.is_dog_friendly,
    is_solo_friendly: featured.is_solo_friendly,
    is_romantic: featured.is_romantic,
    is_hidden_gem: featured.is_hidden_gem,
    is_admin_featured: true,
    is_trending: isTrending ?? false,
    view_count: viewCount ?? 0,
  };
}

export type PopularityBadge =
  | "editorial"
  | "trending-week"
  | "hot"
  | "recommended"
  | "rising";

export const POPULARITY_BADGE_META: Record<
  PopularityBadge,
  { emoji: string; label: string }
> = {
  editorial: { emoji: "📌", label: "Urednički izbor" },
  "trending-week": { emoji: "🎉", label: "Najpopularnije ovaj tjedan" },
  hot: { emoji: "🔥", label: "Popularno" },
  recommended: { emoji: "⭐", label: "Preporučeno" },
  rising: { emoji: "📈", label: "U trendu" },
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Računa oznake popularnosti (ADR-014) relativno na TRENUTNO PRIKAZANU
 * listu događaja (percentil unutar te liste, ne globalno preko cijelog
 * portala) — vraća mapu event.id -> oznake. Događaji bez ikakvog stvarnog
 * signala (popularity_score 0, npr. tek pokrenut portal bez pregleda)
 * nikad ne dobivaju 🎉/🔥/⭐ — samo 📈 ovisi isključivo o vlastitom trendu
 * pregleda, ne o rangu unutar liste.
 */
export function computePopularityBadges(
  events: EventListItem[],
): Map<string, PopularityBadge[]> {
  const badges = new Map<string, PopularityBadge[]>();
  const scored = events.filter(
    (event) => typeof event.popularity_score === "number",
  );
  if (scored.length === 0) return badges;

  const sorted = [...scored].sort(
    (a, b) => (b.popularity_score ?? 0) - (a.popularity_score ?? 0),
  );
  const top10Count = Math.max(1, Math.ceil(sorted.length * 0.1));
  const top25Count = Math.max(1, Math.ceil(sorted.length * 0.25));

  const now = Date.now();
  const topOfWeek = sorted.find(
    (event) =>
      (event.popularity_score ?? 0) > 0 &&
      new Date(event.start_at).getTime() - now <= WEEK_MS,
  );

  sorted.forEach((event, index) => {
    const eventBadges: PopularityBadge[] = [];
    const hasSignal = (event.popularity_score ?? 0) > 0;

    if (topOfWeek && event.id === topOfWeek.id) {
      eventBadges.push("trending-week");
    } else if (hasSignal && index < top10Count) {
      eventBadges.push("hot");
    } else if (hasSignal && index < top25Count) {
      eventBadges.push("recommended");
    }

    if (event.is_trending) {
      eventBadges.push("rising");
    }

    if (event.is_admin_featured) {
      eventBadges.unshift("editorial");
    }

    if (eventBadges.length > 0) {
      badges.set(event.id, eventBadges);
    }
  });

  return badges;
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
        location:locations ( name, slug ),
        is_free,
        is_family_friendly,
        is_dog_friendly,
        is_solo_friendly,
        is_romantic,
        is_hidden_gem
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
      is_free: row.is_free,
      is_family_friendly: row.is_family_friendly,
      is_dog_friendly: row.is_dog_friendly,
      is_solo_friendly: row.is_solo_friendly,
      is_romantic: row.is_romantic,
      is_hidden_gem: row.is_hidden_gem,
    };
  },
);