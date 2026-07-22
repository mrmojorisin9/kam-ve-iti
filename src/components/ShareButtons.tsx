"use client";

import { useState } from "react";

const pillClass =
  "border-line bg-oak text-parchment-muted hover:text-gold focus-visible:outline-gold inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm shadow-sm shadow-black/10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4";

/**
 * Dijeljenje na društvenim mrežama. Facebook i WhatsApp imaju stvarne
 * web share URL-ove (rade kao obični linkovi, bez JS-a). Instagram NEMA
 * javni "podijeli poveznicu" web URL (mobilna-app-only ograničenje) — jedini
 * stvaran način da se ponudi je Web Share API-jev nativni share sheet, koji
 * na mobitelu s instaliranim Instagramom njega uključuje kao jednu od
 * opcija. Zato: "Podijeli" (nativni sheet, samo kad ga preglednik podržava)
 * + "Kopiraj poveznicu" kao univerzalna zamjena (desktop, ili preglednici
 * bez Web Share API-ja) — ne postoji lažni "Instagram" gumb koji ne bi
 * stvarno ništa radio.
 *
 * Prva "use client" komponenta u portalu nakon `ViewTracker`-a (Faza 8 Dan
 * 39) — `navigator.share`/`navigator.clipboard` su isključivo klijentski
 * preglednikovi API-ji, nema poslužiteljske zamjene.
 */
export function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function handleNativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // Korisnik otkazao dijeljenje ili API nedostupan usred poziva — nema
      // se što napraviti, tiho se ignorira (isti obrazac kao "best effort"
      // cleanup u admin-events.ts).
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API nedostupan (npr. nesiguran kontekst) — tiho ignorirano.
    }
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(title);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <span className="text-parchment-muted text-sm">Podijeli:</span>

      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={pillClass}
      >
        <span aria-hidden="true">📘</span> Facebook
      </a>

      <a
        href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={pillClass}
      >
        <span aria-hidden="true">💬</span> WhatsApp
      </a>

      {canNativeShare && (
        <button type="button" onClick={handleNativeShare} className={pillClass}>
          <span aria-hidden="true">📤</span> Podijeli
        </button>
      )}

      <button type="button" onClick={handleCopy} className={pillClass}>
        <span aria-hidden="true">{copied ? "✅" : "🔗"}</span>{" "}
        {copied ? "Kopirano" : "Kopiraj link"}
      </button>
    </div>
  );
}
