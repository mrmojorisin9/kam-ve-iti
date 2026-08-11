/**
 * Mala minijatura pored retka događaja u adminu (korisnikov zahtjev —
 * vizualna provjera ima li događaj sliku, ili brza vizualna usporedba
 * mogućih duplikata, bez otvaranja svakog pojedinačno). Dijele je
 * `/admin/dogadjaji` i `/admin/dogadjaji/duplikati`.
 *
 * Namjerno NE koristi `/event-placeholder.svg` fallback kao javni
 * `EventRow.tsx` (Faza 8, Dan 13) — taj fallback bi ovdje izgledao kao
 * "ima sliku" i poništio svrhu, pa nedostajuća slika dobiva vizualno jasno
 * drugačiji, isprekidani okvir s znakom umjesto fotografije.
 */
export function EventThumb({ imageUrl }: { imageUrl: string | null }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        className="border-line h-10 w-10 shrink-0 rounded-md border object-cover"
      />
    );
  }
  return (
    <span
      title="Bez slike"
      aria-label="Bez slike"
      className="border-line text-parchment-muted/50 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-dashed text-xs"
    >
      ✕
    </span>
  );
}
