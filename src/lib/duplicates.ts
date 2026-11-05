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
 *
 * **Podudaranje riječi (2026-11-05):** naslovi se uz postotak sličnosti
 * uspoređuju i po RIJEČIMA — ako dva naslova dijele barem jednu značajnu
 * riječ, par je mogući duplikat (naravno, i dalje unutar lokacije/24h
 * prozora). Riječi se normaliziraju: bez dijakritika ("Roštilj" = "rostilj"),
 * bez razlike u veličini slova, grubo svedene na osnovu (padeži: "utrka",
 * "utrkom", "utrke"; "predavanje", "predavanja", "PREDAVANJU") te se brojevi
 * izjednačuju s rednim brojevima ("2." = "drugi" = "druga" = "II").
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
  /** Par je kandidat i kad naslovi dijele barem jednu značajnu riječ. */
  matchWords: boolean;
};

export const DEFAULT_DUPLICATE_MATCH_OPTIONS: DuplicateMatchOptions = {
  compareLocation: true,
  compareTime: true,
  titleThreshold: 85,
  matchWords: true,
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
  uskladi_rijeci?: string;
}): DuplicateMatchOptions {
  const compareLocation = params.usporedi_lokaciju !== "0";
  const compareTime = params.usporedi_vrijeme !== "0";
  const matchWords = params.uskladi_rijeci !== "0";
  const parsedThreshold = Number(params.prag_naslova);
  const titleThreshold = VALID_TITLE_THRESHOLDS.includes(
    parsedThreshold as DuplicateTitleThreshold,
  )
    ? (parsedThreshold as DuplicateTitleThreshold)
    : DEFAULT_DUPLICATE_MATCH_OPTIONS.titleThreshold;

  return { compareLocation, compareTime, titleThreshold, matchWords };
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

// ---------------------------------------------------------------------------
// Podudaranje riječi iz naslova
// ---------------------------------------------------------------------------

/** Gramatičke i veznične riječi koje same po sebi ne govore ništa o događaju. */
const STOPWORDS = new Set([
  "i",
  "u",
  "a",
  "o",
  "e",
  "s",
  "k",
  "z",
  "v",
  "na",
  "za",
  "od",
  "do",
  "sa",
  "iz",
  "po",
  "uz",
  "ka",
  "kod",
  "pod",
  "pred",
  "nad",
  "pri",
  "kroz",
  "bez",
  "oko",
  "pa",
  "ni",
  "te",
  "ili",
  "ali",
  "ne",
  "da",
  "se",
  "je",
  "su",
  "bi",
  "li",
  "to",
  "ovo",
  "kao",
  "medju",
  "prije",
  "poslije",
  "the",
  "and",
  "of",
  "in",
  "at",
  "by",
  "for",
  "to",
]);

const ORDINAL_STEMS: [string, string][] = [
  ["prv", "1"],
  ["drug", "2"],
  ["trec", "3"],
  ["cetvrt", "4"],
  ["pet", "5"],
  ["sest", "6"],
  ["sedm", "7"],
  ["osm", "8"],
  ["devet", "9"],
  ["deset", "10"],
];
const ORDINAL_ENDINGS = [
  "i",
  "a",
  "o",
  "e",
  "u",
  "og",
  "oj",
  "om",
  "ih",
  "im",
  "ima",
  "eg",
  "em",
  "ega",
  "emu",
  "oga",
  "omu",
];
/** "drugi", "druga", "drugog"... -> "2" (već bez dijakritika). */
const ORDINAL_WORDS = new Map<string, string>();
for (const [stem, digit] of ORDINAL_STEMS) {
  for (const ending of ORDINAL_ENDINGS) ORDINAL_WORDS.set(stem + ending, digit);
}

const ROMAN_NUMERALS = new Map<string, string>([
  ["II", "2"],
  ["III", "3"],
  ["IV", "4"],
  ["VI", "6"],
  ["VII", "7"],
  ["VIII", "8"],
  ["IX", "9"],
  ["XI", "11"],
  ["XII", "12"],
]);

// Padežni nastavci (dulji prvi), primijenjeni nakon uklanjanja dijakritika.
const SUFFIXES = [
  "ovima",
  "evima",
  "ijem",
  "ama",
  "ima",
  "ega",
  "oga",
  "emu",
  "omu",
  "ome",
  "ove",
  "eve",
  "ovi",
  "evi",
  "om",
  "em",
  "og",
  "eg",
  "im",
  "ih",
  "oj",
  "ju",
  "a",
  "e",
  "i",
  "o",
  "u",
];

function foldDiacritics(word: string): string {
  return word
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "dj")
    .replace(/Đ/g, "dj")
    .toLowerCase();
}

/** Gruba normalizacija na "osnovu" riječi — uklanja padežni nastavak. */
function stemWord(word: string): string {
  if (/^\d+$/.test(word)) return String(Number(word));
  const ordinal = ORDINAL_WORDS.get(word);
  if (ordinal) return ordinal;
  if (word.length < 4) return word;

  let stem = word;
  for (const suffix of SUFFIXES) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 3) {
      stem = word.slice(0, -suffix.length);
      break;
    }
  }
  // Palatalizacija u dativu/lokativu: utrka -> utrci, noga -> nozi.
  return stem.replace(/c$/, "k").replace(/z$/, "g");
}

export type TitleKeyword = { stem: string; word: string };

/** Značajne riječi naslova (osnova + izvorni oblik za prikaz), bez duplikata. */
export function titleKeywords(title: string): TitleKeyword[] {
  const seen = new Set<string>();
  const result: TitleKeyword[] = [];

  for (const rawToken of title.match(/[\p{L}\p{N}]+/gu) ?? []) {
    const roman = ROMAN_NUMERALS.get(rawToken);
    const parts = roman
      ? [roman]
      : (foldDiacritics(rawToken).match(/[a-z]+|\d+/g) ?? []);

    for (const part of parts) {
      if (STOPWORDS.has(part)) continue;
      const isNumber = /^\d+$/.test(part);
      if (!isNumber && part.length < 2) continue;
      // Godina (npr. "2026") je u gotovo svakom naslovu — nije razlikovna.
      if (isNumber && /^(19|20)\d{2}$/.test(part)) continue;

      const stem = stemWord(part);
      if (seen.has(stem)) continue;
      seen.add(stem);
      result.push({ stem, word: rawToken });
    }
  }

  return result;
}

function stemsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (/^\d+$/.test(a) || /^\d+$/.test(b)) return false;

  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  // Zajednički korijen: "festival" ~ "festivali" (razlika najviše 2 znaka).
  if (
    short.length >= 5 &&
    long.startsWith(short) &&
    long.length - short.length <= 2
  ) {
    return true;
  }
  // Tipfeler u dugim riječima (jedno slovo razlike).
  if (short.length >= 7 && long.length - short.length <= 1) {
    return levenshteinDistance(short, long) <= 1;
  }
  return false;
}

function sharedKeywords(a: TitleKeyword[], b: TitleKeyword[]): TitleKeyword[] {
  return a.filter((x) => b.some((y) => stemsMatch(x.stem, y.stem)));
}

/** Dijele li dva naslova barem jednu značajnu riječ (uz padeže, brojeve...). */
export function titlesShareWord(a: string, b: string): boolean {
  return sharedKeywords(titleKeywords(a), titleKeywords(b)).length > 0;
}

/**
 * Riječi (izvorni oblik iz prvog naslova u kojem se pojavljuju) koje dijele
 * barem dva naslova u grupi — za prikaz "zašto su ovi događaji grupirani".
 */
export function groupSharedWords(titles: string[]): string[] {
  const keywords = titles.map(titleKeywords);
  const shared: string[] = [];
  const seenStems: string[] = [];

  keywords.forEach((own, i) => {
    for (const keyword of own) {
      if (seenStems.some((stem) => stemsMatch(stem, keyword.stem))) continue;
      const inOther = keywords.some(
        (other, j) =>
          j !== i && other.some((k) => stemsMatch(k.stem, keyword.stem)),
      );
      if (inOther) {
        seenStems.push(keyword.stem);
        shared.push(keyword.word);
      }
    }
  });

  return shared;
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

  const keywords = options.matchWords
    ? events.map((event) => titleKeywords(event.title))
    : [];

  function titlesMatch(i: number, j: number): boolean {
    if (
      options.matchWords &&
      sharedKeywords(keywords[i], keywords[j]).length > 0
    ) {
      return true;
    }
    return (
      titleSimilarity(events[i].title, events[j].title) >=
      options.titleThreshold
    );
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
        isDuplicate = diffMs === 0 || titlesMatch(i, j);
      } else {
        isDuplicate = titlesMatch(i, j);
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
      (a, b) =>
        new Date(a[0].start_at).getTime() - new Date(b[0].start_at).getTime(),
    );
}
