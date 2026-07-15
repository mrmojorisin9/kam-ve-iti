/** Vrijeme događaja (npr. "18:30") po Europe/Zagreb vremenu. */
export function formatEventTime(iso: string): string {
  return new Intl.DateTimeFormat("hr-HR", {
    timeZone: "Europe/Zagreb",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Naslovni datum stranice (npr. "utorak, 14. srpnja") za YYYY-MM-DD ulaz. */
export function formatHeaderDate(dateStr: string): string {
  // Podne izbjegava rubne slučajeve oko ponoći pri DST prijelazu.
  const date = new Date(`${dateStr}T12:00:00`);
  return new Intl.DateTimeFormat("hr-HR", {
    timeZone: "Europe/Zagreb",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

/** Puni datum i vrijeme (npr. "utorak, 14. srpnja u 18:30") za ISO ulaz. */
export function formatEventDateTime(iso: string): string {
  const datePart = new Intl.DateTimeFormat("hr-HR", {
    timeZone: "Europe/Zagreb",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));

  return `${datePart} u ${formatEventTime(iso)}`;
}

/**
 * Vrijeme završetka u odnosu na početak — samo vrijeme ("20:00") ako je
 * isti dan po Europe/Zagreb vremenu, inače puni datum i vrijeme.
 */
export function formatEventEnd(startIso: string, endIso: string): string {
  const dayOf = (iso: string) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Zagreb" }).format(
      new Date(iso),
    );

  return dayOf(startIso) === dayOf(endIso)
    ? formatEventTime(endIso)
    : formatEventDateTime(endIso);
}