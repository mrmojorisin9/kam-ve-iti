import Link from "next/link";
import { FeaturedEvent } from "@/components/FeaturedEvent";
import type { EventListItem } from "@/lib/events";

export function PageHeader({
  subtitle,
  featured,
}: {
  subtitle: string;
  featured?: EventListItem | null;
}) {
  return (
    <header className="border-line mb-10 rounded-xl border bg-[linear-gradient(135deg,var(--color-night)_0%,var(--color-oak)_100%)] p-6 sm:p-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div>
          <p className="text-parchment-muted font-mono text-xs tracking-[0.2em] uppercase">
            Međimurska županija
          </p>
          <h1 className="font-display text-parchment mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            <Link
              href="/"
              className="focus-visible:outline-gold rounded-sm transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              <span className="text-gold">K</span>am denes
            </Link>
          </h1>
          <p className="text-gold mt-3 font-mono text-sm capitalize">
            {subtitle}
          </p>
        </div>

        {featured && <FeaturedEvent event={featured} />}
      </div>
    </header>
  );
}