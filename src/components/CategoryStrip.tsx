import Link from "next/link";
import type { FilterOption } from "@/lib/events";
import { CategoryIcon } from "@/components/CategoryIcon";

/**
 * Kraći nazivi za prikaz na kartici (jednake veličine kartica zahtijevaju
 * predvidljivu, kratku duljinu teksta) — pun naziv kategorije i dalje se
 * koristi u FilterBar dropdownu, kategorija-chipu i na stranici događaja.
 */
const CARD_LABELS: Record<string, string> = {
  "glazba-i-koncerti": "Glazba",
  "sport-i-rekreacija": "Sport",
  "manifestacije-i-feste": "Manifestacije",
  "obitelj-i-djeca": "Obitelj",
  "edukacija-i-radionice": "Edukacija",
  "gastronomija-i-vino": "Gastronomija",
};

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
          const label = CARD_LABELS[category.slug] ?? category.name;

          return (
            <li key={category.slug}>
              <Link
                href={`/?kategorija=${category.slug}`}
                aria-current={isActive ? "true" : undefined}
                className={`bg-oak focus-visible:outline-gold flex h-[68px] flex-col items-start justify-center gap-1 rounded-lg border p-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  isActive
                    ? "border-gold"
                    : "border-line hover:border-gold/60"
                }`}
              >
                <CategoryIcon slug={category.slug} className="text-gold h-3.5 w-3.5" />
                <span className="text-parchment truncate text-xs font-medium">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
