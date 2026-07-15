import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createEvent } from "./actions";

export const metadata: Metadata = {
  title: "Novi događaj — Kam ve iti admin",
};

const STATUS_OPTIONS = [
  { value: "published", label: "Objavljeno" },
  { value: "pending_review", label: "Na čekanju" },
  { value: "draft", label: "Nacrt" },
];

const inputClass =
  "border-line bg-oak text-parchment w-full rounded-md border px-3 py-2 text-sm";
const labelClass = "text-parchment-muted mb-1 block";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const [{ data: categories }, { data: locations }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .order("sort_order", { ascending: true }),
    supabase.from("locations").select("id, name").order("name"),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
      <h1 className="font-display text-parchment text-3xl font-semibold tracking-tight">
        Novi događaj
      </h1>

      <form action={createEvent} className="mt-8 flex flex-col gap-4">
        <label className="text-sm">
          <span className={labelClass}>Naziv *</span>
          <input type="text" name="title" required className={inputClass} />
        </label>

        <label className="text-sm">
          <span className={labelClass}>Opis</span>
          <textarea name="description" rows={4} className={inputClass} />
        </label>

        <div className="flex flex-col gap-4 sm:flex-row">
          <label className="flex-1 text-sm">
            <span className={labelClass}>Kategorija *</span>
            <select name="category_id" required className={inputClass}>
              <option value="">Odaberi</option>
              {(categories ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex-1 text-sm">
            <span className={labelClass}>Lokacija *</span>
            <select name="location_id" required className={inputClass}>
              <option value="">Odaberi</option>
              {(locations ?? []).map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="text-sm">
          <span className={labelClass}>Mjesto održavanja (dvorana, adresa...)</span>
          <input type="text" name="venue_name" className={inputClass} />
        </label>

        <div className="flex flex-col gap-4 sm:flex-row">
          <label className="flex-1 text-sm">
            <span className={labelClass}>Početak *</span>
            <input
              type="datetime-local"
              name="start_at"
              required
              className={inputClass}
            />
          </label>

          <label className="flex-1 text-sm">
            <span className={labelClass}>Kraj</span>
            <input type="datetime-local" name="end_at" className={inputClass} />
          </label>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <label className="flex-1 text-sm">
            <span className={labelClass}>Organizator</span>
            <input type="text" name="organizer_name" className={inputClass} />
          </label>

          <label className="flex-1 text-sm">
            <span className={labelClass}>Kontakt organizatora</span>
            <input type="text" name="organizer_contact" className={inputClass} />
          </label>
        </div>

        <label className="text-sm">
          <span className={labelClass}>Izvorni URL</span>
          <input type="url" name="source_url" className={inputClass} />
        </label>

        <label className="text-sm">
          <span className={labelClass}>URL slike</span>
          <input type="url" name="image_url" className={inputClass} />
        </label>

        <label className="text-sm">
          <span className={labelClass}>Status</span>
          <select name="status" defaultValue="published" className={inputClass}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {error && (
          <p className="text-wine text-sm" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="border-gold text-gold hover:bg-gold hover:text-night focus-visible:outline-gold mt-2 self-start rounded-md border px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Spremi događaj
        </button>
      </form>
    </main>
  );
}
