import type { FilterOption } from "@/lib/events";

/**
 * Grupiranje 132 lokacije (grad/općina/naselje, flat lista bez parent_id —
 * vidi CHANGELOG Faza 8 Dan 24) u 4 mikro-regije za Razinu 2 filtera.
 * Naselje nasljeđuje regiju svog grada/općine. Podjelu je potvrdio
 * korisnik ručno (poznaje teren), ne geografska heuristika.
 */
export const REGIONS: FilterOption[] = [
  { slug: "cakovec-i-okolica", name: "Čakovec & Okolica" },
  { slug: "gornje-medimurje", name: "Gornje Međimurje" },
  { slug: "mursko-sredisce-i-uz-muru", name: "Mursko Središće & Uz Muru" },
  { slug: "donje-medimurje-i-prelog", name: "Donje Međimurje & Prelog" },
];

const REGION_LOCATIONS: Record<string, string[]> = {
  "cakovec-i-okolica": [
    // Grad Čakovec
    "cakovec",
    "ivanovec",
    "kristanovec",
    "kursanec",
    "mackovec",
    "mihovljan",
    "novo-selo-na-dravi",
    "novo-selo-rok",
    "savska-ves",
    "slemenice",
    "sandorovec",
    "stefanec",
    "totovec",
    "ziskovec",
    // Općina Nedelišće
    "nedelisce",
    "crecan",
    "dunjkovec",
    "gornji-hrascan",
    "gornji-kursanec",
    "macinec",
    "parag",
    "pretetinec",
    "puscine",
    "slakovec",
    "trnovec",
    // Općina Strahoninec
    "strahoninec",
    // Općina Šenkovec
    "senkovec",
    "knezovec",
    // Općina Pribislavec
    "pribislavec",
  ],
  "gornje-medimurje": [
    // Općina Gornji Mihaljevec
    "gornji-mihaljevec",
    "badlican",
    "bogdanovec",
    "dragoslavec-breg",
    "dragoslavec-selo",
    "gornja-dubrava",
    "martinusevec",
    "preseka",
    "prhovec",
    "tupkovec",
    "vugrisinec",
    "vukanovec",
    // Općina Štrigova
    "strigova",
    "banfi",
    "grabrovnik",
    "jalsovec",
    "leskovec",
    "prekopa",
    "robadje",
    "stanetinec",
    "sveti-urban",
    "zelezna-gora",
    // Općina Sveti Martin na Muri
    "sveti-martin-na-muri",
    "brezovec",
    "cestijanec",
    "gornji-koncovcak",
    "gradiscak",
    "grkavescak",
    "jurovcak",
    "jurovec",
    "kapelscak",
    "lapsina",
    "marof",
    "toplice-sveti-martin",
    "vrhovljan",
    "zabnik",
    // Općina Sveti Juraj na Bregu
    "sveti-juraj-na-bregu",
    "brezje",
    "dragoslavec",
    "frkanovec",
    "lopatinec",
    "mali-mihaljevec",
    "okrugli-vrh",
    "pleskovec",
    "vucetinec",
    "zasadbreg",
    // Općina Selnica
    "selnica",
    "bukovec",
    "donji-koncovcak",
    "donji-zebanec",
    "gornji-zebanec",
    "merhatovec",
    "plesivica",
    "praporcan",
    "zavescak",
    "zebanec-selo",
  ],
  "mursko-sredisce-i-uz-muru": [
    // Grad Mursko Središće
    "mursko-sredisce",
    "hlapicina",
    "krizovec",
    "peklenica",
    "strukovec",
    // Općina Vratišinec
    "vratisinec",
    "gornji-kraljevec",
    // Općina Podturen
    "podturen",
    "celine",
    "ferketinec",
    "miklavec",
    "novakovec",
    "sivica",
  ],
  "donje-medimurje-i-prelog": [
    // Grad Prelog
    "prelog",
    "cirkovljan",
    "cehovec",
    "cukovec",
    "draskovec",
    "hemusevec",
    "oporovec",
    "otok",
    // Općina Belica
    "belica",
    "gardinovec",
    // Općina Dekanovec
    "dekanovec",
    // Općina Domašinec
    "domasinec",
    "turcisce",
    // Općina Donja Dubrava
    "donja-dubrava",
    // Općina Donji Kraljevec
    "donji-kraljevec",
    "donji-hrascan",
    "donji-pustakovec",
    "hodosan",
    "palinovec",
    "sveti-juraj-u-trnju",
    // Općina Donji Vidovec
    "donji-vidovec",
    // Općina Goričan
    "gorican",
    // Općina Kotoriba
    "kotoriba",
    // Općina Mala Subotica
    "mala-subotica",
    "drzimurec",
    "palovec",
    "piskorovec",
    "strelec",
    "sveti-kriz",
    // Općina Orehovica
    "orehovica",
    "podbrest",
    "vularija",
    // Općina Sveta Marija
    "sveta-marija",
    "donji-mihaljevec",
  ],
};

/** location_slug -> region_slug, izvedeno iz REGION_LOCATIONS (132 unosa). */
export const LOCATION_TO_REGION: Record<string, string> = Object.fromEntries(
  Object.entries(REGION_LOCATIONS).flatMap(([regionSlug, locationSlugs]) =>
    locationSlugs.map((locationSlug) => [locationSlug, regionSlug]),
  ),
);

/** Slugovi svih lokacija unutar zadane regije (za filtriranje u events.ts). */
export function locationSlugsForRegion(regionSlug: string): string[] {
  return REGION_LOCATIONS[regionSlug] ?? [];
}
