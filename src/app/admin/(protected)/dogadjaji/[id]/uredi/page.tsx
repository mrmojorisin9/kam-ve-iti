import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { eventsListHref, getEventForEdit } from "@/lib/admin-events";
import { utcIsoToZagrebLocalInput } from "@/lib/zagreb-time";
import { EventForm } from "@/components/admin/EventForm";
import { updateEvent } from "./actions";

export const metadata: Metadata = {
  title: "Uredi događaj — Kam denes admin",
};

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    status?: string;
    kategorija?: string;
    lokacija?: string;
    sort?: string;
  }>;
}) {
  const { id } = await params;
  const { error, status, kategorija, lokacija, sort } = await searchParams;
  // Tab/filter/sort popisa s kojeg je došao "Uredi" — prosljeđuje se kroz
  // formu da updateEvent vrati na isti prikaz i do ovog retka (fokus).
  const listHref = eventsListHref(status, kategorija, lokacija, sort);
  const backHref = `${listHref}${listHref.includes("?") ? "&" : "?"}fokus=${id}`;

  const [event, supabase] = await Promise.all([
    getEventForEdit(id),
    createClient(),
  ]);

  if (!event) {
    notFound();
  }

  const [{ data: categories }, { data: locations }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .order("sort_order", { ascending: true }),
    supabase.from("locations").select("id, name").order("name"),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
      <Link
        href={backHref}
        className="text-parchment-muted hover:text-parchment mb-4 self-start text-sm"
      >
        ← Natrag na popis
      </Link>
      <h1 className="font-display text-parchment text-3xl font-semibold tracking-tight">
        Uredi događaj{" "}
        <span className="text-parchment-muted font-mono text-xl font-normal">
          #{event.display_id}
        </span>
      </h1>

      <EventForm
        categories={categories ?? []}
        locations={locations ?? []}
        action={updateEvent}
        error={error}
        submitLabel="Spremi izmjene"
        eventId={event.id}
        galleryImages={event.gallery}
        beforeFields={
          <>
            {status && <input type="hidden" name="list_status" value={status} />}
            {kategorija && (
              <input type="hidden" name="list_kategorija" value={kategorija} />
            )}
            {lokacija && (
              <input type="hidden" name="list_lokacija" value={lokacija} />
            )}
            {sort && <input type="hidden" name="list_sort" value={sort} />}
          </>
        }
        defaultValues={{
          title: event.title,
          description: event.description ?? undefined,
          category_id: event.category_id,
          location_id: event.location_id,
          venue_name: event.venue_name ?? undefined,
          start_at: utcIsoToZagrebLocalInput(event.start_at),
          end_at: event.end_at
            ? utcIsoToZagrebLocalInput(event.end_at)
            : undefined,
          organizer_name: event.organizer_name ?? undefined,
          organizer_contact: event.organizer_contact ?? undefined,
          source_url: event.source_url ?? undefined,
          image_url: event.image_url ?? undefined,
          status: event.status,
          is_free: event.is_free,
          is_family_friendly: event.is_family_friendly,
          is_dog_friendly: event.is_dog_friendly,
          is_solo_friendly: event.is_solo_friendly,
          is_romantic: event.is_romantic,
          is_hidden_gem: event.is_hidden_gem,
          is_admin_featured: event.is_admin_featured,
          sponsored_until: event.sponsored_until
            ? utcIsoToZagrebLocalInput(event.sponsored_until)
            : undefined,
          submitter_email: event.submitter_email ?? undefined,
          submitter_phone: event.submitter_phone ?? undefined,
        }}
      />
    </main>
  );
}
