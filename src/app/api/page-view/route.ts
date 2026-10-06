import { trackPageView } from "@/lib/page-views";

// Samo statične stranice izvan App Routera (koje nemaju PageViewTracker)
// smiju bilježiti preglede ovim putem — allowlist umjesto proizvoljnog
// path-a da endpoint ne postane način punjenja tablice izmišljenim rutama.
const TRACKABLE_PATHS = ["/pdf"];

/** Anonimni pregled stranice (ADR-023) za public/pdf.html — vidi pdf-addons.js. */
export async function POST(request: Request) {
  let path: unknown;
  try {
    ({ path } = await request.json());
  } catch {
    return new Response(null, { status: 400 });
  }

  if (typeof path !== "string" || !TRACKABLE_PATHS.includes(path)) {
    return new Response(null, { status: 400 });
  }

  await trackPageView(path);
  return new Response(null, { status: 204 });
}
