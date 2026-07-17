import type { Metadata } from "next";
import { DayView } from "@/components/DayView";
import { todayInZagreb, type EventFilters } from "@/lib/events";

type Props = {
  searchParams: Promise<{ kategorija?: string; lokacija?: string }>;
};

const title = "Kam denes — događanja danas u Međimurskoj županiji";
const description = "Događanja danas u Međimurskoj županiji.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description, url: "/", images: ["/opengraph-image"] },
};

export default async function Home({ searchParams }: Props) {
  const { kategorija, lokacija } = await searchParams;
  const filters: EventFilters = {
    categorySlug: kategorija || undefined,
    locationSlug: lokacija || undefined,
  };

  return (
    <DayView
      date={todayInZagreb()}
      active="danas"
      path="/"
      filters={filters}
      showCategoryStrip
      showFeatured
    />
  );
}
