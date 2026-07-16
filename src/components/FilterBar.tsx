import type { FilterOption } from "@/lib/events";

export function FilterBar({
  categories,
  locations,
  action,
  selectedCategory,
  selectedLocation,
  showCategory = true,
}: {
  categories: FilterOption[];
  locations: FilterOption[];
  action: string;
  selectedCategory?: string;
  selectedLocation?: string;
  showCategory?: boolean;
}) {
  return (
    <form
      method="get"
      action={action}
      className={`border-line mb-8 flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-end ${showCategory ? "" : "sm:max-w-xs"}`}
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
        <span className="text-parchment-muted mb-1 block">Lokacija</span>
        <select
          name="lokacija"
          defaultValue={selectedLocation ?? ""}
          className="border-line bg-oak text-parchment w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Sve lokacije</option>
          {locations.map((location) => (
            <option key={location.slug} value={location.slug}>
              {location.name}
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
    </form>
  );
}