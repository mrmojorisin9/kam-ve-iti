import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /tjedan je ukinut kao zasebna ruta — naslovna (/) sad prikazuje isti
  // 10-dnevni raspon (korisnikov zahtjev), pa /tjedan postaje samo alias.
  // 308 (permanent) čuva stare linkove/bookmarke i signalizira tražilicama
  // da je sadržaj trajno preseljen; query parametri (filteri) prolaze kroz
  // redirect automatski (Next.js redirects dokumentacija).
  async redirects() {
    return [{ source: "/tjedan", destination: "/", permanent: true }];
  },
  // Next.js 16 po defaultu stream-a generateMetadata rezultat u <body> za
  // klijente koji nisu na internoj listi botova (Google/Bing/Twitter/Slack) —
  // vidi node_modules/next/dist/docs .../htmlLimitedBots.md. To znači da title/
  // description/OG tagovi na stranici pojedinog događaja (dinamički
  // generateMetadata) ne bi bili u <head> za npr. LinkedIn/Discord/WhatsApp
  // scrapere ni većinu SEO alata koji ne izvršavaju JS. Supabase upit je brz
  // (~20ms, izmjereno Lighthouseom), pa cijena blokirajućeg renderiranja
  // metapodataka zanemariva — vraćamo staro (pre-16) ponašanje za sve.
  htmlLimitedBots: /.*/,
  experimental: {
    // Default 1MB je premalo za upload fotografije s mobitela u admin formi
    // (Faza 8, Dan 22) — vidi node_modules/next/dist/docs .../serverActions.md.
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
