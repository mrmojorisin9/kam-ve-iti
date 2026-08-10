import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/admin",
      },
      // Preventivna, ne 100%-tna zaštita od scrapanja (korisnikov
      // zahtjev) — imenovani SEO-alat botovi koji poštuju robots.txt
      // (za razliku od generičkih scraping skripti, blokiranih na
      // razini middleware-a, vidi src/proxy.ts).
      {
        userAgent: [
          "AhrefsBot",
          "SemrushBot",
          "MJ12bot",
          "DotBot",
          "BLEXBot",
          "PetalBot",
          "DataForSeoBot",
        ],
        disallow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
