import Link from "next/link";
import { filtersToParams, type EventFilters, type SortOrder } from "@/lib/events";

const PILL_BASE =
  "focus-visible:outline-gold inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2";
const PILL_ACTIVE = "border-gold bg-gold/10 text-gold";
const PILL_INACTIVE = "border-line bg-oak text-parchment hover:border-gold/60";

function hrefFor(
  basePath: string,
  filters: EventFilters,
  sortBy: SortOrder,
): string {
  const params = filtersToParams(filters);
  if (sortBy === "popularity") params.poredaj = "popularnost";
  const query = new URLSearchParams(params).toString();
  return query ? `${basePath}?${query}` : basePath;
}

/**
 * Opcionalni prekidač redoslijeda prikaza — zadano ostaje kronološko
 * (`start_at`), "Popularnost" je korisnikova eksplicitna alternativa, nikad
 * zadano stanje (ADR-014 duh: kronološke liste ostaju "što je na rasporedu"
 * alat). Za razliku od trending panela (Faza 8 Dan 43, samo ručni admin
 * izbor), ovo je korisnikom eksplicitno odabran, ne portalu nametnut prikaz.
 */
export function SortToggle({
  basePath,
  filters,
  sortBy,
}: {
  basePath: string;
  filters: EventFilters;
  sortBy?: SortOrder;
}) {
  return (
    <div className="mb-6 flex items-center gap-2 text-sm">
      <span className="text-parchment-muted">Sortiraj:</span>
      <Link
        href={hrefFor(basePath, filters, undefined)}
        aria-current={!sortBy ? "true" : undefined}
        className={`${PILL_BASE} ${!sortBy ? PILL_ACTIVE : PILL_INACTIVE}`}
      >
        🕐 Vrijeme
      </Link>
      <Link
        href={hrefFor(basePath, filters, "popularity")}
        aria-current={sortBy === "popularity" ? "true" : undefined}
        className={`${PILL_BASE} ${sortBy === "popularity" ? PILL_ACTIVE : PILL_INACTIVE}`}
      >
        🔥 Popularnost
      </Link>
    </div>
  );
}
