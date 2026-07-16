import type { Metadata } from "next";
import { RangeView } from "@/components/RangeView";
import { weekendRangeInZagreb, type EventFilters } from "@/lib/events";

type Props = {
  searchParams: Promise<{ kategorija?: string; lokacija?: string }>;
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
  const { kategorija, lokacija } = await searchParams;
  const { start, end } = weekendRangeInZagreb();
  const filters: EventFilters = {
    categorySlug: kategorija || undefined,
    locationSlug: lokacija || undefined,
  };

  return (
    <RangeView
      start={start}
      end={end}
      active="vikend"
      subtitle="Ovaj vikend"
      path="/vikend"
      filters={filters}
    />
  );
}
