"""Deduplikacija scraped dogadaja (Faza 6-7, ADR-020).

Dva sloja: (1) exact match na `source_url` — baza-razine unique constraint
(0024 migracija) vec to garantira, ovdje samo odlucujemo insert vs. upsert;
(2) fuzzy match naslova medu kandidatima istog dana/lokacije — hvata isti
dogadaj unesen rucno ili s drugog izvora, sto source_url ne moze pokriti.
"""

from rapidfuzz import fuzz

FUZZY_TITLE_THRESHOLD = 85


def find_fuzzy_duplicate(
    candidate_title: str, candidates: list[dict]
) -> dict | None:
    """Vraca prvi kandidat ciji je naslov dovoljno slican (>= threshold),
    ili None ako nema pogotka. `candidates` dolazi iz
    db.find_fuzzy_candidates (vec suzeno na isti location_id + datumski
    prozor +/- 1 dan)."""
    for candidate in candidates:
        score = fuzz.token_sort_ratio(candidate_title, candidate["title"])
        if score >= FUZZY_TITLE_THRESHOLD:
            return candidate
    return None
