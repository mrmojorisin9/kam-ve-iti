import {
  getEventsForDate,
  getCategories,
  getLocations,
  type EventFilters,
} from "@/lib/events";
import { formatHeaderDate } from "@/lib/format";
import { EventRow } from "@/components/EventRow";
import { EmptyState } from "@/components/EmptyState";
import { DateNav, type DateNavKey } from "@/components/DateNav";
import { PageHeader } from "@/components/PageHeader";
import { FilterBar } from "@/components/FilterBar";

export async function DayView({
  date,
  active,
  path,
  filters,
}: {
  date: string;
  active: DateNavKey;
  path: string;
  filters: EventFilters;
}) {
  const [events, categories, locations] = await Promise.all([
    getEventsForDate(date, filters),
    getCategories(),
    getLocations(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12 sm:py-20">
      <PageHeader subtitle={formatHeaderDate(date)} />
      <DateNav active={active} />

      <FilterBar
        categories={categories}
        locations={locations}
        action={path}
        selectedCategory={filters.categorySlug}
        selectedLocation={filters.locationSlug}
      />

      {events.length === 0 ? (
        <EmptyState />
      ) : (
        <ul>
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ul>
      )}
    </main>
  );
}