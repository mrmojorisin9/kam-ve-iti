import type { Metadata } from "next";
import { importCsv } from "./actions";

export const metadata: Metadata = {
  title: "CSV uvoz — Kam denes admin",
};

const EXAMPLE_CSV = `title,category_slug,location_slug,start_at,image_url,venue_name
Vinska cesta - degustacija,gastronomija-i-vino,strigova,2026-09-12T17:00,https://primjer.hr/slika.jpg,Podrum Strigova`;

export default async function ImportCsvPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    imported?: string;
    total?: string;
    errors?: string;
    moreErrors?: string;
  }>;
}) {
  const { error, imported, total, errors, moreErrors } = await searchParams;
  const errorList = errors ? errors.split("|") : [];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
      <h1 className="font-display text-parchment text-3xl font-semibold tracking-tight">
        CSV uvoz
      </h1>

      <div className="border-line text-parchment-muted mt-6 rounded-md border p-4 text-sm">
        <p>
          Obavezni stupci:{" "}
          <code className="text-parchment">
            title, category_slug, location_slug, start_at, image_url
          </code>
          .
        </p>
        <p className="mt-2">
          Opcionalni stupci:{" "}
          <code className="text-parchment">
            description, venue_name, end_at, organizer_name,
            organizer_contact, source_url, status
          </code>{" "}
          (status: draft / pending_review / published, zadano published).
        </p>
        <p className="mt-2">
          Datum i vrijeme u formatu{" "}
          <code className="text-parchment">GGGG-MM-DDTSS:mm</code> (lokalno
          Europe/Zagreb vrijeme, npr.{" "}
          <code className="text-parchment">2026-09-12T17:00</code>).
        </p>
        <p className="mt-2">
          Kategorije i lokacije se navode preko sluga (vidi{" "}
          <code className="text-parchment">supabase/seed.sql</code>), ne
          punog naziva.
        </p>
        <p className="mt-2">
          Podržan je i CSV s <code className="text-parchment">;</code> kao
          razdjelnikom (Excel s hrvatskim regionalnim postavkama).
        </p>
        <pre className="border-line bg-oak text-parchment mt-3 overflow-x-auto rounded-md border p-3 text-xs">
          {EXAMPLE_CSV}
        </pre>
      </div>

      {imported !== undefined && (
        <div className="border-gold mt-6 rounded-md border px-4 py-3 text-sm">
          <p className="text-gold">
            Uvezeno {imported} / {total} redaka.
          </p>
          {errorList.length > 0 && (
            <ul className="text-parchment-muted mt-2 list-inside list-disc">
              {errorList.map((message) => (
                <li key={message}>{message}</li>
              ))}
              {moreErrors && <li>+ još {moreErrors} grešaka</li>}
            </ul>
          )}
        </div>
      )}

      <form action={importCsv} className="mt-8 flex flex-col gap-4">
        <label className="text-sm">
          <span className="text-parchment-muted mb-1 block">
            CSV datoteka
          </span>
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className="border-line bg-oak text-parchment w-full rounded-md border px-3 py-2 text-sm"
          />
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
          Uvezi
        </button>
      </form>
    </main>
  );
}
