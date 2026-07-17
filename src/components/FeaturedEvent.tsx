import Link from "next/link";
import { formatEventDateTime } from "@/lib/format";
import type { EventListItem } from "@/lib/events";

export function FeaturedEvent({ event }: { event: EventListItem }) {
  return (
    <Link
      href={`/dogadjaji/${event.slug}`}
      className="group border-line/60 mt-6 flex items-center gap-3 border-t pt-6 transition-colors hover:border-gold/40 sm:mt-0 sm:max-w-[220px] sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6"
    >
      <img
        src={event.image_url ?? "/event-placeholder.svg"}
        alt=""
        loading="lazy"
        className="border-line h-12 w-12 shrink-0 rounded-md border object-cover"
      />

      <span className="min-w-0 flex-1">
        <span className="text-gold font-mono text-[10px] tracking-[0.15em] uppercase">
          Sljedeći događaj
        </span>
        <span className="text-parchment group-hover:text-gold mt-1 block truncate text-sm font-medium">
          {event.title}
        </span>
        <span className="text-parchment-muted mt-0.5 block truncate text-xs">
          {formatEventDateTime(event.start_at)} · {event.location_name}
        </span>
      </span>
    </Link>
  );
}
