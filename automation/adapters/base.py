"""Adapter sucelje za izvore dogadaja (Faza 6-7, ADR-020).

Svaki izvor (staticni HTML, RSS, JSON export...) implementira jednu
funkciju koja vraca listu sirovih zapisa — pipeline.py ne zna niti mari
kako je svaki izvor dohvacen, samo ocekuje ovaj oblik na izlazu.
"""

from dataclasses import dataclass


@dataclass
class RawEvent:
    """Sirovi, nenormalizirani zapis dogadaja s izvora, prije Claude
    API ekstrakcije. Sva polja su slobodan tekst kako dolaze s izvora —
    normalizacija (datumi, kategorija, lokacija) je posao `extract.py`.
    """

    source_name: str
    source_url: str
    title: str
    date_text: str
    location_text: str
    excerpt: str | None = None
    image_url: str | None = None
    # ISO datum (bez vremena) iz izvorovog strukturiranog <time datetime="...">
    # atributa, kad postoji — koristi se kao "sidro" u extract.py promptu jer
    # slobodan tekst (npr. "12. lipnja @ 8:00 u 28. kolovoza @ 22:00") cesto
    # nema godinu za krajnji datum.
    start_date_hint: str | None = None


class SourceAdapter:
    """Bazna klasa — svaki adapter override-a `fetch_raw_events`."""

    source_name: str

    def fetch_raw_events(self) -> list[RawEvent]:
        raise NotImplementedError
