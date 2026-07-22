import Link from "next/link";
import { todayInZagreb } from "@/lib/events";
import { formatHeaderDate } from "@/lib/format";

/**
 * Podnaslov je uvijek današnji datum, bez obzira na aktivni tab
 * (Danas/Sutra/Vikend/Tjedan) — korisnikov zahtjev, hero panel se ne
 * mijenja ovisno o prikazanom rasponu događaja.
 */
export function PageHeader() {
  return (
    <header className="border-line relative mb-10 overflow-hidden rounded-xl border bg-[linear-gradient(135deg,var(--color-night)_0%,var(--color-oak)_100%)] p-6 shadow-lg shadow-black/20 sm:p-10 lg:p-12">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/medjimurje.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 m-auto h-48 w-48 object-contain opacity-15 sm:hidden"
      />

      <div className="relative z-10 flex flex-col items-center gap-6 sm:flex-row sm:justify-between sm:gap-8">
        <div>
          <p className="text-parchment-muted font-mono text-xs tracking-[0.2em] uppercase">
            Međimurska županija
          </p>
          <h1 className="font-display text-parchment mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            <Link
              href="/"
              className="focus-visible:outline-gold rounded-sm transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              <span className="text-gold">K</span>am denes
            </Link>
          </h1>
          <p className="text-gold mt-3 font-mono text-sm capitalize">
            {formatHeaderDate(todayInZagreb())}
          </p>
          <Link
            href="/prijavi-dogadaj"
            className="border-line bg-oak text-parchment-muted hover:border-gold/60 hover:text-gold focus-visible:outline-gold mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium shadow-sm shadow-black/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            + Prijavi događaj
          </Link>

          {/* Na mobitelu se pretraga seli pokraj "Još filtara" gumba u
              FilterBar-u (korisnikov zahtjev) — ovdje ostaje samo za sm+. */}
          <form
            method="get"
            action="/pretraga"
            role="search"
            className="border-line bg-oak focus-within:border-gold/60 mt-4 hidden w-full max-w-xs items-center gap-1 rounded-full border py-1.5 pr-1.5 pl-4 shadow-sm shadow-black/10 transition-colors sm:flex"
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

        <div className="relative hidden shrink-0 sm:block">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 scale-125 rounded-full bg-[radial-gradient(circle,var(--color-gold)_0%,transparent_70%)] opacity-20 blur-xl"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/medjimurje.png"
            alt="Međimurje"
            className="object-contain sm:h-36 sm:w-36"
          />
        </div>
      </div>
    </header>
  );
}
