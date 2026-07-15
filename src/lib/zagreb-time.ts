/**
 * Pretvara "wall-clock" vrijeme unešeno u admin formi (npr. iz
 * `<input type="datetime-local">`, format "YYYY-MM-DDTHH:mm") u ISO instant,
 * uz pretpostavku da je uneseno vrijeme lokalno Europe/Zagreb vrijeme.
 *
 * Dvokoračno rješenje bez dodatne tz-biblioteke: prvo naivno parsiranje kao
 * UTC da se dobije približan instant, pa dohvat stvarnog UTC offseta za taj
 * instant (Intl zna DST pravila za Europe/Zagreb) i korekcija. Rubni slučaj
 * koji ostaje neriješen: sat vremena oko same DST tranzicije (kad lokalno
 * vrijeme ili ne postoji ili je dvoznačno) — zanemarivo za admin unos.
 */
export function zagrebLocalToUtcIso(localDateTime: string): string {
  const naiveUtc = new Date(`${localDateTime}:00Z`);
  const offsetMinutes = zagrebOffsetMinutes(naiveUtc);
  return new Date(naiveUtc.getTime() - offsetMinutes * 60_000).toISOString();
}

/**
 * Obrat od `zagrebLocalToUtcIso` — pretvara ISO instant (iz baze) u
 * "YYYY-MM-DDTHH:mm" string za `defaultValue` u `<input type="datetime-local">`
 * na admin formi za uređivanje, u Europe/Zagreb lokalnom vremenu.
 */
export function utcIsoToZagrebLocalInput(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zagreb",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  // Intl ponekad vrati "24" za ponoć umjesto "00" (poznata quirk).
  const hour = get("hour") === "24" ? "00" : get("hour");

  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

function zagrebOffsetMinutes(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Zagreb",
    timeZoneName: "shortOffset",
  }).formatToParts(instant);

  const offsetName =
    parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT+1";
  const match = /GMT([+-]\d+)(?::(\d+))?/.exec(offsetName);
  const hours = match ? Number(match[1]) : 1;
  const minutes = match?.[2] ? Number(match[2]) : 0;

  return hours * 60 + (hours < 0 ? -minutes : minutes);
}
