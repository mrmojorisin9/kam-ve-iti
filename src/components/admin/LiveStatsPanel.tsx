"use client";

import { useEffect, useState } from "react";
import { getTodayPageStats, type TodayPageStats } from "@/lib/page-views";

const POLL_MS = 5000;

/**
 * Auto-osvježavajući brojevi pregleda/posjetitelja za danas (ADR-023) —
 * poll umjesto websocketa/Realtime pretplate, dosljedno ostatku projekta
 * (bez nove infrastrukture, korisnikova odabrana opcija kroz
 * AskUserQuestion). "Posjetitelji" = jedinstveni dnevni hashevi, ne
 * stvaran broj ljudi na stranici ovaj tren.
 */
export function LiveStatsPanel() {
  const [stats, setStats] = useState<TodayPageStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const next = await getTodayPageStats();
      if (!cancelled) setStats(next);
    }

    poll();
    const interval = setInterval(poll, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="border-line flex flex-wrap gap-6 rounded-md border p-4">
      <div>
        <p className="text-parchment-muted text-xs tracking-[0.15em] uppercase">
          Pregleda danas
        </p>
        <p className="text-gold font-display text-2xl font-semibold">
          {stats ? stats.views : "—"}
        </p>
      </div>
      <div>
        <p className="text-parchment-muted text-xs tracking-[0.15em] uppercase">
          Posjetitelja danas
        </p>
        <p className="text-gold font-display text-2xl font-semibold">
          {stats ? stats.visitors : "—"}
        </p>
      </div>
    </div>
  );
}
