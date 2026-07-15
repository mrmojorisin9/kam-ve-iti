import {
  getEventsInRange,
  getCategories,
  getLocations,
  type EventListItem,
  type EventFilters,
} from "@/lib/events";
import { formatHeaderDate } from "@/lib/format";
import { EventRow } from "@/components/EventRow";
import { EmptyState } from "@/components/EmptyState";
import { DateNav, type DateNavKey } from "@/components/DateNav";
import { PageHeader } from "@/components/PageHeader";
import { FilterBar } from "@/components/FilterBar";

function groupByDay(events: EventListItem[]): Map<string, EventListItem[]> {
  const groups = new Map<string, EventListItem[]>();

  for (const event of events) {
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Zagreb",
    }).format(new Date(event.start_at));

    const existing = groups.get(day);
    if (existing) {
      existing.push(event);
    } else {
      groups.set(day, [event]);
    }
  }

  return groups;
}

export async function RangeView({
  start,
  end,
  active,
  subtitle,
  path,
  filters,
}: {
  start: string;
  end: string;
  active: DateNavKey;
  subtitle: string;
  path: string;
  filters: EventFilters;
}) {
  const [events, categories, locations] = await Promise.all([
    getEventsInRange(start, end, filters),
    getCategories(),
    getLocations(),
  ]);
  const grouped = groupByDay(events);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12 sm:py-20">
      <PageHeader subtitle={subtitle} />
      <DateNav active={active} />

      <FilterBar
        categories={categories}
        locations={locations}
        action={path}
        selectedCategory={filters.categorySlug}
        selectedLocation={filters.locationSlug}
      />

      {grouped.size === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          {[...grouped.entries()].map(([day, dayEvents]) => (
            <section key={day}>
              <h2 className="text-parchment-muted font-mono text-xs tracking-[0.15em] uppercase">
                {formatHeaderDate(day)}
              </h2>
              <ul className="mt-2">
                {dayEvents.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}