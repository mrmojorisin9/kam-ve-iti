import Link from "next/link";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
      <h1 className="font-display text-parchment text-3xl font-semibold tracking-tight">
        Nadzorna ploča
      </h1>
      {created && (
        <p className="border-gold text-gold mt-6 rounded-md border px-4 py-3 text-sm">
          Događaj spremljen.{" "}
          <Link href={`/dogadjaji/${created}`} className="underline">
            Pogledaj stranicu
          </Link>
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/admin/dogadjaji"
          className="border-gold text-gold hover:bg-gold hover:text-night self-start rounded-md border px-4 py-2 text-sm font-medium"
        >
          Svi događaji
        </Link>
        <Link
          href="/admin/dogadjaji/novi"
          className="border-line text-parchment-muted hover:text-parchment self-start rounded-md border px-4 py-2 text-sm font-medium"
        >
          Novi događaj
        </Link>
        <Link
          href="/admin/dogadjaji/uvoz"
          className="border-line text-parchment-muted hover:text-parchment self-start rounded-md border px-4 py-2 text-sm font-medium"
        >
          CSV uvoz
        </Link>
      </div>
    </main>
  );
}
