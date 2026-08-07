"""Adapter: prelog.hr/najave (Faza 6-7, ADR-020 dopuna 2026-08-07).

Grad Prelog sluzbeni portal ("dogadanja-u-gradu/najave/g50") — vlastiti
Abacus Croatia CMS, NE isti WordPress "The Events Calendar" plugin kao
emedjimurje.net.hr/mnovine.hr (`TribeEventsListAdapter`), pa treba poseban
parser. Potvrdeno uzivo (curl) prije pisanja koda: struktura je stabilna,
status bedz (Traje/Uskoro/Zavrseno) po zapisu razlikuje tekuce/nadolazece/
prosle dogadaje. Lista NEMA posebno polje za lokaciju — kao i mnovine.hr,
naslov cesto vec sadrzi mjesto/naselje (npr. "RED RUN FOR CIRKOVLJAN").

Lista NIJE strogo kronoloski sortirana po datumu pocetka dogadaja (mijesa
Traje/Uskoro/Zavrseno prema vremenu OBJAVE, ne datumu dogadaja) — za
razliku od `TribeEventsListAdapter` ne moze se pouzdano rano prekinuti
paginacija usporedbom datuma. Umjesto toga: prva "Zavrseno" stavka na koju
se naide oznacava pocetak arhive (uzivo potvrdeno — druga stranica sadrzi
ISKLJUCIVO "Zavrseno" zapise), pa se dohvat prekida ondje bez daljnje
paginacije.
"""

from datetime import date, datetime, timedelta

import requests
from bs4 import BeautifulSoup

from .base import RawEvent, SourceAdapter

BASE_URL = "https://www.prelog.hr/"
LIST_PATH = "dogadanja-u-gradu/najave/g50"
USER_AGENT = "Mozilla/5.0 (compatible; KamDenesBot/1.0; +https://kamdenes.hr)"


class PrelogAdapter(SourceAdapter):
    source_name = "prelog"

    # Isti razlog kao mnovine.hr max_days_ahead (tribe_events.py) — ne
    # zeli se trositi Claude poziv na dogadaje predaleko u buducnosti.
    max_days_ahead = 30
    # Sigurnosni strop na paginaciju — u praksi se prekida puno prije ovoga
    # (prva "Zavrseno" stavka), vidi docstring modula.
    max_pages = 3

    def fetch_raw_events(self) -> list[RawEvent]:
        events: list[RawEvent] = []
        today = date.today()
        cutoff = today + timedelta(days=self.max_days_ahead)

        for page_num in range(self.max_pages):
            url = f"{BASE_URL}{LIST_PATH}" + (f"?pn={page_num}" if page_num else "")
            response = requests.get(
                url, headers={"User-Agent": USER_AGENT}, timeout=20
            )
            response.raise_for_status()
            # Isti encoding oprez kao tribe_events.py — hrvatske dijakritike
            # se tiho kvare bez eksplicitnog utf-8.
            response.encoding = "utf-8"
            soup = BeautifulSoup(response.text, "html.parser")

            items = soup.select("div.articleList")
            if not items:
                break

            reached_archive = False
            for item in items:
                status_el = item.select_one(".eventNow, .eventSoon, .eventExpired")
                status = status_el.get_text(strip=True) if status_el else ""
                if status == "Završeno":
                    reached_archive = True
                    break

                raw = self._parse_item(item)
                if not raw:
                    continue

                if raw.start_date_hint:
                    try:
                        event_date = date.fromisoformat(raw.start_date_hint)
                    except ValueError:
                        event_date = None
                    if event_date is not None and event_date > cutoff:
                        continue

                events.append(raw)

            if reached_archive:
                break

        return events

    def _parse_item(self, item) -> RawEvent | None:
        title_link = item.select_one("h2.articleTitle a")
        if not title_link or not title_link.get("href"):
            return None

        title = title_link.get_text(strip=True)
        source_url = BASE_URL + title_link["href"].lstrip("/")

        date_spans = item.select("span.listEventDate")
        start_text = date_spans[0].get_text(strip=True) if date_spans else ""
        end_text = (
            date_spans[1].get_text(strip=True).lstrip("-").strip()
            if len(date_spans) > 1
            else ""
        )
        date_text = f"{start_text} - {end_text}" if end_text else start_text

        start_date_hint = None
        if start_text:
            try:
                start_date_hint = datetime.strptime(start_text, "%d.%m.%Y").date().isoformat()
            except ValueError:
                start_date_hint = None

        img_el = item.select_one(".listImage img")
        image_url = (
            BASE_URL + img_el["src"].lstrip("/")
            if img_el and img_el.get("src")
            else None
        )

        return RawEvent(
            source_name=self.source_name,
            source_url=source_url,
            title=title,
            date_text=date_text,
            location_text="",
            excerpt=None,
            image_url=image_url,
            start_date_hint=start_date_hint,
        )
