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

/**
 * Današnji datum (YYYY-MM-DD) po Europe/Zagreb vremenu — ne po UTC-u ili
 * vremenu servera. "en-CA" locale je trik koji Intl formatira kao
 * YYYY-MM-DD bez ručnog slaganja stringa.
 */
export function todayInZagreb(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zagreb",
  }).format(new Date());
}

/**
 * Dohvaća objavljene događaje za zadani dan (Europe/Zagreb) preko
 * `events_on_date` SQL funkcije (supabase/migrations/0002_...).
 * Vremenska zona i DST se rješavaju u Postgresu, ne ovdje.
 */
export async function getEventsForDate(date: string): Promise<EventListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("events_on_date", {
    target_date: date,
  });

  if (error) {
    console.error("getEventsForDate:", error.message);
    return [];
  }

  return data ?? [];
}
