import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventForEdit } from "@/lib/admin-events";
import { formatEventDateTime } from "@/lib/format";
import { deleteEvent } from "./actions";

export const metadata: Metadata = {
  title: "Obriši događaj — Kam ve iti admin",
};

export default async function DeleteEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const event = await getEventForEdit(id);

  if (!event) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-12">
      <h1 className="font-display text-parchment text-3xl font-semibold tracking-tight">
        Obriši događaj?
      </h1>

      <div className="border-line mt-6 rounded-md border p-4 text-sm">
        <p className="text-parchment font-medium">{event.title}</p>
        <p className="text-parchment-muted mt-1">
          {formatEventDateTime(event.start_at)}
        </p>
      </div>

      <p className="text-parchment-muted mt-4 text-sm">
        Ova radnja se ne može poništiti.
      </p>

      {error && (
        <p className="text-wine-light mt-4 text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <form action={deleteEvent}>
          <input type="hidden" name="id" value={event.id} />
          <button
            type="submit"
            className="border-wine-light text-wine-light hover:bg-wine rounded-md border px-4 py-2 text-sm font-medium hover:text-white"
          >
            Da, obriši
          </button>
        </form>

        <Link
          href="/admin/dogadjaji"
          className="border-line text-parchment-muted hover:text-parchment rounded-md border px-4 py-2 text-sm font-medium"
        >
          Odustani
        </Link>
      </div>
    </main>
  );
}
