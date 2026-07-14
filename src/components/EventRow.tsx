import Link from "next/link";
import { formatEventTime } from "@/lib/format";
import type { EventListItem } from "@/lib/events";

export function EventRow({ event }: { event: EventListItem }) {
  return (
    <li className="border-line border-b last:border-b-0">
      <Link
        href={`/dogadjaji/${event.slug}`}
        className="group focus-visible:outline-gold flex items-baseline gap-4 py-4 focus-visible:outline-2 focus-visible:outline-offset-4 sm:gap-6"
      >
        <span className="text-gold font-mono text-2xl tabular-nums sm:text-3xl">
          {formatEventTime(event.start_at)}
        </span>

        <span className="min-w-0 flex-1">
          <span className="font-display text-parchment group-hover:text-gold block text-lg font-medium text-balance sm:text-xl">
            {event.title}
          </span>
          <span className="text-parchment-muted mt-1 block truncate text-sm">
            {event.venue_name ? `${event.venue_name}, ` : ""}
            {event.location_name}
          </span>
        </span>

        <span className="border-line text-parchment-muted hidden shrink-0 rounded-full border px-3 py-1 text-xs tracking-wide uppercase sm:block">
          {event.category_name}
        </span>
      </Link>
    </li>
  );
}
