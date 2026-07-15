import { DayView } from "@/components/DayView";
import { tomorrowInZagreb, type EventFilters } from "@/lib/events";

type Props = {
  searchParams: Promise<{ kategorija?: string; lokacija?: string }>;
};

export const metadata = {
  title: "Sutra — Kam ve iti",
  description: "Događanja sutra u Međimurskoj županiji.",
};

export default async function TomorrowPage({ searchParams }: Props) {
  const { kategorija, lokacija } = await searchParams;
  const filters: EventFilters = {
    categorySlug: kategorija || undefined,
    locationSlug: lokacija || undefined,
  };

  return (
    <DayView
      date={tomorrowInZagreb()}
      active="sutra"
      path="/sutra"
      filters={filters}
    />
  );
}