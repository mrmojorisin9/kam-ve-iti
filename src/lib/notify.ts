import { createClient } from "@/lib/supabase/server";
import { formatEventDateTime } from "@/lib/format";

/**
 * E-mail obavijest adminu kad posjetitelj prijavi događaj kroz
 * /prijavi-dogadaj (korisnikov zahtjev, 2026-10-12). Resend HTTP API
 * izravno preko `fetch` — bez npm ovisnosti (ADR-006 duh). Pošiljatelj na
 * verificiranoj domeni kamdenes.hr (DNS zapisi u Vercelu); adresa ne mora
 * postojati kao sandučić. Reply-To = prijavitelj, da mu se može odgovoriti
 * izravno iz maila.
 *
 * Nikad ne baca grešku — poziva se iz `after()` nakon što je prijava već
 * spremljena; neuspjelo slanje se samo logira (Vercel logs), prijava ostaje
 * vidljiva u adminu pod "Vanjske prijave" kao i prije.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const FROM = "Kam denes <obavijesti@kamdenes.hr>";
const DEFAULT_TO = "kamdenes.ured@gmail.com";
const ADMIN_LIST_URL =
  "https://kamdenes.hr/admin/dogadjaji?status=prijave-linkom";

export type SubmissionNotice = {
  title: string;
  categoryId: string;
  locationId: string;
  venueName: string | null;
  startAt: string;
  endAt: string | null;
  description: string | null;
  eventUrl: string | null;
  submitterEmail: string;
  submitterPhone: string | null;
};

/** Jednoredni tekst (naslov, header) — bez prijeloma koji bi slomili subject. */
function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export async function sendSubmissionNotice(notice: SubmissionNotice) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("sendSubmissionNotice: RESEND_API_KEY nije postavljen, mail preskočen");
    return;
  }

  try {
    const supabase = await createClient();
    const [{ data: category }, { data: location }] = await Promise.all([
      supabase.from("categories").select("name").eq("id", notice.categoryId).maybeSingle(),
      supabase.from("locations").select("name").eq("id", notice.locationId).maybeSingle(),
    ]);

    const when = notice.endAt
      ? `${formatEventDateTime(notice.startAt)} – ${formatEventDateTime(notice.endAt)}`
      : formatEventDateTime(notice.startAt);
    const where = [location?.name, notice.venueName].filter(Boolean).join(", ");

    const lines = [
      "Posjetitelj je prijavio novi događaj na Kam denes. Čeka odobrenje.",
      "",
      `Naziv:      ${oneLine(notice.title)}`,
      `Kategorija: ${category?.name ?? "-"}`,
      `Kada:       ${when}`,
      `Gdje:       ${where || "-"}`,
      `Link:       ${notice.eventUrl ?? "-"}`,
      "",
      `Prijavio:   ${notice.submitterEmail}${notice.submitterPhone ? `, ${notice.submitterPhone}` : ""}`,
      "",
      ...(notice.description ? ["Opis:", notice.description, ""] : []),
      `Pregledaj i odobri: ${ADMIN_LIST_URL}`,
      "",
      "(Na ovaj mail možeš odgovoriti — odgovor ide izravno prijavitelju.)",
    ];

    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [process.env.SUBMISSION_NOTIFY_EMAIL || DEFAULT_TO],
        reply_to: notice.submitterEmail,
        subject: `Nova prijava događaja: ${oneLine(notice.title).slice(0, 120)}`,
        text: lines.join("\n"),
      }),
    });

    if (!response.ok) {
      console.error(
        "sendSubmissionNotice: Resend odgovorio",
        response.status,
        await response.text(),
      );
    }
  } catch (error) {
    console.error("sendSubmissionNotice:", error);
  }
}
