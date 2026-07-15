import { DayView } from "@/components/DayView";
import { todayInZagreb, type EventFilters } from "@/lib/events";

type Props = {
  searchParams: Promise<{ kategorija?: string; lokacija?: string }>;
};

export default async function Home({ searchParams }: Props) {
  const { kategorija, lokacija } = await searchParams;
  const filters: EventFilters = {
    categorySlug: kategorija || undefined,
    locationSlug: lokacija || undefined,
  };

  return (
    <DayView date={todayInZagreb()} active="danas" path="/" filters={filters} />
  );
}