"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import type { EventFormActionResult } from "@/lib/admin-events";

const STATUS_OPTIONS = [
  { value: "published", label: "Objavljeno" },
  { value: "pending_review", label: "Na čekanju" },
  { value: "draft", label: "Nacrt" },
  { value: "rejected", label: "Odbijeno" },
];

const inputBase =
  "bg-oak text-parchment w-full rounded-md border px-3 py-2 text-sm";
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
  performer?: string;
  price_eur?: string;
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
  sponsored_until?: string;
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
  beforeFields,
}: {
  categories: { id: string; name: string }[];
  locations: { id: string; name: string }[];
  action: (
    prevState: EventFormActionResult,
    formData: FormData,
  ) => Promise<EventFormActionResult>;
  /** Početna greška (npr. iz query stringa); nakon spremanja vrijedi `state.error`. */
  error?: string;
  submitLabel: string;
  defaultValues?: EventFormValues;
  eventId?: string;
  beforeFields?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState<
    EventFormActionResult,
    FormData
  >(action, { error: null });
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  // Stanje za koje je korisnik već počeo ispravljati označeno polje.
  const [dismissedState, setDismissedState] =
    useState<EventFormActionResult | null>(null);

  const invalidField =
    state.error && state.field && dismissedState !== state ? state.field : null;

  // Zahtjev 2026-11-05: ako obavezno polje nije uredno popunjeno, forma se NE
  // briše — samo se fokusira/označi problematično polje. Zato se akcija ne
  // veže na `<form action>` (React bi nakon nje resetirao sva polja) nego se
  // poziva ručno iz onSubmit, pa DOM zadržava sve unose (i odabranu datoteku).
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  useEffect(() => {
    if (!state.error) return;
    const field = state.field
      ? formRef.current?.elements.namedItem(state.field)
      : null;
    const target =
      field instanceof RadioNodeList ? field[0] : (field as HTMLElement | null);
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ block: "center", behavior: "smooth" });
      target.focus({ preventScroll: true });
    } else {
      errorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [state]);

  function fieldClass(name: string): string {
    return `${inputBase} ${invalidField === name ? "border-wine-light ring-wine-light ring-1" : "border-line"}`;
  }
  const inputClass = `${inputBase} border-line`;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onInput={(event) => {
        const name = (event.target as HTMLInputElement).name;
        if (invalidField && name === invalidField) setDismissedState(state);
      }}
      className="mt-8 flex flex-col gap-4"
    >
      {eventId && <input type="hidden" name="id" value={eventId} />}

      {beforeFields}

      {defaultValues?.submitter_email && (
        <div className="border-gold/40 bg-gold/10 rounded-md border p-4 text-sm">
          <p className="text-gold font-medium">
            Prijavio posjetitelj putem javnog obrasca
          </p>
          <p className="text-parchment mt-1">
            {defaultValues.submitter_email}
            {defaultValues.submitter_phone &&
              ` · ${defaultValues.submitter_phone}`}
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
          className={fieldClass("title")}
          aria-invalid={invalidField === "title"}
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
            className={fieldClass("category_id")}
            aria-invalid={invalidField === "category_id"}
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
            className={fieldClass("location_id")}
            aria-invalid={invalidField === "location_id"}
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
        <span className={labelClass}>
          Mjesto održavanja (dvorana, adresa...)
        </span>
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
            className={fieldClass("start_at")}
            aria-invalid={invalidField === "start_at"}
          />
        </label>

        <label className="flex-1 text-sm">
          <span className={labelClass}>Kraj</span>
          <input
            type="datetime-local"
            name="end_at"
            defaultValue={defaultValues?.end_at}
            className={fieldClass("end_at")}
            aria-invalid={invalidField === "end_at"}
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

      {/* Cijena + izvođač (0039) — prikazuju se na stranici događaja i
          šalju Googleu kao offers/performer (GSC preporučena polja). */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="flex-1 text-sm">
          <span className={labelClass}>Izvođač</span>
          <input
            type="text"
            name="performer"
            defaultValue={defaultValues?.performer}
            placeholder="npr. ime benda, glumca, predavača"
            className={inputClass}
          />
        </label>

        <label className="text-sm sm:w-48">
          <span className={labelClass}>Cijena ulaznice od (€)</span>
          <input
            type="number"
            name="price_eur"
            min="0"
            step="0.01"
            defaultValue={defaultValues?.price_eur}
            placeholder="prazno = nepoznato"
            className={fieldClass("price_eur")}
            aria-invalid={invalidField === "price_eur"}
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
          className={fieldClass("image_url")}
          aria-invalid={invalidField === "image_url"}
        />

        <input
          type="file"
          name="image_file"
          accept="image/*"
          className={`${fieldClass("image_file")} mt-2`}
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
                    boolean | undefined
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
          Označi samo za manje, intimne događaje u naselju ili lokalnom prostoru
          (ne glavni trg/dvorana grada), koje organizira mjesni odbor/udruga/OPG
          (ne grad/TZ), s okvirnim kapacitetom do ~150-200 ljudi. Nikad zajedno
          s kategorijom &quot;Velike Manifestacije&quot;.
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
          naslovnoj, neovisno o algoritamskom rezultatu popularnosti. Samo jedan
          događaj može biti istaknut u isto vrijeme — označavanje ovog
          automatski uklanja oznaku s prethodno istaknutog događaja.
        </p>
      </fieldset>

      <fieldset className="border-line rounded-md border p-4">
        <legend className="text-parchment-muted px-1 text-sm">
          Sponzorstvo
        </legend>

        <label className="text-sm">
          <span className={labelClass}>Sponzorirano do</span>
          <input
            type="datetime-local"
            name="sponsored_until"
            defaultValue={defaultValues?.sponsored_until}
            className={inputClass}
          />
        </label>
        <p className="text-parchment-muted mt-1 text-xs">
          Prazno = nije sponzorirano. Postavi budući datum/vrijeme da događaj
          dobije oznaku &quot;📢 Sponzorirano&quot; i mjesto u zasebnom panelu
          na naslovnoj — automatski prestaje po isteku, bez potrebe da ga ručno
          isključiš. Više događaja može biti sponzorirano istovremeno (za
          razliku od panela &quot;U trendu&quot; iznad).
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

      {(state.error ?? error) && (
        <p ref={errorRef} className="text-wine-light text-sm" role="alert">
          {state.error ?? error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="border-gold text-gold hover:bg-gold hover:text-night focus-visible:outline-gold mt-2 self-start rounded-md border px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
      >
        {pending ? "Spremam..." : submitLabel}
      </button>
    </form>
  );
}
