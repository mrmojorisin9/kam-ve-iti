import { RangeView } from "@/components/RangeView";
import { weekRangeInZagreb, type EventFilters } from "@/lib/events";

type Props = {
  searchParams: Promise<{ kategorija?: string; lokacija?: string }>;
};

export const metadata = {
  title: "Ovaj tjedan — Kam ve iti",
  description: "Događanja ovaj tjedan u Međimurskoj županiji.",
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