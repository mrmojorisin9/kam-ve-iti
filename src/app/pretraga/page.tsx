import type { Metadata } from "next";
import { searchEvents } from "@/lib/events";
import { EventRow } from "@/components/EventRow";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";

// Rezultati ovise o proizvoljnom "q" upitu (tanko/nepredvidivo za
// indeksiranje) — namjerno bez canonical/sitemap unosa, isti obrazac kao
// filtrirani prikazi (Faza 8 Dan 1) i objašnjeno u ADR-019.
export const metadata: Metadata = {
  title: "Pretraga — Kam denes",
  robots: { index: false, follow: true },
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const events = query ? await searchEvents(query) : [];

  return (
    <>
      <PageHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12 sm:py-20 md:max-w-3xl lg:max-w-5xl">
        <form
          method="get"
          action="/pretraga"
          role="search"
          className="border-line mb-8 flex flex-col gap-3 border-b pb-6 sm:flex-row"
        >
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Pretraži događaje po nazivu, mjestu, organizatoru…"
            aria-label="Pretraži događaje"
            className="border-line bg-oak text-parchment focus-visible:outline-gold w-full flex-1 rounded-md border px-3.5 py-2.5 text-sm shadow-sm shadow-black/10 focus-visible:outline-2 focus-visible:outline-offset-2"
          />
          <button
            type="submit"
            className="border-gold text-gold hover:bg-gold hover:text-night focus-visible:outline-gold rounded-md border px-5 py-2.5 text-sm font-medium shadow-sm shadow-black/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Pretraži
          </button>
        </form>

        {!query ? (
          <p className="text-parchment-muted">Upiši pojam za pretragu iznad.</p>
        ) : events.length === 0 ? (
          <EmptyState
            title={`Nema rezultata za "${query}"`}
            message="Pokušaj drugi pojam ili pregledaj događaje po kategoriji/regiji."
          />
        ) : (
          <>
            <p className="text-parchment-muted mb-4 text-sm">
              {events.length} {events.length === 1 ? "rezultat" : "rezultata"}{" "}
              za &quot;{query}&quot;
            </p>
            <ul className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  );
}
