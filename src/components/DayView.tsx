import {
  getEventsForDate,
  getCategories,
  computePopularityBadges,
  sortEventsByPopularity,
  type EventFilters,
  type SortOrder,
} from "@/lib/events";
import { REGIONS } from "@/lib/regions";
import { EventRow } from "@/components/EventRow";
import { EmptyState } from "@/components/EmptyState";
import { DateNav, type DateNavKey } from "@/components/DateNav";
import { PageHeader } from "@/components/PageHeader";
import { FilterBar } from "@/components/FilterBar";
import { CategoryStrip } from "@/components/CategoryStrip";
import { ActiveFilters } from "@/components/ActiveFilters";
import { FallbackNotice } from "@/components/FallbackNotice";
import { SortToggle } from "@/components/SortToggle";

export async function DayView({
  date,
  active,
  path,
  filters,
  showCategoryStrip = false,
  sortBy,
}: {
  date: string;
  active: DateNavKey;
  path: string;
  filters: EventFilters;
  showCategoryStrip?: boolean;
  sortBy?: SortOrder;
}) {
  const [{ events: fetchedEvents, relaxedFrom }, categories] = await Promise.all([
    getEventsForDate(date, filters),
    getCategories(),
  ]);
  const badges = computePopularityBadges(fetchedEvents);
  const events =
    sortBy === "popularity"
      ? sortEventsByPopularity(fetchedEvents)
      : fetchedEvents;

  return (
    <>
      <PageHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12 sm:py-20 md:max-w-3xl lg:max-w-5xl">
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
        ) : (
          <>
            {relaxedFrom && <FallbackNotice relaxedFrom={relaxedFrom} />}
            <ul className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {events.map((event) => (
                <EventRow key={event.id} event={event} badges={badges.get(event.id)} />
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  );
}
