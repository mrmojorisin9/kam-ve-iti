import type { EventDetail } from "@/lib/events";

/**
 * Schema.org Event JSON-LD za stranicu pojedinog događaja (Google rich
 * results). Bez geokodiranja (ADR-007) pa `location.address` ostaje na
 * razini grada/općine, bez ulice/koordinata.
 */
export function buildEventJsonLd(event: EventDetail, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.start_at,
    ...(event.end_at ? { endDate: event.end_at } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue_name || event.location_name,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.location_name,
        addressRegion: "Međimurska županija",
        addressCountry: "HR",
      },
    },
    ...(event.description ? { description: event.description } : {}),
    ...(event.image_url ? { image: [event.image_url] } : {}),
    ...(event.organizer_name
      ? { organizer: { "@type": "Organization", name: event.organizer_name } }
      : {}),
    url: `${siteUrl}/dogadjaji/${event.slug}`,
  };
}

/** Escapira `<` da JSON-LD sadržaj (npr. opis događaja) ne može prekinuti <script> tag. */
export function jsonLdToScriptString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
