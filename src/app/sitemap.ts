import type { MetadataRoute } from "next";
import { getPublishedEventsForSitemap } from "@/lib/events";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await getPublishedEventsForSitemap();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/danas`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/sutra`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${SITE_URL}/vikend`, changeFrequency: "hourly", priority: 0.8 },
  ];

  const eventPages: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${SITE_URL}/dogadjaji/${event.slug}`,
    lastModified: event.updatedAt,
    changeFrequency: "daily",
    // Arhivirani (završeni, SEO-zadržani) događaji ostaju u sitemapu radi
    // vec indeksiranih URL-ova, ali s nizim prioritetom od aktivnih.
    priority: event.isArchived ? 0.3 : 0.6,
  }));

  return [...staticPages, ...eventPages];
}
