import type { DisplayFrequency } from "@/lib/sponsor";

/**
 * Stranice na kojima full-screen splash smije startati (Faza 2 odluka —
 * korisnikova strategija oko Google "intrusive interstitials"
 * penalizacije). `/dogadjaji/[slug]` (SEO organski promet) i `/admin/*`
 * (isključeno u SponsorWidget preko usePathname) su namjerno izvan ovog
 * popisa — na tim rutama se widget pojavljuje izravno skupljen, bez
 * animacije.
 */
export const LISTING_PATHS = ["/", "/danas", "/sutra", "/vikend", "/pretraga"];

export function isListingPath(pathname: string): boolean {
  return LISTING_PATHS.includes(pathname);
}

const STORAGE_KEY = "kd_sponsor_splash_shown_at";
const SESSION_KEY = "kd_sponsor_splash_shown_session";
const DAY_MS = 24 * 60 * 60 * 1000;

const FREQUENCY_LIMITS: Record<"once_per_day" | "three_per_day", number> = {
  once_per_day: 1,
  three_per_day: 3,
};

/**
 * Smije li se full-screen splash animacija pokrenuti sad, po admin
 * postavci učestalosti. Bilo kakva greška pri pristupu storageu
 * (privatni način rada i sl.) pada na `false` — nemogućnost pamćenja
 * povijesti ne smije rezultirati agresivnijim ponašanjem nego što je
 * admin namjeravao.
 */
export function shouldPlaySplash(frequency: DisplayFrequency): boolean {
  try {
    if (frequency === "every_session") {
      return sessionStorage.getItem(SESSION_KEY) === null;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    const timestamps: number[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const recent = timestamps.filter((t) => now - t < DAY_MS);

    return recent.length < FREQUENCY_LIMITS[frequency];
  } catch {
    return false;
  }
}

/**
 * Bilježi da je splash upravo odgledan (do kraja ILI preskočen — "Preskoči"
 * broji se isto kao odgledano, korisnikova odluka). Poziva se točno
 * jednom, u trenutku prijelaza iz "splash" u "collapsed" stanje.
 */
export function recordSplashPlayed(frequency: DisplayFrequency): void {
  try {
    if (frequency === "every_session") {
      sessionStorage.setItem(SESSION_KEY, "1");
      return;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    const timestamps: number[] = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const recent = timestamps.filter((t) => now - t < DAY_MS);
    recent.push(now);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  } catch {
    // Storage nedostupan — nema se što zabilježiti, tiho ignorirano
    // (isti "best effort" duh kao ostatak projekta).
  }
}
