import type { FC, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function IconKultura(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="4" width="18" height="14" rx="1" />
      <circle cx="8" cy="8.5" r="1.5" />
      <path d="m3 16 5.5-6L13 15l3-3 5 4" />
    </svg>
  );
}

function IconGlazba(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 18V5l10-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="16" cy="16" r="3" />
    </svg>
  );
}

function IconSport(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4v1a4 4 0 0 0 4 4M17 5h3v1a4 4 0 0 1-4 4" />
      <path d="M12 13v4M8 21h8" />
    </svg>
  );
}

function IconManifestacije(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 21V3" />
      <path d="M5 4h12l-2.5 3.5L17 11H5" />
    </svg>
  );
}

function IconEdukacija(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 8 12 3l10 5-10 5L2 8Z" />
      <path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5" />
    </svg>
  );
}

function IconGastro(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M8 3h8l-1 6a3 3 0 0 1-6 0L8 3Z" />
      <path d="M12 12v6M9 21h6" />
    </svg>
  );
}

function IconOstalo(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="6" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="18" cy="12" r="1.4" />
    </svg>
  );
}

const CATEGORY_ICONS: Record<string, FC<IconProps>> = {
  kultura: IconKultura,
  "glazba-i-koncerti": IconGlazba,
  "sport-i-rekreacija": IconSport,
  "manifestacije-i-feste": IconManifestacije,
  "edukacija-i-radionice": IconEdukacija,
  "gastronomija-i-vino": IconGastro,
};

/** Ručno pisana linijska SVG ikona po kategoriji (ADR-006 — bez ikonografske biblioteke). */
export function CategoryIcon({
  slug,
  ...props
}: { slug: string } & IconProps) {
  const Icon = CATEGORY_ICONS[slug] ?? IconOstalo;
  return <Icon {...props} />;
}
