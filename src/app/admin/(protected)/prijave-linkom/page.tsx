import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteLinkSubmission } from "./actions";

export const metadata: Metadata = {
  title: "Prijave linkom — Kam denes admin",
};

type LinkSubmission = {
  id: string;
  url: string;
  note: string | null;
  submitter_email: string | null;
  submitter_phone: string | null;
  created_at: string;
};

export default async function LinkSubmissionsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_link_submissions")
    .select("id, url, note, submitter_email, submitter_phone, created_at")
    .order("created_at", { ascending: true });

  const submissions = (data ?? []) as LinkSubmission[];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
      <h1 className="font-display text-parchment text-3xl font-semibold tracking-tight">
        Prijave linkom
      </h1>
      <p className="text-parchment-muted mt-2 text-sm">
        Poslani linkovi s javnog obrasca &quot;Imaš događaj? Pošalji nam
        link&quot;.
        Otvori link, prenesi podatke u novi događaj, pa označi kao
        riješeno.
      </p>

      {submissions.length === 0 ? (
        <p className="text-parchment-muted mt-8">Nema neriješenih prijava.</p>
      ) : (
        <ul className="border-line divide-line mt-6 divide-y border-t">
          {submissions.map((submission) => (
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
    </main>
  );
}
