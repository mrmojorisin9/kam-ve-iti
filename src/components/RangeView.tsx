import {
  getEventsInRange,
  getCategories,
  getAdminFeaturedEvent,
  computePopularityBadges,
  sortEventsByPopularity,
  type EventListItem,
  type EventFilters,
  type SortOrder,
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
import { TrendingPanel } from "@/components/TrendingPanel";
import { SortToggle } from "@/components/SortToggle";

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
  showTrending = false,
  sortBy,
}: {
  start: string;
  end: string;
  active: DateNavKey;
  path: string;
  filters: EventFilters;
  showCategoryStrip?: boolean;
  showTrending?: boolean;
  sortBy?: SortOrder;
}) {
  const [{ events, relaxedFrom }, categories, featuredEvent] =
    await Promise.all([
      getEventsInRange(start, end, filters),
      getCategories(),
      showTrending ? getAdminFeaturedEvent() : Promise.resolve(null),
    ]);
  const badges = computePopularityBadges(events);
  // Sort po popularnosti namjerno prikazuje RAVNU listu (bez grupiranja po
  // danu) — pravo rangiranje preko cijelog raspona, ne samo unutar svakog
  // dana zasebno (dan-grupe bi razbile smisao "najpopularnije prvo").
  const popularityRanked =
    sortBy === "popularity" ? sortEventsByPopularity(events) : null;
  const grouped = groupByDay(events);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12 sm:py-20 md:max-w-3xl lg:max-w-5xl">
      <PageHeader />

      {showTrending && <TrendingPanel event={featuredEvent} />}

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

      <ActiveFilters
        basePath={path}
        filters={filters}
        categories={categories}
        sortBy={sortBy}
      />

      {events.length > 1 && (
        <SortToggle basePath={path} filters={filters} sortBy={sortBy} />
      )}

      {events.length === 0 ? (
        <EmptyState />
      ) : popularityRanked ? (
        <div className="space-y-8">
          {relaxedFrom && <FallbackNotice relaxedFrom={relaxedFrom} />}
          <ul className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {popularityRanked.map((event) => (
              <EventRow key={event.id} event={event} badges={badges.get(event.id)} />
            ))}
          </ul>
        </div>
      ) : (
        <div className="space-y-8">
          {relaxedFrom && <FallbackNotice relaxedFrom={relaxedFrom} />}
          {[...grouped.entries()].map(([day, dayEvents]) => (
            <section key={day}>
              <h2 className="text-parchment-muted font-mono text-xs tracking-[0.15em] uppercase">
                {formatHeaderDate(day)}
              </h2>
              <ul className="mt-2 space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                {dayEvents.map((event) => (
                  <EventRow key={event.id} event={event} badges={badges.get(event.id)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}