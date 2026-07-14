import { getEventsForDate, todayInZagreb } from "@/lib/events";
import { formatHeaderDate } from "@/lib/format";
import { EventRow } from "@/components/EventRow";
import { EmptyState } from "@/components/EmptyState";

export default async function Home() {
  const today = todayInZagreb();
  const events = await getEventsForDate(today);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12 sm:py-20">
      <header className="mb-10">
        <p className="text-parchment-muted font-mono text-xs tracking-[0.2em] uppercase">
          Međimurska županija
        </p>
        <h1 className="font-display text-parchment mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Kam ve iti
        </h1>
        <p className="text-gold mt-3 font-mono text-sm capitalize">
          {formatHeaderDate(today)}
        </p>
      </header>

      {events.length === 0 ? (
        <EmptyState />
      ) : (
        <ul>
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ul>
      )}
    </main>
  );
}
