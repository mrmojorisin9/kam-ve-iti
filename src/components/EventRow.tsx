import Link from "next/link";
import { formatEventTime } from "@/lib/format";
import type { EventListItem } from "@/lib/events";
import { CategoryIcon } from "@/components/CategoryIcon";
import { PinIcon } from "@/components/PinIcon";

export function EventRow({ event }: { event: EventListItem }) {
  return (
    <li className="border-line border-b last:border-b-0">
      <Link
        href={`/dogadjaji/${event.slug}`}
        className="group focus-visible:outline-gold flex items-center gap-4 py-4 focus-visible:outline-2 focus-visible:outline-offset-4 sm:gap-6"
      >
        <span className="text-gold font-mono text-2xl tabular-nums sm:text-3xl">
          {formatEventTime(event.start_at)}
        </span>

        <img
          src={event.image_url ?? "/event-placeholder.svg"}
          alt=""
          loading="lazy"
          className="border-line h-14 w-14 shrink-0 rounded-md border object-cover sm:h-16 sm:w-16"
        />

        <span className="min-w-0 flex-1">
          <span className="font-display text-parchment group-hover:text-gold block text-lg font-medium text-balance sm:text-xl">
            {event.title}
          </span>
          <span className="text-parchment-muted mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
            <span className="inline-flex min-w-0 items-center gap-1">
              <PinIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {event.venue_name ? `${event.venue_name}, ` : ""}
                {event.location_name}
              </span>
            </span>

            <span className="border-gold/40 bg-gold/10 text-gold inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs tracking-wide uppercase">
              <CategoryIcon slug={event.category_slug} className="h-3 w-3" />
              {event.category_name}
            </span>
          </span>
        </span>
      </Link>
    </li>
  );
}
