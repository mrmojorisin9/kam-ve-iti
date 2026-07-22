import type { Metadata } from "next";
import { DayView } from "@/components/DayView";
import {
  tomorrowInZagreb,
  parseEventFilters,
  parseSortOrder,
  type RawEventSearchParams,
} from "@/lib/events";

type Props = {
  searchParams: Promise<RawEventSearchParams>;
};

const title = "Sutra — Kam denes";
const description = "Događanja sutra u Međimurskoj županiji.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/sutra" },
  openGraph: {
    title,
    description,
    url: "/sutra",
    images: ["/opengraph-image"],
  },
};

export default async function TomorrowPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseEventFilters(params);
  const sortBy = parseSortOrder(params);

  return (
    <DayView
      date={tomorrowInZagreb()}
      active="sutra"
      path="/sutra"
      filters={filters}
      sortBy={sortBy}
    />
  );
}
