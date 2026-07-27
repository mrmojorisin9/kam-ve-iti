import type { EventDetail } from "@/lib/events";

const URL_PATTERN = /^https?:\/\//i;

/**
 * Schema.org Event JSON-LD za stranicu pojedinog događaja (Google rich
 * results). Bez geokodiranja (ADR-007) pa `location.address` ostaje na
 * razini grada/općine, bez ulice/koordinata.
 */
export function buildEventJsonLd(event: EventDetail, siteUrl: string) {
  // Google zahtijeva apsolutne URL-ove za `image` — filtrira relativne
  // putanje (npr. stariji `/event-placeholder.svg` upisan izravno kao
  // image_url) koje ovdje ne bi bile razrješive.
  const images = [
    ...(event.image_url ? [event.image_url] : []),
    ...event.gallery.map((img) => img.url),
  ].filter((url) => URL_PATTERN.test(url));
  const eventUrl = `${siteUrl}/dogadjaji/${event.slug}`;

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
    ...(images.length > 0 ? { image: images } : {}),
    // Cijena ulaznica se još ne prikuplja (Prioritet 3, C3, nije rađeno) —
    // "offers" bez cijene bi bio nevažeći Schema.org zapis, pa se dodaje
    // samo za besplatne događaje gdje je cijena poznata i uvijek 0.
    ...(event.is_free
      ? {
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "EUR",
            availability: "https://schema.org/InStock",
            url: eventUrl,
          },
        }
      : {}),
    ...(event.organizer_name
      ? {
          organizer: {
            "@type": "Organization",
            name: event.organizer_name,
            ...(event.organizer_contact &&
            URL_PATTERN.test(event.organizer_contact)
              ? { url: event.organizer_contact }
              : {}),
          },
        }
      : {}),
    url: eventUrl,
  };
}

/** Escapira `<` da JSON-LD sadržaj (npr. opis događaja) ne može prekinuti <script> tag. */
export function jsonLdToScriptString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Tekstualna adresa za Google Maps embed/upute za dolazak — isti sastav
 * podataka kao JSON-LD `address` iznad (mjesto održavanja + lokacija +
 * regija + država), samo kao ravan string umjesto strukturiranog objekta.
 * Bez geokodiranja/koordinata (ADR-007) — oslanja se na Googleov vlastiti
 * search-by-text umjesto na spremljene lat/lng.
 */
export function buildLocationQuery(event: EventDetail): string {
  return [
    event.venue_name,
    event.location_name,
    "Međimurska županija",
    "Hrvatska",
  ]
    .filter((part): part is string => Boolean(part))
    .join(", ");
}
