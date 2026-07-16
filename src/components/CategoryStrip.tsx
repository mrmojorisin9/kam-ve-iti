import Link from "next/link";
import type { FilterOption } from "@/lib/events";
import { CategoryIcon } from "@/components/CategoryIcon";

export function CategoryStrip({
  categories,
  activeSlug,
}: {
  categories: FilterOption[];
  activeSlug?: string;
}) {
  return (
    <nav aria-label="Kategorije" className="mb-8">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map((category) => {
          const isActive = category.slug === activeSlug;

          return (
            <li key={category.slug}>
              <Link
                href={`/?kategorija=${category.slug}`}
                aria-current={isActive ? "true" : undefined}
                className={`bg-oak focus-visible:outline-gold flex flex-col items-start gap-2 rounded-lg border p-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  isActive
                    ? "border-gold"
                    : "border-line hover:border-gold/60"
                }`}
              >
                <CategoryIcon slug={category.slug} className="text-gold h-6 w-6" />
                <span className="text-parchment text-sm font-medium">
                  {category.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
