import type { Metadata } from "next";
import Link from "next/link";
import { listEventsForAdmin } from "@/lib/admin-events";
import { formatEventDateTime } from "@/lib/format";
import { bulkUpdateStatus } from "./bulk-actions";

export const metadata: Metadata = {
  title: "Događaji — Kam denes admin",
};

const STATUS_LABELS: Record<string, string> = {
  published: "Objavljeno",
  pending_review: "Na čekanju",
  draft: "Nacrt",
  rejected: "Odbijeno",
};

const STATUS_TABS: { value?: string; label: string }[] = [
  { value: undefined, label: "Svi" },
  { value: "pending_review", label: "Na čekanju" },
  { value: "published", label: "Objavljeno" },
  { value: "draft", label: "Nacrt" },
  { value: "rejected", label: "Odbijeno" },
];

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{
    updated?: string;
    deleted?: string;
    status?: string;
    bulkUpdated?: string;
    bulkError?: string;
  }>;
}) {
  const { updated, deleted, status, bulkUpdated, bulkError } =
    await searchParams;
  const events = await listEventsForAdmin(status);
  const showBulkActions = status === "pending_review";
  const bulkApprove = bulkUpdateStatus.bind(null, "published");
  const bulkReject = bulkUpdateStatus.bind(null, "rejected");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-parchment text-3xl font-semibold tracking-tight">
          Događaji
        </h1>
        <div className="flex shrink-0 gap-3">
          <Link
            href="/admin/dogadjaji/duplikati"
            className="border-line text-parchment-muted hover:text-parchment rounded-md border px-4 py-2 text-sm font-medium"
          >
            Mogući duplikati
          </Link>
          <Link
            href="/admin/dogadjaji/novi"
            className="border-gold text-gold hover:bg-gold hover:text-night rounded-md border px-4 py-2 text-sm font-medium"
          >
            Novi događaj
          </Link>
        </div>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const isActive = (status ?? undefined) === tab.value;
          const href = tab.value
            ? `/admin/dogadjaji?status=${tab.value}`
            : "/admin/dogadjaji";
          return (
            <Link
              key={tab.label}
              href={href}
              aria-current={isActive ? "true" : undefined}
              className={
                isActive
                  ? "bg-gold text-night rounded-full px-3 py-1 text-sm font-medium"
                  : "border-line text-parchment-muted hover:text-parchment rounded-full border px-3 py-1 text-sm"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {updated && (
        <p className="border-gold text-gold mt-6 rounded-md border px-4 py-3 text-sm">
          Događaj ažuriran.
        </p>
      )}
      {deleted && (
        <p className="border-gold text-gold mt-6 rounded-md border px-4 py-3 text-sm">
          Događaj obrisan.
        </p>
      )}
      {bulkUpdated && (
        <p className="border-gold text-gold mt-6 rounded-md border px-4 py-3 text-sm">
          {bulkUpdated} događaj(a) ažurirano.
        </p>
      )}
      {bulkError && (
        <p className="border-wine-light text-wine-light mt-6 rounded-md border px-4 py-3 text-sm">
          Greška kod bulk ažuriranja: {bulkError}
        </p>
      )}

      {events.length === 0 ? (
        <p className="text-parchment-muted mt-8">
          {status
            ? `Nema događaja sa statusom "${STATUS_LABELS[status] ?? status}".`
            : "Još nema unesenih događaja."}
        </p>
      ) : (
        <form action={showBulkActions ? bulkApprove : undefined}>
          {showBulkActions && (
            <div className="mt-6 flex justify-end gap-3 text-sm">
              <button
                type="submit"
                formAction={bulkReject}
                className="border-wine-light text-wine-light rounded-md border px-3 py-1.5"
              >
                Odbaci odabrano
              </button>
              <button
                type="submit"
                formAction={bulkApprove}
                className="border-gold text-gold rounded-md border px-3 py-1.5"
              >
                Odobri odabrano
              </button>
            </div>
          )}

          <ul className="border-line divide-line mt-4 divide-y border-t">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  {showBulkActions && (
                    <input
                      type="checkbox"
                      name="ids"
                      value={event.id}
                      className="border-line mt-1.5 shrink-0"
                      aria-label={`Odaberi "${event.title}"`}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-parchment truncate font-medium">
                      {event.title}
                    </p>
                    <p className="text-parchment-muted mt-1 text-sm">
                      {formatEventDateTime(event.start_at)} ·{" "}
                      {event.category_name} · {event.location_name} ·{" "}
                      <span
                        className={
                          event.status === "published"
                            ? "text-gold"
                            : undefined
                        }
                      >
                        {STATUS_LABELS[event.status] ?? event.status}
                      </span>
                      {event.source_name && (
                        <>
                          {" · "}
                          {event.source_url ? (
                            <a
                              href={event.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="border-line text-parchment-muted hover:text-parchment rounded border px-1.5 py-0.5 text-xs"
                            >
                              🔗 {event.source_name}
                            </a>
                          ) : (
                            <span className="border-line text-parchment-muted rounded border px-1.5 py-0.5 text-xs">
                              🔗 {event.source_name}
                            </span>
                          )}
                        </>
                      )}
                    </p>
                  </div>
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
                    className="border-line text-wine-light rounded-md border px-3 py-1.5"
                  >
                    Obriši
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </form>
      )}
    </main>
  );
}
