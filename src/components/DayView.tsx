import {
  getEventsForDate,
  getCategories,
  type EventFilters,
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

export async function DayView({
  date,
  active,
  path,
  filters,
  showCategoryStrip = false,
}: {
  date: string;
  active: DateNavKey;
  path: string;
  filters: EventFilters;
  showCategoryStrip?: boolean;
}) {
  const [{ events, relaxedFrom }, categories] = await Promise.all([
    getEventsForDate(date, filters),
    getCategories(),
  ]);

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

      {events.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {relaxedFrom && <FallbackNotice relaxedFrom={relaxedFrom} />}
          <ul className="space-y-3">
            {events.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        </>
      )}
    </main>
  );
}