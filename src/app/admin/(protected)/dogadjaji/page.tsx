import type { Metadata } from "next";
import Link from "next/link";
import {
  listEventsForAdmin,
  groupPendingEventsBySource,
  type AdminEventListItem,
} from "@/lib/admin-events";
import { formatEventDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { bulkUpdateStatus } from "./bulk-actions";
import { deleteLinkSubmission } from "./link-actions";

export const metadata: Metadata = {
  title: "Događaji — Kam denes admin",
};

const STATUS_LABELS: Record<string, string> = {
  published: "Objavljeno",
  pending_review: "Na čekanju",
  draft: "Nacrt",
  rejected: "Odbijeno",
};

// "prijave-linkom" nije pravi `events.status` — sentinel vrijednost u istom
// `status` query parametru koja u renderu grana na posve drugu tablicu
// (`event_link_submissions`, sirovi linkovi prije nego postanu događaj).
// Zadržava postojeći tabHref()/URL obrazac umjesto novog query parametra.
const LINK_SUBMISSIONS_TAB = "prijave-linkom";

const STATUS_TABS: { value?: string; label: string }[] = [
  { value: undefined, label: "Svi" },
  { value: "pending_review", label: "Na čekanju" },
  { value: "published", label: "Objavljeno" },
  { value: "rejected", label: "Odbijeno" },
  { value: LINK_SUBMISSIONS_TAB, label: "Prijave linkom" },
];

type LinkSubmission = {
  id: string;
  url: string;
  note: string | null;
  submitter_email: string | null;
  submitter_phone: string | null;
  created_at: string;
};

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
  const isLinkSubmissionsTab = status === LINK_SUBMISSIONS_TAB;
  const supabase = await createClient();

  const [events, { data: categories }, { data: locations }, linkSubmissions] =
    await Promise.all([
      isLinkSubmissionsTab
        ? Promise.resolve([])
        : listEventsForAdmin(status, kategorija, lokacija),
      supabase
        .from("categories")
        .select("id, name")
        .order("sort_order", { ascending: true }),
      supabase.from("locations").select("id, name").order("name"),
      isLinkSubmissionsTab
        ? supabase
            .from("event_link_submissions")
            .select("id, url, note, submitter_email, submitter_phone, created_at")
            .order("created_at", { ascending: true })
            .then(({ data }) => (data ?? []) as LinkSubmission[])
        : Promise.resolve([] as LinkSubmission[]),
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

      {!isLinkSubmissionsTab && (
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
      )}

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

      {isLinkSubmissionsTab ? (
        <>
          <p className="text-parchment-muted mt-6 text-sm">
            Poslani linkovi s javnog obrasca &quot;Imaš događaj? Pošalji nam
            link&quot;. Otvori link, prenesi podatke u novi događaj, pa
            označi kao riješeno.
          </p>

          {linkSubmissions.length === 0 ? (
            <p className="text-parchment-muted mt-8">Nema neriješenih prijava.</p>
          ) : (
            <ul className="border-line divide-line mt-4 divide-y border-t">
              {linkSubmissions.map((submission) => (
                <li
                  key={submission.id}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <a
                      href={submission.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:underline break-all"
                    >
                      {submission.url}
                    </a>
                    {submission.note && (
                      <p className="text-parchment mt-1 text-sm">
                        {submission.note}
                      </p>
                    )}
                    {(submission.submitter_email || submission.submitter_phone) && (
                      <p className="text-parchment-muted mt-1 text-sm">
                        {submission.submitter_email}
                        {submission.submitter_email && submission.submitter_phone
                          ? " · "
                          : ""}
                        {submission.submitter_phone}
                      </p>
                    )}
                    <p className="text-parchment-muted mt-1 text-xs">
                      {new Date(submission.created_at).toLocaleString("hr-HR")}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-3 text-sm">
                    <Link
                      href={`/admin/dogadjaji/novi?link=${encodeURIComponent(submission.url)}`}
                      className="border-gold text-gold hover:bg-gold hover:text-night rounded-md border px-3 py-1.5"
                    >
                      Unesi kao događaj
                    </Link>
                    <form action={deleteLinkSubmission}>
                      <input type="hidden" name="id" value={submission.id} />
                      <button
                        type="submit"
                        className="border-line text-parchment-muted hover:text-parchment rounded-md border px-3 py-1.5"
                      >
                        Riješeno
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : events.length === 0 ? (
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

          {status === "pending_review" ? (
            <div className="mt-4 flex flex-col gap-8">
              {groupPendingEventsBySource(events).map((group) => (
                <section key={group.key}>
                  <h2 className="text-parchment-muted text-sm font-semibold tracking-wide uppercase">
                    {group.label} ({group.events.length})
                  </h2>
                  <ul className="border-line divide-line mt-2 divide-y border-t">
                    {group.events.map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        showCheckbox={showBulkActions}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <ul className="border-line divide-line mt-4 divide-y border-t">
              {events.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  showCheckbox={showBulkActions}
                />
              ))}
            </ul>
          )}
        </form>
      )}
    </main>
  );
}

/**
 * Oznaka kanala unosa po retku (korisnikov zahtjev — sekcijski naslov u
 * "Na čekanju" grupiranju, ispod, se lako izgubi u dužoj listi; bedž po
 * retku ostaje vidljiv i na tabu "Svi" gdje grupiranja uopće nema). Isti
 * izvor istine kao `groupPendingEventsBySource` — scraper uvijek postavlja
 * `source_name`, javna prijava uvijek `submitter_email`/`submitter_phone`,
 * sve ostalo (ručni unos i CSV uvoz) je namjerno nerazlučivo.
 */
function SourceBadge({ event }: { event: AdminEventListItem }) {
  if (event.source_name) {
    return null; // vec ima vlastiti 🔗 source_name bedz ispod
  }
  if (event.submitter_email || event.submitter_phone) {
    return (
      <span className="border-line text-parchment-muted rounded border px-1.5 py-0.5 text-xs">
        👤 Korisnik
      </span>
    );
  }
  return (
    <span className="border-line text-parchment-muted rounded border px-1.5 py-0.5 text-xs">
      ✏️ Ručno
    </span>
  );
}

function EventRow({
  event,
  showCheckbox,
}: {
  event: AdminEventListItem;
  showCheckbox: boolean;
}) {
  return (
    <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {showCheckbox && (
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
          <p className="text-parchment-muted mt-1 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
            <span>
              {formatEventDateTime(event.start_at)} · {event.category_name} ·{" "}
              {event.location_name} ·{" "}
              <span
                className={event.status === "published" ? "text-gold" : undefined}
              >
                {STATUS_LABELS[event.status] ?? event.status}
              </span>
            </span>
            {event.is_archived && (
              <span className="border-line text-parchment-muted rounded border px-1.5 py-0.5 text-xs">
                📦 Arhiviran
              </span>
            )}
            <SourceBadge event={event} />
            {event.source_name && (
              <>
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
  );
}
