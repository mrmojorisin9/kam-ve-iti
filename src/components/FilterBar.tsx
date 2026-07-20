import { SMART_TAG_DEFS, type EventFilters, type FilterOption } from "@/lib/events";

const chipInputClass = "peer sr-only";
const chipLabelClass =
  "border-line bg-oak text-parchment peer-checked:border-gold peer-checked:bg-gold/10 peer-checked:text-gold peer-focus-visible:outline-gold flex cursor-pointer items-center justify-center rounded-full border px-3 py-2 text-center text-sm transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2";

function countActiveSmartFilters(smartFilters?: EventFilters): number {
  if (!smartFilters) return 0;
  return SMART_TAG_DEFS.filter((tag) => smartFilters[tag.key]).length;
}

export function FilterBar({
  categories,
  regions,
  action,
  selectedCategory,
  selectedRegion,
  smartFilters,
  showCategory = true,
}: {
  categories: FilterOption[];
  regions: FilterOption[];
  action: string;
  selectedCategory?: string;
  selectedRegion?: string;
  smartFilters?: EventFilters;
  showCategory?: boolean;
}) {
  const activeCount = countActiveSmartFilters(smartFilters);

  return (
    <form method="get" action={action} className="border-line mb-8 border-b pb-6">
      <div
        className={`flex flex-col gap-3 sm:flex-row sm:items-end ${showCategory ? "" : "sm:max-w-xs"}`}
      >
        {showCategory ? (
          <label className="flex-1 text-sm">
            <span className="text-parchment-muted mb-1 block">Kategorija</span>
            <select
              name="kategorija"
              defaultValue={selectedCategory ?? ""}
              className="border-line bg-oak text-parchment w-full rounded-md border px-3 py-2 text-sm"
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
            className="border-line bg-oak text-parchment w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Cijelo Međimurje</option>
            {regions.map((region) => (
              <option key={region.slug} value={region.slug}>
                {region.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="border-gold text-gold hover:bg-gold hover:text-night focus-visible:outline-gold rounded-md border px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Primijeni
        </button>
      </div>

      <details className="mt-4" open={activeCount > 0}>
        <summary className="border-line bg-oak text-parchment focus-visible:outline-gold inline-flex w-max cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2">
          🎚 Još filtara
          {activeCount > 0 && (
            <span className="bg-gold text-night flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold">
              {activeCount}
            </span>
          )}
        </summary>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {SMART_TAG_DEFS.map((tag) => (
            <label key={tag.param}>
              <input
                type="checkbox"
                name={tag.param}
                defaultChecked={smartFilters?.[tag.key]}
                className={chipInputClass}
              />
              <span className={chipLabelClass}>{tag.label}</span>
            </label>
          ))}
        </div>
      </details>
    </form>
  );
}
