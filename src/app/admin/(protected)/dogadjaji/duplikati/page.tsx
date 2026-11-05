import type { Metadata } from "next";
import Link from "next/link";
import { listEventsForDuplicateScan } from "@/lib/admin-events";
import {
  findDuplicateGroups,
  groupSharedWords,
  parseDuplicateMatchOptions,
} from "@/lib/duplicates";
import { formatEventDateTime } from "@/lib/format";
import { EventThumb } from "@/components/admin/EventThumb";
import { keepEvent } from "./keep-actions";

export const metadata: Metadata = {
  title: "Mogući duplikati — Kam denes admin",
};

const STATUS_LABELS: Record<string, string> = {
  published: "Objavljeno",
  pending_review: "Na čekanju",
  draft: "Nacrt",
};

const inputClass =
  "border-line bg-oak text-parchment focus-visible:outline-gold w-full rounded-md border px-3.5 py-2.5 text-sm shadow-sm shadow-black/10 focus-visible:outline-2 focus-visible:outline-offset-2";

export default async function DuplicateEventsPage({
  searchParams,
}: {
  searchParams: Promise<{
    deleted?: string;
    merged?: string;
    kept?: string;
    error?: string;
    usporedi_lokaciju?: string;
    usporedi_vrijeme?: string;
    prag_naslova?: string;
    uskladi_rijeci?: string;
  }>;
}) {
  const {
    deleted,
    merged,
    kept,
    error,
    usporedi_lokaciju,
    usporedi_vrijeme,
    prag_naslova,
    uskladi_rijeci,
  } = await searchParams;
  const options = parseDuplicateMatchOptions({
    usporedi_lokaciju,
    usporedi_vrijeme,
    prag_naslova,
    uskladi_rijeci,
  });
  const events = await listEventsForDuplicateScan();
  const groups = findDuplicateGroups(events, options);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-parchment text-3xl font-semibold tracking-tight">
          Mogući duplikati
        </h1>
        <Link
          href="/admin/dogadjaji"
          className="border-line text-parchment-muted hover:text-parchment shrink-0 rounded-md border px-4 py-2 text-sm font-medium"
        >
          Natrag
        </Link>
      </div>

      <p className="text-parchment-muted mt-2 text-sm">
        Događaji na istoj lokaciji, unutar 24h jedan od drugog, čiji naslovi
        dijele barem jednu istu riječ (neovisno o padežu, velikim slovima,
        dijakriticima i zapisu broja: &bdquo;2.&ldquo; = &bdquo;drugi&ldquo;)
        ili su vrlo slični. Provjeri svaku grupu i obriši viškove.
      </p>

      <form
        method="get"
        className="border-line mt-4 flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-end"
      >
        <label className="flex-1 text-sm">
          <span className="text-parchment-muted mb-1 block">
            Usporedi lokaciju
          </span>
          <select
            name="usporedi_lokaciju"
            defaultValue={options.compareLocation ? "1" : "0"}
            className={inputClass}
          >
            <option value="1">Da</option>
            <option value="0">Ne</option>
          </select>
          {!options.compareLocation && (
            <span className="text-wine-light mt-1 block text-xs">
              Oprez: bez lokacijskog uvjeta mogu se lažno grupirati nepovezani
              događaji s istim standardnim terminom (npr. više utakmica u isto
              vrijeme na različitim mjestima).
            </span>
          )}
        </label>

        <label className="flex-1 text-sm">
          <span className="text-parchment-muted mb-1 block">
            Usporedi vrijeme (24h)
          </span>
          <select
            name="usporedi_vrijeme"
            defaultValue={options.compareTime ? "1" : "0"}
            className={inputClass}
          >
            <option value="1">Da</option>
            <option value="0">Ne</option>
          </select>
        </label>

        <label className="flex-1 text-sm">
          <span className="text-parchment-muted mb-1 block">
            Podudaranje riječi
          </span>
          <select
            name="uskladi_rijeci"
            defaultValue={options.matchWords ? "1" : "0"}
            className={inputClass}
          >
            <option value="1">Da</option>
            <option value="0">Ne</option>
          </select>
        </label>

        <label className="flex-1 text-sm">
          <span className="text-parchment-muted mb-1 block">
            Prag sličnosti naslova
          </span>
          <select
            name="prag_naslova"
            defaultValue={String(options.titleThreshold)}
            className={inputClass}
          >
            <option value="50">50%</option>
            <option value="65">65%</option>
            <option value="85">85%</option>
          </select>
        </label>

        <button
          type="submit"
          className="border-gold text-gold hover:bg-gold hover:text-night rounded-md border px-5 py-2.5 text-sm font-medium"
        >
          Primijeni
        </button>
      </form>

      {deleted && (
        <p className="border-gold text-gold mt-4 rounded-md border px-4 py-3 text-sm">
          Događaj obrisan.
        </p>
      )}
      {merged && (
        <p className="border-gold text-gold mt-4 rounded-md border px-4 py-3 text-sm">
          Grupa spojena u jedan događaj.
        </p>
      )}
      {kept && (
        <p className="border-gold text-gold mt-4 rounded-md border px-4 py-3 text-sm">
          Zadržan odabrani događaj, ostali iz grupe obrisani.
        </p>
      )}
      {error && (
        <p className="border-wine-light text-wine-light mt-4 rounded-md border px-4 py-3 text-sm">
          Greška: {error}
        </p>
      )}

      {groups.length === 0 ? (
        <p className="text-parchment-muted mt-8">
          Nema pronađenih mogućih duplikata.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-6">
          {groups.map((group) => {
            const sharedWords = options.matchWords
              ? groupSharedWords(group.map((e) => e.title))
              : [];
            return (
              <li
                key={group[0].id}
                className="border-gold/40 rounded-md border p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-parchment-muted text-xs">
                    {sharedWords.length > 0 && (
                      <>Zajednička riječ: {sharedWords.join(", ")}</>
                    )}
                  </p>
                  <Link
                    href={`/admin/dogadjaji/duplikati/spoji?ids=${group.map((e) => e.id).join(",")}`}
                    className="border-gold text-gold hover:bg-gold hover:text-night rounded-md border px-3 py-1.5 text-sm font-medium"
                  >
                    Spoji grupu
                  </Link>
                </div>
                <ul className="divide-line divide-y">
                  {group.map((event) => (
                    <li
                      key={event.id}
                      className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <EventThumb imageUrl={event.image_url} />
                        <div className="min-w-0">
                          <p className="text-parchment truncate font-medium">
                            {event.title}
                          </p>
                          <p className="text-parchment-muted mt-1 text-sm">
                            {formatEventDateTime(event.start_at)} ·{" "}
                            {event.location_name} ·{" "}
                            {STATUS_LABELS[event.status] ?? event.status}
                            {event.source_name && (
                              <> · 🔗 {event.source_name}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-3 text-sm">
                        <form action={keepEvent}>
                          <input
                            type="hidden"
                            name="event_ids"
                            value={group.map((e) => e.id).join(",")}
                          />
                          <input
                            type="hidden"
                            name="keep_id"
                            value={event.id}
                          />
                          <button
                            type="submit"
                            title={`Zadrži ovaj, obriši ostale (${group.length - 1})`}
                            className="border-gold text-gold hover:bg-gold hover:text-night rounded-md border px-3 py-1.5"
                          >
                            Zadrži ovaj
                          </button>
                        </form>
                        <Link
                          href={`/admin/dogadjaji/${event.id}/uredi`}
                          className="border-line text-parchment-muted hover:text-parchment rounded-md border px-3 py-1.5"
                        >
                          Uredi
                        </Link>
                        <Link
                          href={`/admin/dogadjaji/${event.id}/obrisi?returnTo=${encodeURIComponent("/admin/dogadjaji/duplikati")}`}
                          className="border-wine-light text-wine-light rounded-md border px-3 py-1.5"
                        >
                          Obriši
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
