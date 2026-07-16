import type { Metadata } from "next";
import { DayView } from "@/components/DayView";
import { tomorrowInZagreb, type EventFilters } from "@/lib/events";

type Props = {
  searchParams: Promise<{ kategorija?: string; lokacija?: string }>;
};

const title = "Sutra — Kam denes";
const description = "Događanja sutra u Međimurskoj županiji.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/sutra" },
  openGraph: { title, description, url: "/sutra" },
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