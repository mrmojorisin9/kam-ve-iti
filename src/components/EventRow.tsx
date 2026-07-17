import Link from "next/link";
import { formatEventTime } from "@/lib/format";
import type { EventListItem } from "@/lib/events";
import { CategoryIcon } from "@/components/CategoryIcon";
import { PinIcon } from "@/components/PinIcon";

const STARTS_SOON_WINDOW_MS = 60 * 60 * 1000;

export function EventRow({ event }: { event: EventListItem }) {
  const msUntilStart = new Date(event.start_at).getTime() - Date.now();
  const startsSoon = msUntilStart > 0 && msUntilStart <= STARTS_SOON_WINDOW_MS;

  return (
    <li className="animate-fade-in">
      <Link
        href={`/dogadjaji/${event.slug}`}
        className="group border-line bg-oak focus-visible:outline-gold hover:border-gold/40 flex items-center gap-4 rounded-lg border p-4 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30 focus-visible:outline-2 focus-visible:outline-offset-4 sm:gap-6"
      >
        <span className="text-gold font-mono text-2xl tabular-nums sm:text-3xl">
          {formatEventTime(event.start_at)}
        </span>

        <span className="relative shrink-0">
          <img
            src={event.image_url ?? "/event-placeholder.svg"}
            alt=""
            loading="lazy"
            className="border-line h-20 w-20 rounded-md border object-cover sm:h-24 sm:w-24"
          />
          {startsSoon && (
            <span
              className="absolute -top-1 -right-1 flex h-3 w-3"
              title="Uskoro počinje"
            >
              <span className="bg-gold absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
              <span className="bg-gold border-oak relative inline-flex h-3 w-3 rounded-full border" />
            </span>
          )}
        </span>

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
