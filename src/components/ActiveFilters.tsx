import Link from "next/link";
import {
  SMART_TAG_DEFS,
  filtersToParams,
  type EventFilters,
  type FilterOption,
} from "@/lib/events";
import { REGIONS } from "@/lib/regions";

function hrefWithout(
  basePath: string,
  filters: EventFilters,
  omit: keyof EventFilters,
): string {
  const remaining = filtersToParams({ ...filters, [omit]: undefined });
  const query = new URLSearchParams(remaining).toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function ActiveFilters({
  basePath,
  filters,
  categories,
}: {
  basePath: string;
  filters: EventFilters;
  categories: FilterOption[];
}) {
  const chips: { key: keyof EventFilters; label: string }[] = [];

  if (filters.categorySlug) {
    const name = categories.find((c) => c.slug === filters.categorySlug)?.name;
    if (name) chips.push({ key: "categorySlug", label: name });
  }
  if (filters.regionSlug) {
    const name = REGIONS.find((r) => r.slug === filters.regionSlug)?.name;
    if (name) chips.push({ key: "regionSlug", label: name });
  }
  for (const tag of SMART_TAG_DEFS) {
    if (filters[tag.key]) chips.push({ key: tag.key, label: tag.label });
  }

  if (chips.length === 0) return null;

  return (
    <div
      aria-label="Aktivni filtri"
      className="mb-8 flex flex-wrap items-center gap-2"
    >
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={hrefWithout(basePath, filters, chip.key)}
          className="border-line bg-oak text-parchment hover:border-gold/60 focus-visible:outline-gold flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {chip.label}
          <span aria-hidden="true">✕</span>
        </Link>
      ))}

      <Link
        href={basePath}
        className="text-parchment-muted hover:text-gold focus-visible:outline-gold text-sm underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Obriši sve
      </Link>
    </div>
  );
}
