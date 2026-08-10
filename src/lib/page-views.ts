"use server";

import { createHash } from "crypto";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { todayInZagreb, zagrebLocalToUtcIso } from "@/lib/zagreb-time";

/**
 * Dnevno-rotirajući anonimni "posjetitelj" hash (ADR-023) — IP+User-Agent
 * se pretvaraju u jednosmjeran hash sa solju koja se mijenja svaki dan
 * (Europe/Zagreb ponoć). Ništa se ne sprema na klijentu (nema kolačića/
 * localStoragea), a hash se ne može povezati unatrag sa stvarnom osobom
 * niti pratiti kroz dane — namjerno, da se izbjegne cookie consent banner
 * (ePrivacy okidač je "pristup terminalnoj opremi korisnika", ne
 * server-side obrada IP-a). VISITOR_HASH_SECRET nikad ne napušta server.
 */
function hashVisitor(ip: string, userAgent: string): string {
  const dailySalt = createHash("sha256")
    .update(`${process.env.VISITOR_HASH_SECRET}:${todayInZagreb()}`)
    .digest("hex");

  return createHash("sha256")
    .update(`${dailySalt}:${ip}:${userAgent}`)
    .digest("hex");
}

/**
 * Bilježi anonimni pregled stranice (site-wide, ADR-023) — poziva se
 * isključivo iz klijentske komponente (PageViewTracker) preko useEffect,
 * isti razlog kao trackEventView u interactions.ts: Next.js prefetch bi
 * inače lažno napuhao brojač i prije stvarnog posjeta.
 */
export async function trackPageView(path: string): Promise<void> {
  const headerList = await headers();
  const ip = (headerList.get("x-forwarded-for") ?? "unknown")
    .split(",")[0]
    .trim();
  const userAgent = headerList.get("user-agent") ?? "unknown";

  const supabase = await createClient();
  const { error } = await supabase.from("page_views").insert({
    path,
    visitor_hash: hashVisitor(ip, userAgent),
  });

  if (error) {
    console.error("trackPageView:", error.message);
  }
}

export type TodayPageStats = { views: number; visitors: number };

/** Admin-only — poziva se iz /admin nadzorne ploče (LiveStatsPanel). */
export async function getTodayPageStats(): Promise<TodayPageStats> {
  const supabase = await createClient();
  const dayStart = zagrebLocalToUtcIso(`${todayInZagreb()}T00:00`);

  const { data, error } = await supabase
    .rpc("get_today_page_stats", { day_start: dayStart })
    .single();

  if (error || !data) {
    if (error) console.error("getTodayPageStats:", error.message);
    return { views: 0, visitors: 0 };
  }

  return {
    views: Number((data as { views: number }).views),
    visitors: Number((data as { visitors: number }).visitors),
  };
}
