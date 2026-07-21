const STATUS_OPTIONS = [
  { value: "published", label: "Objavljeno" },
  { value: "pending_review", label: "Na čekanju" },
  { value: "draft", label: "Nacrt" },
  { value: "rejected", label: "Odbijeno" },
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
  is_free?: boolean;
  is_family_friendly?: boolean;
  is_dog_friendly?: boolean;
  is_solo_friendly?: boolean;
  is_romantic?: boolean;
  is_hidden_gem?: boolean;
  is_admin_featured?: boolean;
  submitter_email?: string;
  submitter_phone?: string;
};

const SMART_TAG_FIELDS: { name: string; label: string }[] = [
  { name: "is_free", label: "Potpuno besplatno" },
  { name: "is_family_friendly", label: "Za obitelji s djecom" },
  { name: "is_dog_friendly", label: "Dog-friendly" },
  { name: "is_solo_friendly", label: "Idem solo" },
  { name: "is_romantic", label: "Romantični izlazak" },
];

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

      {defaultValues?.submitter_email && (
        <div className="border-gold/40 bg-gold/10 rounded-md border p-4 text-sm">
          <p className="text-gold font-medium">
            Prijavio posjetitelj putem javnog obrasca
          </p>
          <p className="text-parchment mt-1">
            {defaultValues.submitter_email}
            {defaultValues.submitter_phone && ` · ${defaultValues.submitter_phone}`}
          </p>
        </div>
      )}

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

      <div className="text-sm">
        <span className={labelClass}>Fotografija * (URL ili datoteka)</span>

        {defaultValues?.image_url && (
          <img
            src={defaultValues.image_url}
            alt=""
            className="border-line mb-2 h-20 w-20 rounded-md border object-cover"
          />
        )}

        <input
          type="url"
          name="image_url"
          placeholder="https://..."
          defaultValue={defaultValues?.image_url}
          className={inputClass}
        />

        <input
          type="file"
          name="image_file"
          accept="image/*"
          className={`${inputClass} mt-2`}
        />

        <span className="text-parchment-muted mt-1 block text-xs">
          Ako priložiš datoteku, ona ima prednost pred URL poljem.
        </span>
      </div>

      <fieldset className="border-line rounded-md border p-4">
        <legend className="text-parchment-muted px-1 text-sm">
          Pametni filtri
        </legend>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SMART_TAG_FIELDS.map((field) => (
            <label
              key={field.name}
              className="text-parchment flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                name={field.name}
                defaultChecked={
                  defaultValues?.[field.name as keyof EventFormValues] as
                    | boolean
                    | undefined
                }
              />
              {field.label}
            </label>
          ))}
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_hidden_gem"
            defaultChecked={defaultValues?.is_hidden_gem}
          />
          <span className="text-parchment">💎 Skriveni dragulj</span>
        </label>
        <p className="text-parchment-muted mt-1 text-xs">
          Označi samo za manje, intimne događaje u naselju ili lokalnom
          prostoru (ne glavni trg/dvorana grada), koje organizira mjesni
          odbor/udruga/OPG (ne grad/TZ), s okvirnim kapacitetom do ~150-200
          ljudi. Nikad zajedno s kategorijom &quot;Velike Manifestacije&quot;.
        </p>
      </fieldset>

      <fieldset className="border-line rounded-md border p-4">
        <legend className="text-parchment-muted px-1 text-sm">
          Panel &quot;U trendu&quot; (naslovna)
        </legend>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="is_admin_featured"
            defaultChecked={defaultValues?.is_admin_featured}
          />
          <span className="text-parchment">📌 Istakni kao TOP događaj</span>
        </label>
        <p className="text-parchment-muted mt-1 text-xs">
          Ovaj događaj dobiva prvo mjesto u panelu &quot;U trendu&quot; na
          naslovnoj, neovisno o algoritamskom rezultatu popularnosti. Samo
          jedan događaj može biti istaknut u isto vrijeme — označavanje
          ovog automatski uklanja oznaku s prethodno istaknutog događaja.
        </p>
      </fieldset>

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
