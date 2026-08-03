"""Deduplikacija scraped dogadaja (Faza 6-7, ADR-020).

Tri sloja: (1) exact match na `source_url` — baza-razine unique constraint
(0024 migracija) vec to garantira, ovdje samo odlucujemo insert vs. upsert;
(2) exact match na `start_at` medu kandidatima iste lokacije — dva razlicita
stvarna dogadaja na ISTOJ lokaciji koja pocinju u ISTOJ minuti je prakticki
nemoguce, pa se ovo tretira kao siguran duplikat neovisno o slicnosti
naslova; (3) fuzzy match naslova (rapidfuzz) medu kandidatima istog dana/
lokacije — hvata isti dogadaj unesen rucno ili s drugog izvora kad se
naslovi dovoljno razlikuju da (2) ne pogodi.

Sloj (2) dodan nakon sto je uzivo test (mnovine.hr + emedjimurje.net.hr,
Faza 6-7) otkrio pravi duplikat koji je fuzzy title match propustio:
"Notorious Festival 2026." (mnovine) vs. "NOTORIOUS FESTIVAL - Dvodnevni
spektakl elektronicke glazbe" (emedjimurje) — identican start_at i
location_id, ali title score ispod FUZZY_TITLE_THRESHOLD zbog razlicite
duljine/formulacije naslova.
"""

from datetime import datetime

from rapidfuzz import fuzz

FUZZY_TITLE_THRESHOLD = 85


def _parse_instant(value: str) -> datetime | None:
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def find_fuzzy_duplicate(
    candidate_title: str, candidate_start_at: str, candidates: list[dict]
) -> dict | None:
    """Vraca prvi kandidat koji se smatra duplikatom, ili None ako nema
    pogotka. `candidates` dolazi iz db.find_fuzzy_candidates (vec suzeno na
    isti location_id + datumski prozor +/- 1 dan), svaki s `id`/`title`/
    `start_at`.

    Usporedba `start_at` ide preko `datetime.fromisoformat` (ne string
    jednakost) jer baza vraca UTC (+00:00), a Claude ekstrakcija Europe/
    Zagreb offset (+02:00 ljeti) — ista instanca vremena, razliciti string
    zapis; timezone-aware datetime usporedba ispravno prepoznaje jednakost.
    """
    new_instant = _parse_instant(candidate_start_at)

    for candidate in candidates:
        candidate_instant = _parse_instant(candidate.get("start_at", ""))
        if (
            new_instant is not None
            and candidate_instant is not None
            and new_instant == candidate_instant
        ):
            return candidate

        score = fuzz.token_sort_ratio(candidate_title, candidate["title"])
        if score >= FUZZY_TITLE_THRESHOLD:
            return candidate
    return None
