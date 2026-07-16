import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 po defaultu stream-a generateMetadata rezultat u <body> za
  // klijente koji nisu na internoj listi botova (Google/Bing/Twitter/Slack) —
  // vidi node_modules/next/dist/docs .../htmlLimitedBots.md. To znači da title/
  // description/OG tagovi na stranici pojedinog događaja (dinamički
  // generateMetadata) ne bi bili u <head> za npr. LinkedIn/Discord/WhatsApp
  // scrapere ni većinu SEO alata koji ne izvršavaju JS. Supabase upit je brz
  // (~20ms, izmjereno Lighthouseom), pa cijena blokirajućeg renderiranja
  // metapodataka zanemariva — vraćamo staro (pre-16) ponašanje za sve.
  htmlLimitedBots: /.*/,
};

export default nextConfig;
