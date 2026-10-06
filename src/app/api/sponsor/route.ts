import { getReadySponsor } from "@/lib/sponsor";

/**
 * Generalni sponzor za samostalnu /pdf stranicu (public/pdf.html +
 * public/pdf-addons.js) — ona nije dio App Routera pa ne prolazi kroz root
 * layout/SponsorWidget. Isti podaci i ista "spreman za prikaz" provjera kao
 * layout; `null` kad sponzor nije aktivan ili nije kompletan.
 */
export async function GET() {
  return Response.json(await getReadySponsor(), {
    headers: { "Cache-Control": "no-store" },
  });
}
