import { SMART_TAG_DEFS, type EventFilters, type FilterOption } from "@/lib/events";

const FORM_ID = "filter-bar-form";
const MOBILE_TOGGLE_ID = "filter-bar-mobile-toggle";

const chipInputClass = "peer sr-only";
const chipLabelClass =
  "border-line bg-oak text-parchment shadow-sm shadow-black/10 peer-checked:border-gold peer-checked:bg-gold/10 peer-checked:text-gold peer-focus-visible:outline-gold flex cursor-pointer items-center justify-center rounded-full border px-3.5 py-2.5 text-center text-sm transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2";

function countActiveSmartFilters(smartFilters?: EventFilters): number {
  if (!smartFilters) return 0;
  return SMART_TAG_DEFS.filter((tag) => smartFilters[tag.key]).length;
}

/**
 * Mobitel (korisnikov zahtjev, 2026-10-12 — "korisnik prvo skrola događaje,
 * tek kasnije uključuje filtere"): cijeli filter blok (kategorija/regija,
 * "Još filtara", Sortiraj, Primijeni) skriven je iza JEDNOG gumba
 * "🎚 Filteri" u retku s pretragom, da prvi događaj stane na početni ekran.
 * CSS-only prekidač (skriveni checkbox + `peer-checked:`), bez klijentskog
 * JS-a — isti duh kao postojeći <details>/`peer-open:` obrazac niže.
 * Automatski otvoren kad je neki od skrivenih filtera aktivan. Desktop
 * (sm+) nepromijenjen: panel je uvijek vidljiv, mobilni redak skriven.
 */
export function FilterBar({
  categories,
  regions,
  action,
  selectedCategory,
  selectedRegion,
  smartFilters,
  showCategory = true,
  mobileSort,
}: {
  categories: FilterOption[];
  regions: FilterOption[];
  action: string;
  selectedCategory?: string;
  selectedRegion?: string;
  smartFilters?: EventFilters;
  showCategory?: boolean;
  /** SortToggle za mobilni panel (na desktopu se prikazuje izvan FilterBar-a). */
  mobileSort?: React.ReactNode;
}) {
  const activeCount = countActiveSmartFilters(smartFilters);
  // Broj filtera skrivenih u mobilnom panelu (kategorija se broji samo kad
  // je dropdown u panelu, ne kad je vidljiva traka kategorija).
  const hiddenActiveCount =
    activeCount +
    (selectedRegion ? 1 : 0) +
    (showCategory && selectedCategory ? 1 : 0);

  return (
    <div className="border-line mb-5 border-b pb-4 sm:mb-8 sm:pb-6">
      <input
        type="checkbox"
        id={MOBILE_TOGGLE_ID}
        defaultChecked={hiddenActiveCount > 0}
        className="peer sr-only"
        aria-label="Prikaži filtere"
      />

      {/* Mobilni redak: gumb Filteri + pretraga (pretraga je zaseban <form>,
          forme se ne mogu ugnježđivati). */}
      <div className="flex items-center gap-2 sm:hidden">
        <label
          htmlFor={MOBILE_TOGGLE_ID}
          className="border-line bg-oak text-parchment inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-sm shadow-black/10"
        >
          🎚 Filteri
          {hiddenActiveCount > 0 && (
            <span className="bg-gold text-night flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold">
              {hiddenActiveCount}
            </span>
          )}
        </label>

        <form
          method="get"
          action="/pretraga"
          role="search"
          className="border-line bg-oak focus-within:border-gold/60 flex min-w-0 flex-1 items-center gap-1 rounded-full border py-1.5 pr-1.5 pl-4 shadow-sm shadow-black/10 transition-colors"
        >
          <input
            type="search"
            name="q"
            placeholder="Pretraži događaje…"
            aria-label="Pretraži događaje"
            className="text-parchment placeholder:text-parchment-muted min-w-0 flex-1 bg-transparent py-1 text-sm focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Pretraži"
            className="bg-gold text-night hover:bg-gold/90 focus-visible:outline-gold flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <span aria-hidden="true">🔍</span>
          </button>
        </form>
      </div>

      <div className="mt-4 hidden peer-checked:block sm:mt-0 sm:block">
        <form id={FORM_ID} method="get" action={action}>
          <div
            className={`flex flex-col gap-3 sm:flex-row sm:items-end ${showCategory ? "" : "sm:max-w-xs"}`}
          >
            {showCategory ? (
              <label className="flex-1 text-sm">
                <span className="text-parchment-muted mb-1 block">Kategorija</span>
                <select
                  name="kategorija"
                  defaultValue={selectedCategory ?? ""}
                  className="border-line bg-oak text-parchment focus-visible:outline-gold w-full rounded-md border px-3.5 py-2.5 text-sm shadow-sm shadow-black/10 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <option value="">Sve kategorije</option>
                  {categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              selectedCategory && (
                <input type="hidden" name="kategorija" value={selectedCategory} />
              )
            )}

            <label className="flex-1 text-sm">
              <span className="text-parchment-muted mb-1 block">Regija</span>
              <select
                name="regija"
                defaultValue={selectedRegion ?? ""}
                className="border-line bg-oak text-parchment focus-visible:outline-gold w-full rounded-md border px-3.5 py-2.5 text-sm shadow-sm shadow-black/10 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <option value="">Cijelo Međimurje</option>
                {regions.map((region) => (
                  <option key={region.slug} value={region.slug}>
                    {region.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Desktop "Primijeni" — mobitel dobiva vlastiti gumb niže, ispod
                "Još filtara" retka (korisnikov zahtjev). */}
            <button
              type="submit"
              className="border-gold text-gold hover:bg-gold hover:text-night focus-visible:outline-gold hidden rounded-md border px-5 py-2.5 text-sm font-medium shadow-sm shadow-black/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:block"
            >
              Primijeni
            </button>
          </div>
        </form>

        {/*
          "Još filtara": checkboxovi i mobilni "Primijeni" žive izvan gornje
          forme i s njom se povezuju preko HTML `form` atributa. `peer`/
          `peer-open:` (umjesto ugnježđenja panela unutar <details>) drži
          panel s checkboxovima preko cijele širine retka.
        */}
        <div className="mt-4 flex flex-wrap items-start gap-2">
          <details className="peer shrink-0" open={activeCount > 0}>
            <summary className="border-line bg-oak text-parchment focus-visible:outline-gold inline-flex w-max cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-sm shadow-black/10 focus-visible:outline-2 focus-visible:outline-offset-2">
              🎚 Još filtara
              {activeCount > 0 && (
                <span className="bg-gold text-night flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold">
                  {activeCount}
                </span>
              )}
            </summary>
          </details>

          <div className="peer-open:grid hidden w-full basis-full grid-cols-2 gap-2">
            {SMART_TAG_DEFS.map((tag) => (
              <label key={tag.param}>
                <input
                  type="checkbox"
                  form={FORM_ID}
                  name={tag.param}
                  defaultChecked={smartFilters?.[tag.key]}
                  className={chipInputClass}
                />
                <span className={chipLabelClass}>{tag.label}</span>
              </label>
            ))}
          </div>

          {mobileSort && <div className="basis-full sm:hidden">{mobileSort}</div>}

          <button
            type="submit"
            form={FORM_ID}
            className="border-gold text-gold hover:bg-gold hover:text-night focus-visible:outline-gold w-full basis-full rounded-md border px-5 py-2.5 text-sm font-medium shadow-sm shadow-black/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:hidden"
          >
            Primijeni
          </button>
        </div>
      </div>
    </div>
  );
}
