import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skriva "X-Powered-By: Next.js" (framework fingerprinting) — sigurnosni
  // audit 2026-07-21, nalaz #6.
  poweredByHeader: false,
  // /tjedan je ukinut kao zasebna ruta — naslovna (/) sad prikazuje isti
  // 10-dnevni raspon (korisnikov zahtjev), pa /tjedan postaje samo alias.
  // 308 (permanent) čuva stare linkove/bookmarke i signalizira tražilicama
  // da je sadržaj trajno preseljen; query parametri (filteri) prolaze kroz
  // redirect automatski (Next.js redirects dokumentacija).
  async redirects() {
    return [{ source: "/tjedan", destination: "/", permanent: true }];
  },
  // Sigurnosni audit 2026-07-21, nalaz #1: next.config.ts prije nije imao
  // headers() uopće, pa produkcija nije slala CSP/X-Frame-Options/itd.
  // (potvrđeno uživo curl-om). Namjerno BEZ script-src/default-src
  // restrikcije u ovoj iteraciji — Next.js App Router ubrizgava inline
  // hydration <script> tagove (npr. __next_f) i stranica događaja ima
  // vlastiti inline JSON-LD <script> (structured-data.ts); stroga
  // default-src 'self' bez nonce/unsafe-inline bi ih blokirala bez
  // prethodnog uvida u to koliko je to raširena promjena. frame-ancestors/
  // base-uri/form-action ne diraju script loading pa su sigurni odmah.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
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
