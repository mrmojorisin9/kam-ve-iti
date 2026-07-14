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
