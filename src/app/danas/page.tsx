import type { Metadata } from "next";
import { DayView } from "@/components/DayView";
import {
  todayInZagreb,
  parseEventFilters,
  type RawEventSearchParams,
} from "@/lib/events";

type Props = {
  searchParams: Promise<RawEventSearchParams>;
};

const title = "Danas — Kam denes";
const description = "Događanja danas u Međimurskoj županiji.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/danas" },
  openGraph: {
    title,
    description,
    url: "/danas",
    images: ["/opengraph-image"],
  },
};

export default async function TodayPage({ searchParams }: Props) {
  const filters = parseEventFilters(await searchParams);

  return (
    <DayView
      date={todayInZagreb()}
      active="danas"
      path="/danas"
      filters={filters}
    />
  );
}
