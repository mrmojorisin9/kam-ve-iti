import { RangeView } from "@/components/RangeView";
import { weekendRangeInZagreb, type EventFilters } from "@/lib/events";

type Props = {
  searchParams: Promise<{ kategorija?: string; lokacija?: string }>;
};

export const metadata = {
  title: "Ovaj vikend — Kam ve iti",
  description: "Događanja ovaj vikend u Međimurskoj županiji.",
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