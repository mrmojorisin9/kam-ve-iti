/**
 * Otkrivanje mogućih duplikata među ručno uvezenim događajima (CSV uvoz),
 * npr. kad je isti događaj slučajno unesen dva ili tri puta u istoj CSV
 * datoteci ili kroz odvojene uvoze. Isti pristup kao `automation/dedup.py`
 * (Faza 6-7, ADR-020) — samo bez rapidfuzz ovisnosti (Python-only paket)
 * jer ovaj alat radi u TypeScript admin sučelju, ne u scraper pipelineu.
 *
 * Lokacija je tvrdi uvjet (baza kandidata se filtrira po njoj PRIJE
 * ikakve usporedbe naslova/vremena, isto kao `db.find_fuzzy_candidates`
 * u `automation/db.py`):
 * - ista lokacija + istovjetan `start_at` (do minute) je siguran duplikat
 *   neovisno o naslovu;
 * - ista lokacija + prozor od 24h + naslov >= FUZZY_TITLE_THRESHOLD je
 *   vjerojatan duplikat.
 *
 * **Ispravak (2026-08-07):** lokacija je kratko bila popuštena (dopuštala
 * se cross-location usporedba uz viši prag naslova) da uhvati rijedak
 * slučaj "isti događaj prijavljen pod pogrešnom lokacijom" — ali to je u
 * praksi proizvelo lažne pogotke: bez lokacijskog filtra, "istovjetan
 * start_at" sam po sebi nije pouzdan signal (npr. 18 potpuno različitih
 * nogometnih utakmica u različitim mjestima dijeli isti standardni termin
 * kola, "2026-08-15T15:30", i sve bi se pogrešno grupiralo). Vraćeno na
 * tvrdi lokacijski uvjet; rijedak slučaj krive lokacije ostaje na ručnom
 * pregledu admina, ista sigurnosna mreža kao i za sve ostalo (ADR-002).
 */

const CANDIDATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export type DuplicateCandidateEvent = {
  id: string;
  title: string;
  location_id: string;
  start_at: string;
};

export type DuplicateTitleThreshold = 50 | 65 | 85;

export type DuplicateMatchOptions = {
  compareLocation: boolean;
  compareTime: boolean;
  titleThreshold: DuplicateTitleThreshold;
};

export const DEFAULT_DUPLICATE_MATCH_OPTIONS: DuplicateMatchOptions = {
  compareLocation: true,
  compareTime: true,
  titleThreshold: 85,
};

const VALID_TITLE_THRESHOLDS: DuplicateTitleThreshold[] = [50, 65, 85];

/**
 * Parsira/validira sirove searchParams iz `/admin/dogadjaji/duplikati` u
 * `DuplicateMatchOptions`. Nedostajući ili neprepoznat parametar pada nazad
 * na `DEFAULT_DUPLICATE_MATCH_OPTIONS` — gol URL bez parametara mora
 * reproducirati točno prijašnje (tvrdo-kodirano) ponašanje.
 */
export function parseDuplicateMatchOptions(params: {
  usporedi_lokaciju?: string;
  usporedi_vrijeme?: string;
  prag_naslova?: string;
}): DuplicateMatchOptions {
  const compareLocation = params.usporedi_lokaciju !== "0";
  const compareTime = params.usporedi_vrijeme !== "0";
  const parsedThreshold = Number(params.prag_naslova);
  const titleThreshold = VALID_TITLE_THRESHOLDS.includes(
    parsedThreshold as DuplicateTitleThreshold,
  )
    ? (parsedThreshold as DuplicateTitleThreshold)
    : DEFAULT_DUPLICATE_MATCH_OPTIONS.titleThreshold;

  return { compareLocation, compareTime, titleThreshold };
}

function normalizeForCompare(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const distances: number[][] = Array.from({ length: rows }, (_, i) => [
    i,
    ...Array(cols - 1).fill(0),
  ]);
  for (let j = 1; j < cols; j++) distances[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      distances[i][j] = Math.min(
        distances[i - 1][j] + 1,
        distances[i][j - 1] + 1,
        distances[i - 1][j - 1] + cost,
      );
    }
  }

  return distances[rows - 1][cols - 1];
}

/** Postotak sličnosti (0-100) dva naslova, neovisno o redoslijedu riječi. */
export function titleSimilarity(a: string, b: string): number {
  const normA = normalizeForCompare(a);
  const normB = normalizeForCompare(b);
  if (normA === normB) return 100;

  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 100;

  const distance = levenshteinDistance(normA, normB);
  return Math.round((1 - distance / maxLen) * 100);
}

/**
 * Grupira događaje za koje postoji lanac sličnosti (union-find) — hvata i
 * slučaj kad je isti događaj unesen 3 puta, ne samo parove. Vraća samo
 * grupe s 2+ događaja, poredane po datumu prvog događaja u grupi.
 */
export function findDuplicateGroups<T extends DuplicateCandidateEvent>(
  events: T[],
  options: DuplicateMatchOptions = DEFAULT_DUPLICATE_MATCH_OPTIONS,
): T[][] {
  const parent = events.map((_, i) => i);

  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }

  function union(a: number, b: number): void {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent[rootA] = rootB;
  }

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];

      if (options.compareLocation && a.location_id !== b.location_id) continue;

      let isDuplicate: boolean;
      if (options.compareTime) {
        const diffMs = Math.abs(
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
        );
        if (diffMs > CANDIDATE_WINDOW_MS) continue;
        isDuplicate =
          diffMs === 0 ||
          titleSimilarity(a.title, b.title) >= options.titleThreshold;
      } else {
        isDuplicate = titleSimilarity(a.title, b.title) >= options.titleThreshold;
      }

      if (isDuplicate) union(i, j);
    }
  }

  const groups = new Map<number, T[]>();
  events.forEach((event, i) => {
    const root = find(i);
    const group = groups.get(root);
    if (group) {
      group.push(event);
    } else {
      groups.set(root, [event]);
    }
  });

  return [...groups.values()]
    .filter((group) => group.length > 1)
    .sort(
      (a, b) => new Date(a[0].start_at).getTime() - new Date(b[0].start_at).getTime(),
    );
}
