import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEventForEdit } from "@/lib/admin-events";
import { utcIsoToZagrebLocalInput } from "@/lib/zagreb-time";
import { EventForm } from "@/components/admin/EventForm";
import { updateEvent } from "./actions";

export const metadata: Metadata = {
  title: "Uredi događaj — Kam ve iti admin",
};

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

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
      <h1 className="font-display text-parchment text-3xl font-semibold tracking-tight">
        Uredi događaj
      </h1>

      <EventForm
        categories={categories ?? []}
        locations={locations ?? []}
        action={updateEvent}
        error={error}
        submitLabel="Spremi izmjene"
        eventId={event.id}
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
        }}
      />
    </main>
  );
}
