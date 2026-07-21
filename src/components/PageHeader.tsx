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
    <header className="border-line mb-10 rounded-xl border bg-[linear-gradient(135deg,var(--color-night)_0%,var(--color-oak)_100%)] p-6 sm:p-10">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
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
            className="text-parchment-muted hover:text-gold focus-visible:outline-gold mt-3 inline-block text-sm underline decoration-dotted underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            + Prijavi događaj
          </Link>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/medjimurje.png"
          alt="Međimurje"
          className="h-28 w-28 shrink-0 object-contain sm:h-36 sm:w-36"
        />
      </div>
    </header>
  );
}
