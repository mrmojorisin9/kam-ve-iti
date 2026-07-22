import Link from "next/link";
import type { FilterOption } from "@/lib/events";
import { CategoryIcon } from "@/components/CategoryIcon";

const PILL_BASE =
  "focus-visible:outline-gold flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-medium shadow-sm shadow-black/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2";
const PILL_ACTIVE = "border-gold bg-gold/10 text-gold";
const PILL_INACTIVE = "border-line bg-oak text-parchment hover:border-gold/60";

/** Zadržava postojeći ?regija= filter kad se mijenja kategorija (Razina 1 + 2 kombiniraju se). */
function buildHref(categorySlug: string | undefined, selectedRegion?: string) {
  const params = new URLSearchParams();
  if (categorySlug) params.set("kategorija", categorySlug);
  if (selectedRegion) params.set("regija", selectedRegion);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function CategoryStrip({
  categories,
  activeSlug,
  selectedRegion,
}: {
  categories: FilterOption[];
  activeSlug?: string;
  selectedRegion?: string;
}) {
  return (
    <nav
      aria-label="Kategorije"
      className="scrollbar-subtle -mx-6 mb-6 overflow-x-auto px-6 pb-2"
    >
      <ul className="flex w-max gap-2">
        <li>
          <Link
            href={buildHref(undefined, selectedRegion)}
            aria-current={!activeSlug ? "true" : undefined}
            className={`${PILL_BASE} ${!activeSlug ? PILL_ACTIVE : PILL_INACTIVE}`}
          >
            Sve
          </Link>
        </li>
        {categories.map((category) => {
          const isActive = category.slug === activeSlug;

          return (
            <li key={category.slug}>
              <Link
                href={buildHref(category.slug, selectedRegion)}
                aria-current={isActive ? "true" : undefined}
                className={`${PILL_BASE} ${isActive ? PILL_ACTIVE : PILL_INACTIVE}`}
              >
                <CategoryIcon slug={category.slug} className="text-gold h-4 w-4" />
                {category.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
