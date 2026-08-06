import type { Metadata } from "next";
import Link from "next/link";
import { listEventsForDuplicateScan } from "@/lib/admin-events";
import { findDuplicateGroups } from "@/lib/duplicates";
import { formatEventDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Mogući duplikati — Kam denes admin",
};

const STATUS_LABELS: Record<string, string> = {
  published: "Objavljeno",
  pending_review: "Na čekanju",
  draft: "Nacrt",
};

export default async function DuplicateEventsPage() {
  const events = await listEventsForDuplicateScan();
  const groups = findDuplicateGroups(events);

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
        Događaji na istoj lokaciji, unutar 24h jedan od drugog, s istim ili
        vrlo sličnim naslovom. Provjeri svaku grupu i obriši viškove.
      </p>

      {groups.length === 0 ? (
        <p className="text-parchment-muted mt-8">
          Nema pronađenih mogućih duplikata.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-6">
          {groups.map((group) => (
            <li
              key={group[0].id}
              className="border-gold/40 rounded-md border p-4"
            >
              <ul className="divide-line divide-y">
                {group.map((event) => (
                  <li
                    key={event.id}
                    className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-parchment truncate font-medium">
                        {event.title}
                      </p>
                      <p className="text-parchment-muted mt-1 text-sm">
                        {formatEventDateTime(event.start_at)} ·{" "}
                        {event.location_name} ·{" "}
                        {STATUS_LABELS[event.status] ?? event.status}
                        {event.source_name && <> · 🔗 {event.source_name}</>}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-3 text-sm">
                      <Link
                        href={`/admin/dogadjaji/${event.id}/uredi`}
                        className="border-line text-parchment-muted hover:text-parchment rounded-md border px-3 py-1.5"
                      >
                        Uredi
                      </Link>
                      <Link
                        href={`/admin/dogadjaji/${event.id}/obrisi`}
                        className="border-wine-light text-wine-light rounded-md border px-3 py-1.5"
                      >
                        Obriši
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
