import type { Metadata } from "next";
import { RangeView } from "@/components/RangeView";
import {
  weekRangeInZagreb,
  parseEventFilters,
  parseSortOrder,
  type RawEventSearchParams,
} from "@/lib/events";

type Props = {
  searchParams: Promise<RawEventSearchParams>;
};

const title = "Kam denes — događanja sljedećih 10 dana u Međimurskoj županiji";
const description = "Događanja sljedećih 10 dana u Međimurskoj županiji.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description, url: "/", images: ["/opengraph-image"] },
};

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseEventFilters(params);
  const sortBy = parseSortOrder(params);
  const { start, end } = weekRangeInZagreb();

  return (
    <RangeView
      start={start}
      end={end}
      active="tjedan"
      path="/"
      filters={filters}
      sortBy={sortBy}
      showCategoryStrip
      showTrending
    />
  );
}
