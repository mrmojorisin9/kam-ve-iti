"""Lokalna JSONL datoteka kao izvor - rucni, povremeni uvoz (korisnikov
zahtjev, 2026-09-23), ne web scraping. Jedan JSON objekt po retku, isti
`RawEvent` oblik kao svaki drugi adapter - prolazi kroz IDENTICNU Claude
ekstrakciju i dedup logiku u pipeline.py, samo bez HTTP dohvata.

Namjerno NIJE u `ADAPTERS` registru (adapters/__init__.py) - ostali adapteri
se grade bez argumenata (`ADAPTERS[source]()`), ovaj treba putanju do
datoteke pa se gradi eksplicitno u pipeline.py kad je zadan `--file`.
"""

import json
from pathlib import Path

from .base import RawEvent, SourceAdapter

REQUIRED_FIELDS = ("title", "date_text", "location_text")


class LocalJsonlAdapter(SourceAdapter):
    source_name = "jsonl"

    def __init__(self, path: str):
        self.path = Path(path)

    def fetch_raw_events(self) -> list[RawEvent]:
        if not self.path.exists():
            raise SystemExit(f"JSONL datoteka ne postoji: {self.path}")

        events: list[RawEvent] = []
        with self.path.open("r", encoding="utf-8") as f:
            for line_no, raw_line in enumerate(f, start=1):
                line = raw_line.strip()
                if not line:
                    continue

                try:
                    obj = json.loads(line)
                except json.JSONDecodeError as exc:
                    raise SystemExit(f"red {line_no}: neispravan JSON ({exc})")

                missing = [k for k in REQUIRED_FIELDS if not obj.get(k)]
                if missing:
                    raise SystemExit(
                        f"red {line_no}: nedostaju obavezna polja: {', '.join(missing)}"
                    )

                # source_url nije obavezan (ne mora postojati vanjski link za
                # rucno pripremljene retke) - ako izostane, gradi se stabilan
                # sintetican identifikator po datoteci+retku. Radi ISPRAVNO
                # za idempotentno ponovno pokretanje ISTE nepromijenjene
                # datoteke (content_hash skip, 0028); ako se redci
                # dodaju/mijenjaju/premjestaju izmedu pokretanja, taj
                # sinteticni URL vise ne prati isti dogadaj pouzdano - za tu
                # upotrebu bolje eksplicitno postaviti "source_url" po retku.
                source_url = obj.get("source_url") or f"jsonl://{self.path.name}#{line_no}"

                events.append(
                    RawEvent(
                        source_name=obj.get("source_name") or self.source_name,
                        source_url=source_url,
                        title=obj["title"],
                        date_text=obj["date_text"],
                        location_text=obj["location_text"],
                        excerpt=obj.get("excerpt"),
                        image_url=obj.get("image_url"),
                        start_date_hint=obj.get("start_date_hint"),
                    )
                )

        return events
