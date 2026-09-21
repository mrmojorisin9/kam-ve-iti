import type { Metadata } from "next";
import Link from "next/link";
import { getEventsForMerge, eventsListHref } from "@/lib/admin-events";
import { formatEventDateTime } from "@/lib/format";
import { confirmedBulkDelete } from "./actions";

export const metadata: Metadata = {
  title: "Obriši više događaja — Kam denes admin",
};

export default async function BulkDeleteEventsPage({
  searchParams,
}: {
  searchParams: Promise<{
    ids?: string;
    status?: string;
    kategorija?: string;
    lokacija?: string;
    error?: string;
  }>;
}) {
  const { ids: idsParam, status, kategorija, lokacija, error } =
    await searchParams;
  const ids = (idsParam ?? "").split(",").filter(Boolean);
  const returnTo = eventsListHref(status, kategorija, lokacija);
  const events = ids.length > 0 ? await getEventsForMerge(ids) : [];

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-12">
      <h1 className="font-display text-parchment text-3xl font-semibold tracking-tight">
        {events.length > 0
          ? `Obriši ${events.length} događaja?`
          : "Obriši više događaja"}
      </h1>

      {events.length === 0 ? (
        <p className="text-parchment-muted mt-6 text-sm">
          Nema odabranih događaja.
        </p>
      ) : (
        <ul className="border-line divide-line mt-6 divide-y rounded-md border text-sm">
          {events.map((event) => (
            <li key={event.id} className="px-4 py-3">
              <p className="text-parchment font-medium">{event.title}</p>
              <p className="text-parchment-muted mt-1">
                {formatEventDateTime(event.start_at)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {events.length > 0 && (
        <p className="text-parchment-muted mt-4 text-sm">
          Ova radnja se ne može poništiti.
        </p>
      )}

      {error && (
        <p className="text-wine-light mt-4 text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        {events.length > 0 && (
          <form action={confirmedBulkDelete}>
            <input type="hidden" name="ids" value={ids.join(",")} />
            {status && <input type="hidden" name="status" value={status} />}
            {kategorija && (
              <input type="hidden" name="kategorija" value={kategorija} />
            )}
            {lokacija && (
              <input type="hidden" name="lokacija" value={lokacija} />
            )}
            <button
              type="submit"
              className="border-wine-light text-wine-light hover:bg-wine rounded-md border px-4 py-2 text-sm font-medium hover:text-white"
            >
              Da, obriši sve
            </button>
          </form>
        )}

        <Link
          href={returnTo}
          className="border-line text-parchment-muted hover:text-parchment rounded-md border px-4 py-2 text-sm font-medium"
        >
          Odustani
        </Link>
      </div>
    </main>
  );
}
