"use client";

import { useEffect, useState } from "react";
import {
  getTodayPageStats,
  getTodayPathStats,
  type TodayPageStats,
} from "@/lib/page-views";

const POLL_MS = 5000;

function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div>
      <p className="text-parchment-muted text-xs tracking-[0.15em] uppercase">
        {label}
      </p>
      <p className="text-gold font-display text-2xl font-semibold">
        {value ?? "—"}
      </p>
    </div>
  );
}

/**
 * Auto-osvježavajući brojevi pregleda/posjetitelja za danas (ADR-023) —
 * poll umjesto websocketa/Realtime pretplate, dosljedno ostatku projekta
 * (bez nove infrastrukture, korisnikova odabrana opcija kroz
 * AskUserQuestion). "Posjetitelji" = jedinstveni dnevni hashevi, ne
 * stvaran broj ljudi na stranici ovaj tren. Drugi red je samostalni PDF
 * uređivač (/pdf) — uključen je i u ukupne brojeve iznad.
 */
export function LiveStatsPanel() {
  const [stats, setStats] = useState<TodayPageStats | null>(null);
  const [pdfStats, setPdfStats] = useState<TodayPageStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const [next, nextPdf] = await Promise.all([
        getTodayPageStats(),
        getTodayPathStats("/pdf"),
      ]);
      if (!cancelled) {
        setStats(next);
        setPdfStats(nextPdf);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="border-line divide-line divide-y rounded-md border">
      <div className="flex flex-wrap gap-6 p-4">
        <Stat label="Pregleda danas" value={stats?.views} />
        <Stat label="Posjetitelja danas" value={stats?.visitors} />
      </div>
      <div className="p-4">
        <p className="text-parchment text-sm font-medium">
          PDF uređivač{" "}
          <a
            href="/pdf"
            target="_blank"
            rel="noopener"
            className="text-parchment-muted hover:text-gold font-normal underline"
          >
            /pdf
          </a>
        </p>
        <div className="mt-2 flex flex-wrap gap-6">
          <Stat label="Pregleda danas" value={pdfStats?.views} />
          <Stat label="Posjetitelja danas" value={pdfStats?.visitors} />
        </div>
      </div>
    </div>
  );
}
