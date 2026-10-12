import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createCaptcha } from "@/lib/captcha";
import { submitEvent } from "./actions";

export const metadata: Metadata = {
  title: "Prijavi događaj — Kam denes",
  description:
    "Predloži događaj za objavu na Kam denes. Prijedlog pregledava administrator prije objave.",
};

const inputClass =
  "border-line bg-oak text-parchment w-full rounded-md border px-3 py-2 text-sm";
const labelClass = "text-parchment-muted mb-1 block";

export default async function ProposeEventPage({
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

  const captcha = createCaptcha();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12 md:max-w-3xl">
      <p className="text-parchment-muted font-mono text-xs tracking-[0.2em] uppercase">
        <Link href="/" className="hover:text-parchment">
          Kam denes
        </Link>
      </p>
      <h1 className="font-display text-parchment mt-2 text-3xl font-semibold tracking-tight">
        Prijavi događaj
      </h1>

      <p className="text-parchment-muted mt-2 text-sm">
        Predloži događaj za objavu na portalu. Prijedlog prije objave
        pregledava administrator — javit ćemo se na uneseni e-mail samo ako
        bude potrebno provjeriti podatke.
      </p>

      <form action={submitEvent} className="mt-8 flex flex-col gap-4">
        <label className="text-sm">
          <span className={labelClass}>Naziv *</span>
          <input type="text" name="title" required className={inputClass} />
        </label>

        <div className="flex flex-col gap-4 sm:flex-row">
          <label className="flex-1 text-sm">
            <span className={labelClass}>Kategorija *</span>
            <select
              name="category_id"
              required
              defaultValue=""
              className={inputClass}
            >
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
            <select
              name="location_id"
              required
              defaultValue=""
              className={inputClass}
            >
              <option value="">Odaberi</option>
              {(locations ?? []).map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
        </div>

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

        <label className="text-sm">
          <span className={labelClass}>Opis</span>
          <textarea name="description" rows={4} className={inputClass} />
        </label>

        <label className="text-sm">
          <span className={labelClass}>
            Mjesto održavanja (dvorana, adresa...)
          </span>
          <input type="text" name="venue_name" className={inputClass} />
        </label>

        <label className="text-sm">
          <span className={labelClass}>
            Link na događaj (Facebook event, stranica organizatora...)
          </span>
          <input
            type="url"
            name="event_url"
            placeholder="https://..."
            className={inputClass}
          />
        </label>

        <label className="text-sm">
          <span className={labelClass}>URL fotografije</span>
          <input
            type="url"
            name="image_url"
            placeholder="https://..."
            className={inputClass}
          />
        </label>

        <div className="flex flex-col gap-4 sm:flex-row">
          <label className="flex-1 text-sm">
            <span className={labelClass}>Tvoj e-mail *</span>
            <input
              type="email"
              name="submitter_email"
              required
              className={inputClass}
            />
          </label>

          <label className="flex-1 text-sm">
            <span className={labelClass}>Tvoj telefon</span>
            <input type="tel" name="submitter_phone" className={inputClass} />
          </label>
        </div>

        {/* Honeypot — skriveno od ljudi (izvan ekrana, ne display:none, jer
            neki botovi preskaču nevidljiva polja), botovi ga popune. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Web stranica
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <fieldset className="border-line rounded-md border p-4">
          <legend className="text-parchment-muted px-1 text-sm">
            Provjera da nisi robot
          </legend>
          <label className="text-sm">
            <span className={labelClass}>
              Koliko je {captcha.question}? *
            </span>
            <input type="hidden" name="captcha_token" value={captcha.token} />
            <input
              type="number"
              name="captcha_answer"
              required
              className={`${inputClass} max-w-[8rem]`}
            />
          </label>
        </fieldset>

        {error && (
          <p className="text-wine-light text-sm" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="border-gold text-gold hover:bg-gold hover:text-night focus-visible:outline-gold mt-2 self-start rounded-md border px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Pošalji prijedlog
        </button>
      </form>
    </main>
  );
}
