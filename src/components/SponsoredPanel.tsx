import type { EventListItem, PopularityBadge } from "@/lib/events";
import { EventRow } from "@/components/EventRow";

const SPONSORED_BADGES: PopularityBadge[] = ["sponsored"];

/**
 * Panel na naslovnoj za plaćeno istaknute događaje (Faza 8, Dan 76,
 * Monetizacija dio 1) — odvojen od uredničkog "U trendu" panela
 * (TrendingPanel), namjerno renderiran ISPOD njega da plaćeni sadržaj nikad
 * ne djeluje kao urednička preporuka. Ne renderira se za prazan niz.
 */
export function SponsoredPanel({ events }: { events: EventListItem[] }) {
  if (events.length === 0) return null;

  return (
    <section aria-label="Sponzorirano" className="mb-10">
      <h2 className="text-parchment-muted mb-3 font-mono text-xs tracking-[0.2em] uppercase">
        📢 Sponzorirano
      </h2>
      <ul className="space-y-3">
        {events.map((event) => (
          <EventRow key={event.id} event={event} badges={SPONSORED_BADGES} />
        ))}
      </ul>
    </section>
  );
}
