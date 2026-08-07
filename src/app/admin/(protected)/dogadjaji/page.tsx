import type { Metadata } from "next";
import Link from "next/link";
import { listEventsForAdmin } from "@/lib/admin-events";
import { formatEventDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
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
    kategorija?: string;
    lokacija?: string;
    bulkUpdated?: string;
    bulkError?: string;
  }>;
}) {
  const { updated, deleted, status, kategorija, lokacija, bulkUpdated, bulkError } =
    await searchParams;
  const supabase = await createClient();
  const [events, { data: categories }, { data: locations }] =
    await Promise.all([
      listEventsForAdmin(status, kategorija, lokacija),
      supabase
        .from("categories")
        .select("id, name")
        .order("sort_order", { ascending: true }),
      supabase.from("locations").select("id, name").order("name"),
    ]);
  const showBulkActions = status === "pending_review";
  const bulkApprove = bulkUpdateStatus.bind(null, "published");
  const bulkReject = bulkUpdateStatus.bind(null, "rejected");

  // Status-tabovi moraju sacuvati aktivan kategorija/lokacija filter kod
  // prebacivanja taba, inace bi svaki klik na tab tiho ponistio filter.
  function tabHref(statusValue?: string): string {
    const params = new URLSearchParams();
    if (statusValue) params.set("status", statusValue);
    if (kategorija) params.set("kategorija", kategorija);
    if (lokacija) params.set("lokacija", lokacija);
    const query = params.toString();
    return query ? `/admin/dogadjaji?${query}` : "/admin/dogadjaji";
  }

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
          return (
            <Link
              key={tab.label}
              href={tabHref(tab.value)}
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

      <form
        method="get"
        className="border-line mt-4 flex flex-col gap-3 border-b pb-6 sm:flex-row sm:items-end"
      >
        {status && <input type="hidden" name="status" value={status} />}
        <label className="flex-1 text-sm">
          <span className="text-parchment-muted mb-1 block">Kategorija</span>
          <select
            name="kategorija"
            defaultValue={kategorija ?? ""}
            className="border-line bg-oak text-parchment focus-visible:outline-gold w-full rounded-md border px-3.5 py-2.5 text-sm shadow-sm shadow-black/10 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <option value="">Sve kategorije</option>
            {(categories ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex-1 text-sm">
          <span className="text-parchment-muted mb-1 block">Lokacija</span>
          <select
            name="lokacija"
            defaultValue={lokacija ?? ""}
            className="border-line bg-oak text-parchment focus-visible:outline-gold w-full rounded-md border px-3.5 py-2.5 text-sm shadow-sm shadow-black/10 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <option value="">Sve lokacije</option>
            {(locations ?? []).map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="border-gold text-gold hover:bg-gold hover:text-night rounded-md border px-5 py-2.5 text-sm font-medium"
        >
          Primijeni
        </button>
        {(kategorija || lokacija) && (
          <Link
            href={tabHref(status)}
            className="border-line text-parchment-muted hover:text-parchment rounded-md border px-5 py-2.5 text-center text-sm"
          >
            Poništi filter
          </Link>
        )}
      </form>

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
