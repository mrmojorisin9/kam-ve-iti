"""Deduplikacija scraped dogadaja (Faza 6-7, ADR-020).

Slojevi: (1) exact match na `source_url` — baza-razine unique constraint
(0024 migracija) vec to garantira, ovdje samo odlucujemo insert vs. upsert;
(2) exact match na `start_at` medu kandidatima iste lokacije — od
2026-10-13 duplikat samo uz gotovo iste naslove ili Claudeovu potvrdu
(vidi dopunu niže); (3) fuzzy match naslova (rapidfuzz) medu kandidatima istog dana/
lokacije; (4) semanticka usporedba (Claude, `extract.is_same_event`) samo za
rijetke sumnjive parove koje (3) ne moze razlikovati.

Sloj (2) dodan nakon sto je uzivo test (mnovine.hr + emedjimurje.net.hr,
Faza 6-7) otkrio pravi duplikat koji je fuzzy title match propustio:
"Notorious Festival 2026." (mnovine) vs. "NOTORIOUS FESTIVAL - Dvodnevni
spektakl elektronicke glazbe" (emedjimurje).

Dopuna 2026-10-13 (zatvoreno "poznato preostalo ogranicenje" iz ADR-020 —
isti par s pocetkom pomaknutim 1 dan):
- usporedba naslova sad ignorira velika/mala slova i interpunkciju
  (`utils.default_process`) — ranije je "NOTORIOUS" vs "Notorious" sam po
  sebi rusio rezultat;
- kandidati s ISTOG izvora (isti `source_name`, razlicit `source_url`) NISU
  duplikati — izvor ih sam vodi kao zasebne zapise (npr. dvije projekcije
  istog filma uzastopnim danima, uocen stvarni primjer "Grad osvete");
- par koji dijeli barem jednu specificnu rijec naslova (ne opcu poput
  "koncert"/"festival"/imena mjesta) ide Claudeu na odluku. Evaluacija na
  341 stvarnom dogadaju: 4 takva para (2 stvarna duplikata, 2 razlicita
  dogadaja) — tekstualna pravila ih nisu mogla razluciti, Claude je
  odlucio tocno 4/4.
"""

import re
from collections.abc import Callable
from datetime import datetime

from rapidfuzz import fuzz, utils

FUZZY_TITLE_THRESHOLD = 85

# Opce rijeci (vrsta dogadaja, mjesta, ustanove) koje same po sebi ne znace
# da je rijec o istom dogadaju — ne racunaju se kao "specificna" zajednicka
# rijec za sloj (4). Bez dijakritike (vidi _distinctive_tokens).
GENERIC_TOKENS = {
    "koncert", "festival", "izlozba", "izlozbe", "radionica", "predstava",
    "dogadaj", "dogadjaj", "otvorenje", "predavanje", "turnir", "utakmica",
    "sajam", "zabava", "party", "vecer", "dani", "program", "edukacija",
    "manifestacija", "susret", "smotra", "cakovec", "cakovcu", "prelog",
    "prelogu", "medjimurje", "medimurje", "medimurski", "medjimurski",
    "gradska", "knjiznica", "centar", "kulturu", "kulture", "dvorana",
    "dvorani", "godine", "film",
}

SameEventJudge = Callable[[dict, dict], bool]


def _parse_instant(value: str) -> datetime | None:
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def _distinctive_tokens(title: str) -> set[str]:
    text = utils.default_process(title).replace("đ", "d").replace("dž", "dz")
    text = re.sub("[čć]", "c", text).replace("š", "s").replace("ž", "z")
    return {
        word
        for word in text.split()
        if len(word) >= 4 and not word.isdigit() and word not in GENERIC_TOKENS
    }


def find_fuzzy_duplicate(
    new_event: dict,
    candidates: list[dict],
    judge: SameEventJudge | None = None,
) -> dict | None:
    """Vraca prvi kandidat koji se smatra duplikatom, ili None.

    `new_event`: {title, start_at, source_name, venue_name?, description?}.
    `candidates` dolazi iz db.find_fuzzy_candidates (vec suzeno na isti
    location_id + datumski prozor +/- 1 dan). `judge` (extract.is_same_event)
    se poziva samo za sumnjive parove; bez njega sloj (4) se preskace.

    Usporedba `start_at` ide preko `datetime.fromisoformat` (ne string
    jednakost) jer baza vraca UTC (+00:00), a Claude ekstrakcija Europe/
    Zagreb offset — ista instanca vremena, razliciti string zapis.
    """
    new_instant = _parse_instant(new_event.get("start_at", ""))
    new_source = new_event.get("source_name")
    new_tokens = _distinctive_tokens(new_event["title"])

    for candidate in candidates:
        candidate_tokens = _distinctive_tokens(candidate["title"])
        shares_word = bool(new_tokens & candidate_tokens)

        candidate_instant = _parse_instant(candidate.get("start_at", ""))
        if (
            new_instant is not None
            and candidate_instant is not None
            and new_instant == candidate_instant
        ):
            # Dopuna 2026-10-13: "ista minuta + ista lokacija" NIJE sam po
            # sebi siguran znak — lokacija je cijeli grad/opcina, pa dva
            # razlicita dogadaja u Cakovcu u 20:00 nisu rijetkost (evaluacija:
            # "Kazaliste, Poco Loco" vs "Moto susret" su bili lazno
            # proglaseni duplikatom; "Dani svetog Jeronima" vs predavanje iz
            # istog programa dijele rijec, a nisu isti zapis). Gotovo isti
            # naslovi = duplikat; inace odlucuje Claude (bez suca — staro
            # ponasanje, duplikat).
            same_minute_score = fuzz.token_sort_ratio(
                new_event["title"], candidate["title"], processor=utils.default_process
            )
            if same_minute_score >= FUZZY_TITLE_THRESHOLD or judge is None:
                return candidate
            if judge(new_event, candidate):
                return candidate
            continue

        if new_source and candidate.get("source_name") == new_source:
            continue

        score = fuzz.token_sort_ratio(
            new_event["title"], candidate["title"], processor=utils.default_process
        )
        if score >= FUZZY_TITLE_THRESHOLD:
            return candidate

        if judge is not None and shares_word and judge(new_event, candidate):
            return candidate
    return None
