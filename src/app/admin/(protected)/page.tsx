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
      <p className="text-parchment-muted mt-3">
        CSV uvoz i pregled na čekanju dolaze u sljedećim koracima Faze 5.
      </p>

      {created && (
        <p className="border-gold text-gold mt-6 rounded-md border px-4 py-3 text-sm">
          Događaj spremljen.{" "}
          <Link href={`/dogadjaji/${created}`} className="underline">
            Pogledaj stranicu
          </Link>
        </p>
      )}

      <Link
        href="/admin/dogadjaji/novi"
        className="border-gold text-gold hover:bg-gold hover:text-night mt-6 self-start rounded-md border px-4 py-2 text-sm font-medium"
      >
        Novi događaj
      </Link>
    </main>
  );
}
