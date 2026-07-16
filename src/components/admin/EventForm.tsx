const STATUS_OPTIONS = [
  { value: "published", label: "Objavljeno" },
  { value: "pending_review", label: "Na čekanju" },
  { value: "draft", label: "Nacrt" },
];

const inputClass =
  "border-line bg-oak text-parchment w-full rounded-md border px-3 py-2 text-sm";
const labelClass = "text-parchment-muted mb-1 block";

export type EventFormValues = {
  title?: string;
  description?: string;
  category_id?: string;
  location_id?: string;
  venue_name?: string;
  start_at?: string;
  end_at?: string;
  organizer_name?: string;
  organizer_contact?: string;
  source_url?: string;
  image_url?: string;
  status?: string;
};

export function EventForm({
  categories,
  locations,
  action,
  error,
  submitLabel,
  defaultValues,
  eventId,
}: {
  categories: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  submitLabel: string;
  defaultValues?: EventFormValues;
  eventId?: string;
}) {
  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      {eventId && <input type="hidden" name="id" value={eventId} />}

      <label className="text-sm">
        <span className={labelClass}>Naziv *</span>
        <input
          type="text"
          name="title"
          required
          defaultValue={defaultValues?.title}
          className={inputClass}
        />
      </label>

      <label className="text-sm">
        <span className={labelClass}>Opis</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={defaultValues?.description}
          className={inputClass}
        />
      </label>

      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="flex-1 text-sm">
          <span className={labelClass}>Kategorija *</span>
          <select
            name="category_id"
            required
            defaultValue={defaultValues?.category_id ?? ""}
            className={inputClass}
          >
            <option value="">Odaberi</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex-1 text-sm">
          <span className={labelClass}>Lokacija *</span>
          <select
            name="location_id"
            required
            defaultValue={defaultValues?.location_id ?? ""}
            className={inputClass}
          >
            <option value="">Odaberi</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="text-sm">
        <span className={labelClass}>Mjesto održavanja (dvorana, adresa...)</span>
        <input
          type="text"
          name="venue_name"
          defaultValue={defaultValues?.venue_name}
          className={inputClass}
        />
      </label>

      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="flex-1 text-sm">
          <span className={labelClass}>Početak *</span>
          <input
            type="datetime-local"
            name="start_at"
            required
            defaultValue={defaultValues?.start_at}
            className={inputClass}
          />
        </label>

        <label className="flex-1 text-sm">
          <span className={labelClass}>Kraj</span>
          <input
            type="datetime-local"
            name="end_at"
            defaultValue={defaultValues?.end_at}
            className={inputClass}
          />
        </label>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="flex-1 text-sm">
          <span className={labelClass}>Organizator</span>
          <input
            type="text"
            name="organizer_name"
            defaultValue={defaultValues?.organizer_name}
            className={inputClass}
          />
        </label>

        <label className="flex-1 text-sm">
          <span className={labelClass}>Kontakt organizatora</span>
          <input
            type="text"
            name="organizer_contact"
            defaultValue={defaultValues?.organizer_contact}
            className={inputClass}
          />
        </label>
      </div>

      <label className="text-sm">
        <span className={labelClass}>Izvorni URL</span>
        <input
          type="url"
          name="source_url"
          defaultValue={defaultValues?.source_url}
          className={inputClass}
        />
      </label>

      <label className="text-sm">
        <span className={labelClass}>URL slike *</span>
        <input
          type="url"
          name="image_url"
          required
          defaultValue={defaultValues?.image_url}
          className={inputClass}
        />
      </label>

      <label className="text-sm">
        <span className={labelClass}>Status</span>
        <select
          name="status"
          defaultValue={defaultValues?.status ?? "published"}
          className={inputClass}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {error && (
        <p className="text-wine-light text-sm" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="border-gold text-gold hover:bg-gold hover:text-night focus-visible:outline-gold mt-2 self-start rounded-md border px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {submitLabel}
      </button>
    </form>
  );
}
