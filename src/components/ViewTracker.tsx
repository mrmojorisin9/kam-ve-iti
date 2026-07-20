"use client";

import { useEffect } from "react";
import { trackEventView } from "@/lib/interactions";

/**
 * Ne renderira ništa — samo bilježi pregled kad se stranica stvarno
 * učita u pregledniku (useEffect se ne izvršava tijekom Next.js
 * prefetcha, samo tijekom stvarne navigacije, vidi interactions.ts).
 */
export function ViewTracker({ eventId }: { eventId: string }) {
  useEffect(() => {
    trackEventView(eventId);
  }, [eventId]);

  return null;
}
