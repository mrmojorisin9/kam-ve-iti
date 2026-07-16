import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/admin/EventForm";
import { createEvent } from "./actions";

export const metadata: Metadata = {
  title: "Novi događaj — Kam denes admin",
};

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

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
        Novi događaj
      </h1>

      <EventForm
        categories={categories ?? []}
        locations={locations ?? []}
        action={createEvent}
        error={error}
        submitLabel="Spremi događaj"
      />
    </main>
  );
}
