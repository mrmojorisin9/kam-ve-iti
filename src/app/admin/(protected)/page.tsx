import Link from "next/link";
import { LiveStatsPanel } from "@/components/admin/LiveStatsPanel";
import { getAdminStatusCounts } from "@/lib/admin-events";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;
  const counts = await getAdminStatusCounts();
  const hasLinkSubmissions = counts.link_submissions > 0;

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
      <h1 className="font-display text-parchment text-3xl font-semibold tracking-tight">
        Nadzorna ploča
      </h1>

      <div className="mt-6">
        <LiveStatsPanel />
      </div>

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
        <Link
          href="/admin/sponzor"
          className="border-line text-parchment-muted hover:text-parchment self-start rounded-md border px-4 py-2 text-sm font-medium"
        >
          Generalni sponzor
        </Link>
        <Link
          href="/admin/dogadjaji?status=prijave-linkom"
          className={
            hasLinkSubmissions
              ? "border-gold text-gold hover:bg-gold hover:text-night relative self-start rounded-md border px-4 py-2 text-sm font-medium"
              : "border-line text-parchment-muted hover:text-parchment relative self-start rounded-md border px-4 py-2 text-sm font-medium"
          }
        >
          Prijave linkom
          {hasLinkSubmissions && (
            <>
              <span
                className="absolute -top-1.5 -right-1.5 flex h-4 w-4"
                title={`${counts.link_submissions} nova prijava linkom čeka`}
              >
                <span className="bg-gold absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                <span className="bg-gold border-oak text-night relative inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] leading-none font-bold">
                  {counts.link_submissions}
                </span>
              </span>
            </>
          )}
        </Link>
      </div>
    </main>
  );
}
