import type { EventListItem, PopularityBadge } from "@/lib/events";
import { EventRow } from "@/components/EventRow";

/**
 * Panel ispod hero-a na naslovnoj — prikazuje ISKLJUČIVO administratorov
 * ručni odabir (ADR-015, korisnikova izmjena: algoritamski "top"
 * događaji se ovdje nikad ne prikazuju, ni kao popuna). Ne renderira se
 * ako admin nije ništa istaknuo.
 */
export function TrendingPanel({ event }: { event: EventListItem | null }) {
  if (!event) return null;

  const badges: PopularityBadge[] = ["editorial"];
  if (event.is_trending) badges.push("rising");

  return (
    <section aria-label="U trendu" className="mb-10">
      <h2 className="text-parchment-muted mb-3 font-mono text-xs tracking-[0.2em] uppercase">
        🔥 U trendu
      </h2>
      <ul className="space-y-3">
        <EventRow event={event} badges={badges} />
      </ul>
    </section>
  );
}
