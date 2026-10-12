"use client";

import { useEffect } from "react";

const SCROLL_KEY = "kd_admin_list_scroll_y";
const HIGHLIGHT_MS = 2500;

/**
 * Povratak na isto mjesto u `/admin/dogadjaji` nakon uređivanja (korisnikov
 * zahtjev, 2026-10-12). Dvije stvari:
 *  1. Klik na "Uredi" (`data-edit-link`) pamti trenutni scroll u
 *     sessionStorage.
 *  2. Kad se popis učita s `?fokus=<id>` (redirect nakon spremanja), skrolaj
 *     do tog retka (`#dogadjaj-<id>`) i kratko ga istakni. Ako red više nije
 *     na popisu (npr. status promijenjen pa ispao s taba "Na čekanju"),
 *     vrati zapamćeni scroll.
 * useEffect se izvršava nakon Next.js-ovog "scroll to top" pri navigaciji,
 * pa ga ne prepisuje.
 */
export function ScrollToEvent({ focusId }: { focusId?: string }) {
  useEffect(() => {
    function rememberScroll(e: MouseEvent) {
      const link = (e.target as Element | null)?.closest("[data-edit-link]");
      if (!link) return;
      try {
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      } catch {
        // storage nedostupan — povratak ide samo preko #dogadjaj-<id>
      }
    }
    document.addEventListener("click", rememberScroll);
    return () => document.removeEventListener("click", rememberScroll);
  }, []);

  useEffect(() => {
    if (!focusId) return;

    const row = document.getElementById(`dogadjaj-${focusId}`);
    if (row) {
      row.scrollIntoView({ block: "center" });
      row.classList.add("admin-row-focus");
      const timer = setTimeout(
        () => row.classList.remove("admin-row-focus"),
        HIGHLIGHT_MS,
      );
      return () => clearTimeout(timer);
    }

    try {
      const saved = Number(sessionStorage.getItem(SCROLL_KEY));
      if (saved > 0) window.scrollTo(0, saved);
    } catch {
      // nema zapamćene pozicije — ostaje na vrhu
    }
  }, [focusId]);

  return null;
}
