import {
  getEventsInRange,
  getCategories,
  type EventListItem,
  type EventFilters,
} from "@/lib/events";
import { REGIONS } from "@/lib/regions";
import { formatHeaderDate } from "@/lib/format";
import { EventRow } from "@/components/EventRow";
import { EmptyState } from "@/components/EmptyState";
import { DateNav, type DateNavKey } from "@/components/DateNav";
import { PageHeader } from "@/components/PageHeader";
import { FilterBar } from "@/components/FilterBar";
import { CategoryStrip } from "@/components/CategoryStrip";
import { ActiveFilters } from "@/components/ActiveFilters";
import { FallbackNotice } from "@/components/FallbackNotice";

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
  path,
  filters,
  showCategoryStrip = false,
}: {
  start: string;
  end: string;
  active: DateNavKey;
  path: string;
  filters: EventFilters;
  showCategoryStrip?: boolean;
}) {
  const [{ events, relaxedFrom }, categories] = await Promise.all([
    getEventsInRange(start, end, filters),
    getCategories(),
  ]);
  const grouped = groupByDay(events);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12 sm:py-20">
      <PageHeader />
      <DateNav active={active} />

      {showCategoryStrip && (
        <CategoryStrip
          categories={categories}
          activeSlug={filters.categorySlug}
          selectedRegion={filters.regionSlug}
        />
      )}

      <FilterBar
        categories={categories}
        regions={REGIONS}
        action={path}
        selectedCategory={filters.categorySlug}
        selectedRegion={filters.regionSlug}
        smartFilters={filters}
        showCategory={!showCategoryStrip}
      />

      <ActiveFilters basePath={path} filters={filters} categories={categories} />

      {grouped.size === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          {relaxedFrom && <FallbackNotice relaxedFrom={relaxedFrom} />}
          {[...grouped.entries()].map(([day, dayEvents]) => (
            <section key={day}>
              <h2 className="text-parchment-muted font-mono text-xs tracking-[0.15em] uppercase">
                {formatHeaderDate(day)}
              </h2>
              <ul className="mt-2 space-y-3">
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