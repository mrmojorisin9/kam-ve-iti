import {
  getEventsForDate,
  getCategories,
  getLocations,
  getNextUpcomingEvent,
  type EventFilters,
} from "@/lib/events";
import { formatHeaderDate } from "@/lib/format";
import { EventRow } from "@/components/EventRow";
import { EmptyState } from "@/components/EmptyState";
import { DateNav, type DateNavKey } from "@/components/DateNav";
import { PageHeader } from "@/components/PageHeader";
import { FilterBar } from "@/components/FilterBar";
import { CategoryStrip } from "@/components/CategoryStrip";

export async function DayView({
  date,
  active,
  path,
  filters,
  showCategoryStrip = false,
  showFeatured = false,
}: {
  date: string;
  active: DateNavKey;
  path: string;
  filters: EventFilters;
  showCategoryStrip?: boolean;
  showFeatured?: boolean;
}) {
  const [events, categories, locations, featured] = await Promise.all([
    getEventsForDate(date, filters),
    getCategories(),
    getLocations(),
    showFeatured ? getNextUpcomingEvent() : Promise.resolve(null),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12 sm:py-20">
      <PageHeader subtitle={formatHeaderDate(date)} featured={featured} />
      <DateNav active={active} />

      {showCategoryStrip && (
        <CategoryStrip
          categories={categories}
          activeSlug={filters.categorySlug}
        />
      )}

      <FilterBar
        categories={categories}
        locations={locations}
        action={path}
        selectedCategory={filters.categorySlug}
        selectedLocation={filters.locationSlug}
        showCategory={!showCategoryStrip}
      />

      {events.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ul>
      )}
    </main>
  );
}