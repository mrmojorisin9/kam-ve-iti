import Link from "next/link";
import { formatEventTime } from "@/lib/format";
import {
  POPULARITY_BADGE_META,
  type EventListItem,
  type PopularityBadge,
} from "@/lib/events";
import { CategoryIcon } from "@/components/CategoryIcon";
import { PinIcon } from "@/components/PinIcon";

const STARTS_SOON_WINDOW_MS = 60 * 60 * 1000;

export function EventRow({
  event,
  badges,
}: {
  event: EventListItem;
  badges?: PopularityBadge[];
}) {
  const msUntilStart = new Date(event.start_at).getTime() - Date.now();
  const startsSoon = msUntilStart > 0 && msUntilStart <= STARTS_SOON_WINDOW_MS;

  return (
    <li className="animate-fade-in">
      <Link
        href={`/dogadjaji/${event.slug}`}
        className="group border-line bg-oak focus-visible:outline-gold hover:border-gold/40 ring-1 ring-white/5 flex items-center gap-4 rounded-lg border p-5 shadow-sm shadow-black/20 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40 focus-visible:outline-2 focus-visible:outline-offset-4 sm:gap-6"
      >
        <span className="flex shrink-0 flex-col items-center gap-1.5">
          <span className="relative">
            <img
              src={event.image_url ?? "/event-placeholder.svg"}
              alt=""
              loading="lazy"
              className="border-line h-24 w-24 rounded-lg border object-cover sm:h-32 sm:w-32"
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
          <span className="text-gold font-mono text-sm tabular-nums sm:text-base">
            {formatEventTime(event.start_at)}
          </span>
        </span>

        <span className="min-w-0 flex-1">
          {badges && badges.length > 0 && (
            <span className="mb-1 flex flex-wrap gap-1.5">
              {badges.map((badge) => {
                const meta = POPULARITY_BADGE_META[badge];
                return (
                  <span
                    key={badge}
                    className="bg-gold text-night inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase"
                  >
                    <span aria-hidden="true">{meta.emoji}</span>
                    {meta.label}
                  </span>
                );
              })}
            </span>
          )}
          <span className="font-display text-parchment group-hover:text-gold block text-lg font-semibold text-balance sm:text-xl">
            {event.title}
          </span>
          <span className="text-parchment-muted mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="inline-flex min-w-0 items-center gap-1">
              <PinIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {event.location_name}
                {event.venue_name ? `, ${event.venue_name}` : ""}
              </span>
            </span>

            <span className="border-gold/40 bg-gold/10 text-gold inline-flex min-w-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs tracking-wide uppercase">
              <CategoryIcon slug={event.category_slug} className="h-3 w-3 shrink-0" />
              <span className="truncate">{event.category_name}</span>
            </span>

            {typeof event.view_count === "number" && (
              <span
                className="text-parchment-muted/60 inline-flex shrink-0 items-center gap-1 text-xs"
                title="Broj pregleda"
              >
                <span aria-hidden="true">👁</span>
                {event.view_count}
              </span>
            )}
          </span>
        </span>
      </Link>
    </li>
  );
}
