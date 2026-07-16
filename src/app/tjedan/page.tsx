import type { Metadata } from "next";
import { RangeView } from "@/components/RangeView";
import { weekRangeInZagreb, type EventFilters } from "@/lib/events";

type Props = {
  searchParams: Promise<{ kategorija?: string; lokacija?: string }>;
};

const title = "Ovaj tjedan — Kam denes";
const description = "Događanja ovaj tjedan u Međimurskoj županiji.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/tjedan" },
  openGraph: { title, description, url: "/tjedan" },
};

export default async function WeekPage({ searchParams }: Props) {
  const { kategorija, lokacija } = await searchParams;
  const { start, end } = weekRangeInZagreb();
  const filters: EventFilters = {
    categorySlug: kategorija || undefined,
    locationSlug: lokacija || undefined,
  };

  return (
    <RangeView
      start={start}
      end={end}
      active="tjedan"
      subtitle="Ovaj tjedan"
      path="/tjedan"
      filters={filters}
    />
  );
}