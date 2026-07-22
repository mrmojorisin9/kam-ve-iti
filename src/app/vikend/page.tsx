import type { Metadata } from "next";
import { RangeView } from "@/components/RangeView";
import {
  weekendRangeInZagreb,
  parseEventFilters,
  parseSortOrder,
  type RawEventSearchParams,
} from "@/lib/events";

type Props = {
  searchParams: Promise<RawEventSearchParams>;
};

const title = "Ovaj vikend — Kam denes";
const description = "Događanja ovaj vikend u Međimurskoj županiji.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/vikend" },
  openGraph: {
    title,
    description,
    url: "/vikend",
    images: ["/opengraph-image"],
  },
};

export default async function WeekendPage({ searchParams }: Props) {
  const { start, end } = weekendRangeInZagreb();
  const params = await searchParams;
  const filters = parseEventFilters(params);
  const sortBy = parseSortOrder(params);

  return (
    <RangeView
      start={start}
      end={end}
      active="vikend"
      path="/vikend"
      filters={filters}
      sortBy={sortBy}
    />
  );
}
