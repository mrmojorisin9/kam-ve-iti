"use client";

import { useEffect, useState } from "react";

const thumbClass =
  "border-line focus-visible:outline-gold h-16 w-24 shrink-0 rounded-md border object-cover transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 sm:h-20 sm:w-28";

/**
 * Traka minijatura + full-screen lightbox za dodatne fotografije događaja
 * (Faza 8, Dan 74, C4) — glavna image_url ostaje odvojena (prikazana iznad
 * ove komponente), ovo je isključivo galerija. Ručno građeno, bez nove
 * ovisnosti (ADR-006 duh) — treća `"use client"` komponenta u portalu, uz
 * `ViewTracker` i `ShareButtons`.
 */
export function EventGallery({
  images,
}: {
  images: { id: string; url: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;

    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIndex(null);
      if (e.key === "ArrowRight") {
        setOpenIndex((i) => (i === null ? null : (i + 1) % images.length));
      }
      if (e.key === "ArrowLeft") {
        setOpenIndex((i) =>
          i === null ? null : (i - 1 + images.length) % images.length,
        );
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [openIndex, images.length]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setOpenIndex(index)}
          >
            <img src={image.url} alt="" className={thumbClass} />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            className="text-parchment hover:text-gold focus-visible:outline-gold absolute top-4 right-4 text-2xl focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Zatvori"
          >
            ✕
          </button>

          <img
            src={images[openIndex].url}
            alt=""
            className="max-h-[80vh] max-w-full rounded-md object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <div
              className="mt-4 flex items-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() =>
                  setOpenIndex((i) =>
                    i === null ? null : (i - 1 + images.length) % images.length,
                  )
                }
                className="text-parchment hover:text-gold focus-visible:outline-gold text-2xl focus-visible:outline-2 focus-visible:outline-offset-2"
                aria-label="Prethodna slika"
              >
                ←
              </button>

              <span className="text-parchment-muted text-sm">
                {openIndex + 1}/{images.length}
              </span>

              <button
                type="button"
                onClick={() =>
                  setOpenIndex((i) =>
                    i === null ? null : (i + 1) % images.length,
                  )
                }
                className="text-parchment hover:text-gold focus-visible:outline-gold text-2xl focus-visible:outline-2 focus-visible:outline-offset-2"
                aria-label="Sljedeća slika"
              >
                →
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
