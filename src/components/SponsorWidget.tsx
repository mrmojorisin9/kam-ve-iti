"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { usePathname } from "next/navigation";
import type { DisplayFrequency } from "@/lib/sponsor";
import {
  isListingPath,
  recordSplashPlayed,
  shouldPlaySplash,
} from "@/lib/sponsor-frequency";

type Phase = "pending" | "active" | "collapsed";
type Point = { x: number; y: number };

export type SponsorWidgetSponsor = {
  sponsorName: string;
  logoUrl: string;
  promoText: string | null;
  linkUrl: string;
  displayFrequency: DisplayFrequency;
};

// Korisnikova odluka: prikaz traje 2s prije automatskog kolapsa (bilo je
// 3s). Prijelaz (dijagonalno klizanje centar → kut) traje zasebnih 700ms.
const HOLD_MS = 2000;
const TRANSITION_MS = 700;

// Jedinstvena veličina skupljenog widgeta na svim veličinama zaslona
// (~15% manje od prijašnjih 56/64px, korisnikov zahtjev) — jedna
// vrijednost umjesto po-breakpointa pojednostavljuje matematiku
// povlačenja (drag) ispod.
const WIDGET_SIZE = 48;
const WIDGET_MARGIN = 12;
const DRAG_THRESHOLD = 6;
const POS_STORAGE_KEY = "kd_sponsor_widget_pos";

function loadSavedPos(): Point | null {
  try {
    const raw = localStorage.getItem(POS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.x !== "number" || typeof parsed?.y !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function clampToViewport(p: Point): Point {
  const half = WIDGET_SIZE / 2;
  return {
    x: Math.min(Math.max(p.x, half), window.innerWidth - half),
    y: Math.min(Math.max(p.y, half), window.innerHeight - half),
  };
}

/** Donji lijevi kut — korisnikova odabrana početna lokacija. */
function defaultCollapsedPos(): Point {
  const half = WIDGET_SIZE / 2;
  return {
    x: WIDGET_MARGIN + half,
    y: window.innerHeight - WIDGET_MARGIN - half,
  };
}

/** Korisnikova ranije povučena pozicija ima prednost pred defaultom. */
function resolveCollapsedPos(): Point {
  return clampToViewport(loadSavedPos() ?? defaultCollapsedPos());
}

/**
 * Splash → widget → modal state stroj za generalnog sponzora (Faza 2).
 *
 * Logo je JEDAN trajni `<button>` element kroz cijeli životni vijek — ne
 * dva odvojena elementa koja se izmjenjuju. Pozicija je `pos` state (px,
 * `top`/`left` preko inline stila — nikad `bottom`/`right`/`auto`, jer CSS
 * ne može glatko animirati prijelaz PREMA/OD `auto`) kombinirana sa
 * stalnim `-translate-x-1/2 -translate-y-1/2` ("centriraj se na svoju
 * top/left točku") — to `transition-all` pretvara u vidljiv dijagonalni
 * klizeći prijelaz iz centra ekrana u kut. Ista `pos` mehanika pokreće i
 * korisnikovo ručno povlačenje (pointer eventi) nakon kolapsa — povučena
 * pozicija se pamti u localStorage i postaje novi "kut" za idući posjet.
 *
 * `sponsor` je već provjeren (isActive + kompletan) u `src/app/layout.tsx`
 * prije nego što se ova komponenta uopće montira.
 */
export function SponsorWidget({ sponsor }: { sponsor: SponsorWidgetSponsor }) {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("pending");
  const [pos, setPos] = useState<Point | null>(null);
  const [zoomedIn, setZoomedIn] = useState(false);
  const [collapsing, setCollapsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [hasOpenedModal, setHasOpenedModal] = useState(false);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = useRef(false);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; posX: number; posY: number } | null>(
    null,
  );

  function beginCollapse() {
    if (collapsing) return; // već pokrenuto (skip + auto-timeout istovremeno)

    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    setCollapsing(true);
    setPos(resolveCollapsedPos());
    recordSplashPlayed(sponsor.displayFrequency);

    finalizeTimeoutRef.current = setTimeout(() => {
      finalizeTimeoutRef.current = null;
      setPhase("collapsed");
    }, TRANSITION_MS);
  }

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const eligible =
      isListingPath(pathname) && shouldPlaySplash(sponsor.displayFrequency);

    // localStorage/pathname odluka je nužno client-only (SSR nema
    // localStorage) — "pending" je zajednički server/prvi-client-render
    // izlaz, ovaj setState nakon mounta je namjerna, jednokratna
    // hidracijski-sigurna korekcija, ne izvedeno stanje koje bi se moglo
    // izračunati tijekom rendera.
    if (!eligible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPos(resolveCollapsedPos());
      setPhase("collapsed");
      return;
    }

    setPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 + 24 });
    setPhase("active");

    // Kratka odgoda prije "zoomedIn" da CSS transition stvarno primijeti
    // promjenu s početnog scale-0 stanja (isti "sljedeći tick" trik kao
    // ostale mount-triggered animacije).
    const zoomTimer = setTimeout(() => setZoomedIn(true), 20);
    holdTimeoutRef.current = setTimeout(beginCollapse, HOLD_MS);

    return () => {
      clearTimeout(zoomTimer);
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      if (finalizeTimeoutRef.current) clearTimeout(finalizeTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!modalOpen) return;

    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") setModalOpen(false);
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [modalOpen]);

  if (pathname.startsWith("/admin") || phase === "pending") return null;

  function handlePointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    if (phase !== "collapsed" || !pos) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    movedRef.current = false;
    setIsDragging(true);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      posX: pos.x,
      posY: pos.y,
    };
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      movedRef.current = true;
    }
    if (movedRef.current) {
      setPos(
        clampToViewport({
          x: dragStartRef.current.posX + dx,
          y: dragStartRef.current.posY + dy,
        }),
      );
    }
  }

  function handlePointerUp() {
    if (!dragStartRef.current) return;
    dragStartRef.current = null;
    setIsDragging(false);

    if (movedRef.current && pos) {
      try {
        localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(pos));
      } catch {
        // Storage nedostupan — pozicija se ne pamti do idućeg posjeta,
        // bez drugog utjecaja (isti "best effort" duh kao ostatak projekta).
      }
    }
  }

  function handleClick() {
    if (movedRef.current) return; // upravo povučeno, ne otvaraj modal
    if (phase !== "collapsed") return;
    setModalOpen(true);
    setHasOpenedModal(true);
  }

  // "settled" = widget treba biti u konačnom, skupljenom izgledu (malen,
  // chrome vidljiv) — bilo zato što je tranzicija dovršena
  // (phase === "collapsed"), bilo zato što je upravo u tijeku
  // (collapsing). Bez ovog spoja, ruta koja splash uopće ne pokreće (cap
  // već iskorišten → phase ide izravno na "collapsed" bez ikad prolaska
  // kroz beginCollapse/setCollapsing) ostavila bi widget zauvijek u
  // "splash" izgledu (centar, nevidljiv) — stvaran bug otkriven uživo.
  const settled = phase === "collapsed" || collapsing;

  const sizeClasses = settled ? "h-12 w-12" : "h-28 w-28";

  const chromeClasses = settled
    ? "border-line bg-oak border shadow-lg shadow-black/20"
    : "border-transparent bg-transparent";

  const visibilityClasses =
    zoomedIn || settled ? "scale-100 opacity-100" : "scale-0 opacity-0";

  const pulseClass =
    phase === "collapsed" && !hasOpenedModal ? "animate-sponsor-pulse" : "";

  // Tranzicija se isključuje DOK korisnik stvarno povlači widget prstom/
  // mišem — inače bi widget kasnio za pokazivačem umjesto da ga prati
  // 1:1 (transition-all bi animirao prema svakoj novoj točki umjesto
  // trenutačnog pomaka).
  const transitionClasses = isDragging
    ? ""
    : "transition-all duration-700 ease-in-out";

  return (
    <>
      {phase === "active" && (
        <>
          <div
            className={`fixed inset-0 z-[59] bg-white/50 transition-opacity duration-700 ${
              collapsing ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          />
          <button
            type="button"
            onClick={beginCollapse}
            className={`border-night/30 text-night hover:bg-night/10 focus-visible:outline-gold fixed top-4 right-4 z-[61] rounded-full border bg-white/70 px-3 py-1.5 text-xs font-medium transition-opacity duration-700 focus-visible:outline-2 focus-visible:outline-offset-2 ${
              collapsing ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <span aria-hidden="true">✕</span> Preskoči
          </button>
          <p
            className={`text-night fixed left-1/2 top-[calc(50%-3.5rem)] z-[60] -translate-x-1/2 animate-fade-in font-mono text-xs font-bold tracking-[0.2em] uppercase opacity-90 [text-shadow:0_1px_3px_rgba(0,0,0,0.35)] transition-opacity duration-700 ${
              collapsing ? "!opacity-0" : ""
            }`}
          >
            Generalni sponzor
          </p>
        </>
      )}

      <button
        type="button"
        disabled={phase !== "collapsed"}
        aria-hidden={phase !== "collapsed"}
        aria-label={
          phase === "collapsed"
            ? `${sponsor.sponsorName} — otvori ponudu sponzora (povuci za pomicanje)`
            : undefined
        }
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={pos ? { top: `${pos.y}px`, left: `${pos.x}px` } : undefined}
        className={`focus-visible:outline-gold fixed z-[60] flex -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center rounded-full select-none focus-visible:outline-2 focus-visible:outline-offset-2 ${
          phase === "collapsed" ? "cursor-grab active:cursor-grabbing" : ""
        } ${transitionClasses} ${sizeClasses} ${chromeClasses} ${visibilityClasses} ${pulseClass}`}
      >
        <img
          src={sponsor.logoUrl}
          alt={phase === "collapsed" ? "" : sponsor.sponsorName}
          draggable={false}
          className="h-full w-full rounded-full bg-white object-contain p-2"
        />

        {phase === "collapsed" && (
          <span className="bg-night/70 text-parchment-muted pointer-events-none absolute -top-2 -right-2 hidden rounded-full px-1.5 py-0.5 text-[9px] tracking-wide sm:block">
            Oglas
          </span>
        )}
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="border-line bg-oak relative w-full max-w-sm rounded-lg border p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              aria-label="Zatvori"
              className="text-parchment-muted hover:text-parchment focus-visible:outline-gold absolute top-3 right-3 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              ✕
            </button>

            <span className="text-parchment-muted text-[10px] tracking-[0.2em] uppercase">
              Oglas
            </span>

            <div className="mt-3 flex items-center gap-3">
              <img
                src={sponsor.logoUrl}
                alt=""
                className="h-12 w-12 rounded-md bg-white object-contain p-1"
              />
              <h2 className="font-display text-parchment text-lg font-semibold">
                {sponsor.sponsorName}
              </h2>
            </div>

            {sponsor.promoText && (
              <p className="text-parchment-muted mt-3 text-sm">
                {sponsor.promoText}
              </p>
            )}

            <a
              href={sponsor.linkUrl}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="border-gold text-gold hover:bg-gold hover:text-night focus-visible:outline-gold mt-4 inline-flex rounded-md border px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Posjeti stranicu
            </a>
          </div>
        </div>
      )}
    </>
  );
}
