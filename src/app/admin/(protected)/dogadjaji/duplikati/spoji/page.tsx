import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getEventsForMerge,
  type MergeCandidateEvent,
} from "@/lib/admin-events";
import { createClient } from "@/lib/supabase/server";
import { formatEventDateTime } from "@/lib/format";
import { utcIsoToZagrebLocalInput } from "@/lib/zagreb-time";
import { EventForm, type EventFormValues } from "@/components/admin/EventForm";
import { MergeQuickFillButtons } from "@/components/admin/MergeQuickFillButtons";
import { mergeEvents } from "./actions";

export const metadata: Metadata = {
  title: "Spoji duplikate — Kam denes admin",
};

const STATUS_LABELS: Record<string, string> = {
  published: "Objavljeno",
  pending_review: "Na čekanju",
  draft: "Nacrt",
  rejected: "Odbijeno",
};

const SMART_TAG_KEYS = [
  "is_free",
  "is_family_friendly",
  "is_dog_friendly",
  "is_solo_friendly",
  "is_romantic",
  "is_hidden_gem",
] as const;

function pickPrimary(candidates: MergeCandidateEvent[]): MergeCandidateEvent {
  const published = candidates.find((c) => c.status === "published");
  if (published) return published;
  return [...candidates].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )[0];
}

/**
 * Default vrijednosti spoja: tekst/taksonomija/datumi od primarnog
 * kandidata, pametni filteri kombinirani preko svih (OR ne gubi informaciju),
 * sponzorstvo produženo na najkasniji datum. Admin i dalje sve slobodno
 * uređuje prije spremanja — ovo je samo polazna točka.
 */
function computeMergedDefaults(
  candidates: MergeCandidateEvent[],
  primary: MergeCandidateEvent,
): EventFormValues {
  const values: EventFormValues = {
    title: primary.title,
    description: primary.description ?? undefined,
    category_id: primary.category_id,
    location_id: primary.location_id,
    venue_name: primary.venue_name ?? undefined,
    start_at: utcIsoToZagrebLocalInput(primary.start_at),
    end_at: primary.end_at
      ? utcIsoToZagrebLocalInput(primary.end_at)
      : undefined,
    organizer_name: primary.organizer_name ?? undefined,
    organizer_contact: primary.organizer_contact ?? undefined,
    source_url: primary.source_url ?? undefined,
    image_url: primary.image_url ?? undefined,
    status: primary.status,
    is_admin_featured: primary.is_admin_featured,
    submitter_email: primary.submitter_email ?? undefined,
    submitter_phone: primary.submitter_phone ?? undefined,
  };

  for (const key of SMART_TAG_KEYS) {
    values[key] = candidates.some((c) => c[key]);
  }

  const latestSponsored = candidates
    .map((c) => c.sponsored_until)
    .filter((v): v is string => Boolean(v))
    .sort()
    .at(-1);
  if (latestSponsored) {
    values.sponsored_until = utcIsoToZagrebLocalInput(latestSponsored);
  }

  return values;
}

function toQuickFillValues(
  candidate: MergeCandidateEvent,
): Record<string, string | boolean> {
  return {
    title: candidate.title,
    description: candidate.description ?? "",
    category_id: candidate.category_id,
    location_id: candidate.location_id,
    venue_name: candidate.venue_name ?? "",
    start_at: utcIsoToZagrebLocalInput(candidate.start_at),
    end_at: candidate.end_at ? utcIsoToZagrebLocalInput(candidate.end_at) : "",
    organizer_name: candidate.organizer_name ?? "",
    organizer_contact: candidate.organizer_contact ?? "",
    source_url: candidate.source_url ?? "",
    image_url: candidate.image_url ?? "",
    status: candidate.status,
    is_free: candidate.is_free,
    is_family_friendly: candidate.is_family_friendly,
    is_dog_friendly: candidate.is_dog_friendly,
    is_solo_friendly: candidate.is_solo_friendly,
    is_romantic: candidate.is_romantic,
    is_hidden_gem: candidate.is_hidden_gem,
    is_admin_featured: candidate.is_admin_featured,
    sponsored_until: candidate.sponsored_until
      ? utcIsoToZagrebLocalInput(candidate.sponsored_until)
      : "",
  };
}

export default async function MergeDuplicatesPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string; error?: string }>;
}) {
  const { ids: rawIds, error } = await searchParams;
  const ids = (rawIds ?? "").split(",").filter(Boolean);

  if (ids.length < 2) {
    redirect("/admin/dogadjaji/duplikati");
  }

  const [candidates, supabase] = await Promise.all([
    getEventsForMerge(ids),
    createClient(),
  ]);

  if (candidates.length < 2) {
    redirect("/admin/dogadjaji/duplikati");
  }

  const [{ data: categories }, { data: locations }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .order("sort_order", { ascending: true }),
    supabase.from("locations").select("id, name").order("name"),
  ]);

  const categoryNames = new Map(
    (categories ?? []).map((c) => [c.id, c.name] as const),
  );
  const locationNames = new Map(
    (locations ?? []).map((l) => [l.id, l.name] as const),
  );

  const primary = pickPrimary(candidates);
  const mergedDefaults = computeMergedDefaults(candidates, primary);

  const galleryByUrl = new Map<string, { id: string; url: string }>();
  const orderedCandidates = [
    primary,
    ...candidates.filter((c) => c.id !== primary.id),
  ];
  for (const candidate of orderedCandidates) {
    for (const image of candidate.gallery) {
      if (!galleryByUrl.has(image.url)) {
        galleryByUrl.set(image.url, image);
      }
    }
  }
  const unionGallery = [...galleryByUrl.values()];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
      <h1 className="font-display text-parchment text-3xl font-semibold tracking-tight">
        Spoji duplikate
      </h1>
      <p className="text-parchment-muted mt-2 text-sm">
        Odaberi koji zapis ostaje, po potrebi preuzmi podatke iz drugog
        duplikata, i uredi polja prije spremanja. Ostali događaji iz grupe
        bit će obrisani nakon spajanja.
      </p>

      <ul className="border-line divide-line mt-6 divide-y rounded-md border">
        {candidates.map((candidate) => (
          <li key={candidate.id} className="p-4 text-sm">
            <p className="text-parchment font-medium">{candidate.title}</p>
            <p className="text-parchment-muted mt-1">
              {formatEventDateTime(candidate.start_at)} ·{" "}
              {locationNames.get(candidate.location_id) ?? "—"} ·{" "}
              {categoryNames.get(candidate.category_id) ?? "—"} ·{" "}
              {STATUS_LABELS[candidate.status] ?? candidate.status}
              {candidate.source_name && <> · 🔗 {candidate.source_name}</>}
            </p>
          </li>
        ))}
      </ul>

      <EventForm
        categories={categories ?? []}
        locations={locations ?? []}
        action={mergeEvents}
        error={error}
        submitLabel="Spoji i objavi"
        eventId={primary.id}
        galleryImages={unionGallery}
        defaultValues={mergedDefaults}
        beforeFields={
          <>
            <input type="hidden" name="event_ids" value={ids.join(",")} />

            <fieldset className="border-line rounded-md border p-4">
              <legend className="text-parchment-muted px-1 text-sm">
                Koji zapis ostaje (id/URL)
              </legend>
              <div className="flex flex-col gap-2">
                {candidates.map((candidate) => (
                  <label
                    key={candidate.id}
                    className="text-parchment flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="primary_id"
                      value={candidate.id}
                      defaultChecked={candidate.id === primary.id}
                    />
                    {candidate.title} (
                    {STATUS_LABELS[candidate.status] ?? candidate.status})
                  </label>
                ))}
              </div>
            </fieldset>

            <MergeQuickFillButtons
              candidates={candidates.map((candidate) => ({
                id: candidate.id,
                title: candidate.title,
                values: toQuickFillValues(candidate),
              }))}
            />
          </>
        }
      />
    </main>
  );
}
