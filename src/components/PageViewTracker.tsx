"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/page-views";

/**
 * Site-wide brojač pregleda (ADR-023) — ne renderira ništa, bilježi
 * pregled kad se stranica stvarno učita u pregledniku (isti "mora biti
 * client + useEffect" razlog kao ViewTracker.tsx: Next.js prefetch se ne
 * izvršava tijekom useEffecta, samo tijekom stvarne navigacije).
 * Isključen na /admin/* — admin navigacija se ne broji u posjete (isti
 * usePathname obrazac kao SponsorWidget).
 */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
