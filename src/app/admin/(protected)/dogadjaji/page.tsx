import type { Metadata } from "next";
import Link from "next/link";
import { listEventsForAdmin } from "@/lib/admin-events";
import { formatEventDateTime } from "@/lib/format";

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
  }>;
}) {
  const { updated, deleted, status } = await searchParams;
  const events = await listEventsForAdmin(status);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-parchment text-3xl font-semibold tracking-tight">
          Događaji
        </h1>
        <Link
          href="/admin/dogadjaji/novi"
          className="border-gold text-gold hover:bg-gold hover:text-night shrink-0 rounded-md border px-4 py-2 text-sm font-medium"
        >
          Novi događaj
        </Link>
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

      {events.length === 0 ? (
        <p className="text-parchment-muted mt-8">
          {status
            ? `Nema događaja sa statusom "${STATUS_LABELS[status] ?? status}".`
            : "Još nema unesenih događaja."}
        </p>
      ) : (
        <ul className="border-line divide-line mt-8 divide-y border-t">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-parchment truncate font-medium">
                  {event.title}
                </p>
                <p className="text-parchment-muted mt-1 text-sm">
                  {formatEventDateTime(event.start_at)} · {event.category_name}{" "}
                  · {event.location_name} ·{" "}
                  <span
                    className={
                      event.status === "published" ? "text-gold" : undefined
                    }
                  >
                    {STATUS_LABELS[event.status] ?? event.status}
                  </span>
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
                  className="border-line text-wine-light rounded-md border px-3 py-1.5"
                >
                  Obriši
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
