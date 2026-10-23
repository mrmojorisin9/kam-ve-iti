import type { Metadata } from "next";
import { RangeView } from "@/components/RangeView";
import {
  weekRangeInZagreb,
  parseEventFilters,
  parseSortOrder,
  type RawEventSearchParams,
} from "@/lib/events";
import {
  buildWebSiteJsonLd,
  jsonLdToScriptString,
} from "@/lib/structured-data";

type Props = {
  searchParams: Promise<RawEventSearchParams>;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// "kamdenes.hr" u naslovu i opisu: brend se piše "Kam denes", a Google je
// jednorječni upit "kamdenes" ispravljao u "kamdes" (Google provjera
// 2026-10-23) — domena u naslovu povezuje oba zapisa.
const title = "Kam denes (kamdenes.hr) — događanja u Međimurskoj županiji";
const description =
  "Što se događa u Međimurju? Kam denes (kamdenes.hr) prikazuje koncerte, festivale, sport i kulturu u sljedećih 20 dana — danas, sutra i za vikend.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description, url: "/", images: ["/opengraph-image"] },
};

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseEventFilters(params);
  const sortBy = parseSortOrder(params);
  const { start, end } = weekRangeInZagreb();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdToScriptString(buildWebSiteJsonLd(SITE_URL)),
        }}
      />
      <RangeView
        start={start}
        end={end}
        active="tjedan"
        path="/"
        filters={filters}
        sortBy={sortBy}
        showCategoryStrip
        showTrending
        showSponsored
      />
    </>
  );
}
