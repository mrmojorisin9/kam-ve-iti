"""Zajednicka logika za izvore koji koriste WordPress "The Events Calendar"
plugin (tribe-events klase) — Faza 6-7, ADR-020.

Potvrdeno uzivo da OVAJ isti plugin/template koriste barem dva neovisna
izvora (emedjimurje.net.hr, mnovine.hr) — identicni CSS selektori na oba,
cak i isti sadrzaj nekih dogadaja (izgleda da dijele regionalnu bazu
dogadaja). Umjesto kopiranja parsing koda po adapteru, svaki konkretan
izvor samo postavlja `source_name`/`start_url` i nasljeduje ovu klasu.
Buduci izvori koji koriste isti plugin (cest u HR lokalnim portalima)
rade isto.
"""

import time
from datetime import date, timedelta

import requests
from bs4 import BeautifulSoup

from .base import RawEvent, SourceAdapter

USER_AGENT = "Mozilla/5.0 (compatible; KamDenesBot/1.0; +https://kamdenes.hr)"
# Pristojna pauza izmedu paginacijskih zahtjeva — otkriveno uzivo da
# mnovine.hr (vjerojatno Cloudflare/WAF) vraca 403 na brze uzastopne
# zahtjeve bez razmaka (potvrdeno: 5 zahtjeva u <1s -> 403, isti zahtjev
# nakon par sekundi pauze -> 200).
PAGE_FETCH_DELAY_SECONDS = 2


class TribeEventsListAdapter(SourceAdapter):
    start_url: str
    # Sigurnosni strop na paginaciju — sprjecava beskonacnu petlju ako se
    # "sljedeca stranica" selektor pokvari na neocekivan nacin (npr. link
    # koji uvijek vodi na istu stranicu). Lista dogadaja se prirodno
    # zavrsava puno prije ovoga u praksi.
    max_pages = 10
    # Opseg (korisnikova odluka, Faza 6-7): samo dogadaji ciji POCETAK pada
    # unutar sljedecih N dana. Otkriveno uzivo na mnovine.hr da lista moze
    # sadrzavati dogadaje/ponude s rasponom od godina (npr. start 2026-07-26,
    # end 2028-07-26) koji nisu korisni za portal fokusiran na "sto se danas/
    # ovaj tjedan dogadja" i nepotrebno produljuju scraping/Claude trosak.
    # None = bez ogranicenja.
    max_days_ahead: int | None = 30

    def fetch_raw_events(self) -> list[RawEvent]:
        events: list[RawEvent] = []
        seen_urls: set[str] = set()
        url: str | None = self.start_url

        today = date.today() if self.max_days_ahead is not None else None
        cutoff = (
            today + timedelta(days=self.max_days_ahead)
            if today is not None
            else None
        )

        for page_num in range(self.max_pages):
            if not url:
                break

            if page_num > 0:
                time.sleep(PAGE_FETCH_DELAY_SECONDS)

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

            # Lista je sortirana po datumu pocetka rastuce — cim jedan
            # dogadaj prijede gornju granicu, svi preostali (na ovoj i
            # sljedecim stranicama) su takoder izvan opsega, sigurno je
            # prekinuti cijeli dohvat ovdje.
            stop_pagination = False

            for article in articles:
                raw = self._parse_article(article)
                if not raw or raw.source_url in seen_urls:
                    continue

                if cutoff is not None and raw.start_date_hint:
                    try:
                        event_date = date.fromisoformat(raw.start_date_hint)
                    except ValueError:
                        event_date = None

                    if event_date is not None:
                        if event_date > cutoff:
                            stop_pagination = True
                            break
                        if event_date < today:
                            # Vec zapoceo prije danas (dugotrajna "stalna
                            # ponuda" tipa dogadaj) — izvan trazenog prozora.
                            continue

                seen_urls.add(raw.source_url)
                events.append(raw)

            if stop_pagination:
                break

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
