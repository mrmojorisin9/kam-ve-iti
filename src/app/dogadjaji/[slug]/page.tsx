import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getEventBySlug } from "@/lib/events";
import { formatEventDateTime, formatEventEnd } from "@/lib/format";
import {
  buildEventJsonLd,
  jsonLdToScriptString,
  buildLocationQuery,
} from "@/lib/structured-data";
import { CategoryIcon } from "@/components/CategoryIcon";
import { PinIcon } from "@/components/PinIcon";
import { ViewTracker } from "@/components/ViewTracker";
import { ShareButtons } from "@/components/ShareButtons";
import { EventGallery } from "@/components/EventGallery";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return { title: "Događaj nije pronađen — Kam denes" };
  }

  const title = `${event.title} — Kam denes`;
  const description = event.description
    ? event.description.length > 160
      ? `${event.description.slice(0, 157)}...`
      : event.description
    : `${event.title} u ${event.location_name}, ${formatEventDateTime(event.start_at)}.`;

  const path = `/dogadjaji/${event.slug}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type: "article",
      images: [
        event.image_url ?? "/opengraph-image",
        ...event.gallery.map((img) => img.url),
      ],
    },
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const jsonLd = buildEventJsonLd(event, SITE_URL);
  const mapsQuery = encodeURIComponent(buildLocationQuery(event));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12 sm:py-20 md:max-w-3xl">
      <ViewTracker eventId={event.id} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdToScriptString(jsonLd) }}
      />

      <Link
        href="/"
        className="text-parchment-muted hover:text-gold focus-visible:outline-gold mb-8 inline-flex w-fit items-center gap-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        ← Natrag na popis
      </Link>

      <img
        src={event.image_url ?? "/event-placeholder.svg"}
        alt=""
        className="border-line mb-6 aspect-video w-full rounded-lg border object-cover"
      />

      <EventGallery images={event.gallery} />

      <span className="border-gold/40 bg-gold/10 text-gold inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs tracking-wide uppercase">
        <CategoryIcon slug={event.category_slug} className="h-3.5 w-3.5" />
        {event.category_name}
      </span>

      <h1 className="font-display text-parchment mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {event.title}
      </h1>

      <dl className="border-line mt-6 space-y-3 border-t pt-6 text-sm">
        <div className="flex gap-2">
          <dt className="text-parchment-muted w-24 shrink-0">Kada</dt>
          <dd className="text-parchment">
            {formatEventDateTime(event.start_at)}
            {event.end_at
              ? ` – ${formatEventEnd(event.start_at, event.end_at)}`
              : ""}
          </dd>
        </div>

        <div className="flex gap-2">
          <dt className="text-parchment-muted w-24 shrink-0">Gdje</dt>
          <dd className="text-parchment inline-flex items-center gap-1.5">
            <PinIcon className="h-4 w-4 shrink-0" />
            {event.location_name}
            {event.venue_name ? `, ${event.venue_name}` : ""}
          </dd>
        </div>

        {event.organizer_name && (
          <div className="flex gap-2">
            <dt className="text-parchment-muted w-24 shrink-0">Organizator</dt>
            <dd className="text-parchment">
              {event.organizer_name}
              {event.organizer_contact ? ` — ${event.organizer_contact}` : ""}
            </dd>
          </div>
        )}
      </dl>

      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`}
        target="_blank"
        rel="noopener noreferrer"
        className="border-line bg-oak text-parchment-muted hover:text-gold focus-visible:outline-gold mt-6 inline-flex w-fit items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm shadow-sm shadow-black/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        <PinIcon className="h-3.5 w-3.5 shrink-0" />
        Upute za dolazak ↗
      </a>

      {event.description && (
        <p className="text-parchment-muted mt-8 leading-relaxed whitespace-pre-line">
          {event.description}
        </p>
      )}

      {event.source_url && (
        <a
          href={event.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold hover:text-parchment focus-visible:outline-gold mt-8 inline-flex w-fit items-center gap-1 text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Izvor / više informacija ↗
        </a>
      )}

      <ShareButtons
        title={event.title}
        url={`${SITE_URL}/dogadjaji/${event.slug}`}
      />
    </main>
  );
}
