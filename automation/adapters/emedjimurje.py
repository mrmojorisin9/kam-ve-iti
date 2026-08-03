"""Pilot adapter: emedjimurje.net.hr/dogadjaji/lista/ (Faza 6-7, ADR-020).

Server-rendered HTML (WordPress "The Events Calendar" plugin, tribe-events
klase) — potvrdeno uzivim dohvatom stranice (curl) prije pisanja ovog
adaptera, selektori nisu naganjani. Ako izvor promijeni template, ovo je
prvo mjesto za provjeru (`fetch_raw_events` vraca prazno -> selektori vise
ne pogadaju, provjeriti curl na stranicu pa usporediti klase).
"""

import requests
from bs4 import BeautifulSoup

from .base import RawEvent, SourceAdapter

USER_AGENT = (
    "Mozilla/5.0 (compatible; KamDenesBot/1.0; "
    "+https://kamdenes.hr)"
)


class EmedjimurjeAdapter(SourceAdapter):
    source_name = "emedjimurje"
    start_url = "https://emedjimurje.net.hr/dogadjaji/lista/"
    # Sigurnosni strop na paginaciju — sprjecava beskonacnu petlju ako se
    # "sljedeca stranica" selektor pokvari na neocekivan nacin (npr. link
    # koji uvijek vodi na istu stranicu). Lista dogadaja se prirodno
    # zavrsava puno prije ovoga u praksi.
    max_pages = 10

    def fetch_raw_events(self) -> list[RawEvent]:
        events: list[RawEvent] = []
        seen_urls: set[str] = set()
        url: str | None = self.start_url

        for _ in range(self.max_pages):
            if not url:
                break

            response = requests.get(
                url, headers={"User-Agent": USER_AGENT}, timeout=20
            )
            response.raise_for_status()
            # requests ponekad pogresno pogodi kodiranje (npr. ISO-8859-1)
            # kad Content-Type header nema eksplicitan charset — hrvatske
            # dijakritike (č/ć/đ/š/ž) bi se tiho iskvarile bez ovoga.
            response.encoding = "utf-8"
            soup = BeautifulSoup(response.text, "html.parser")

            articles = soup.select("article.tribe-events-calendar-list__event")
            if not articles:
                break

            for article in articles:
                raw = self._parse_article(article)
                if raw and raw.source_url not in seen_urls:
                    seen_urls.add(raw.source_url)
                    events.append(raw)

            next_link = soup.select_one(
                ".tribe-events-c-nav__list-item--next a[href]"
            )
            url = next_link["href"] if next_link else None

        return events

    def _parse_article(self, article) -> RawEvent | None:
        title_link = article.select_one(
            ".tribe-events-calendar-list__event-title-link"
        )
        if not title_link or not title_link.get("href"):
            return None

        title = title_link.get_text(strip=True)
        source_url = title_link["href"]

        datetime_el = article.select_one(
            ".tribe-events-calendar-list__event-datetime"
        )
        date_text = datetime_el.get_text(" ", strip=True) if datetime_el else ""
        start_date_hint = datetime_el.get("datetime") if datetime_el else None

        venue_title_el = article.select_one(
            ".tribe-events-calendar-list__event-venue-title"
        )
        venue_address_el = article.select_one(
            ".tribe-events-calendar-list__event-venue-address"
        )
        location_text = venue_title_el.get_text(strip=True) if venue_title_el else ""
        address_text = (
            venue_address_el.get_text(strip=True) if venue_address_el else ""
        )
        if address_text and address_text != location_text:
            location_text = f"{location_text}, {address_text}".strip(", ")

        description_el = article.select_one(
            ".tribe-events-calendar-list__event-description"
        )
        excerpt = description_el.get_text(strip=True) if description_el else None

        image_el = article.select_one(
            ".tribe-events-calendar-list__event-featured-image"
        )
        image_url = image_el.get("src") if image_el else None

        return RawEvent(
            source_name=self.source_name,
            source_url=source_url,
            title=title,
            date_text=date_text,
            location_text=location_text,
            excerpt=excerpt,
            image_url=image_url,
            start_date_hint=start_date_hint,
        )
