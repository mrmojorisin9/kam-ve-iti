import type { Metadata } from "next";
import { RangeView } from "@/components/RangeView";
import {
  weekendRangeInZagreb,
  parseEventFilters,
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
  const filters = parseEventFilters(await searchParams);

  return (
    <RangeView
      start={start}
      end={end}
      active="vikend"
      path="/vikend"
      filters={filters}
    />
  );
}
