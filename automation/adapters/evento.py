"""Adapter: evento.sh javni REST API (Faza 6-7, ADR-020 prosirenje).

Otkriveno uzivo (2026-08-11): evento.sh/ck je React Router SPA, ali
podaci dolaze iz javnog, neautenticiranog REST API-ja
(https://api.evento.sh/api/events) koji u JEDNOM pozivu vraca CIJELI
korpus dogadaja iz svih hrvatskih zupanija (~900 zapisa) — `limit`/
`offset`/`countyCode` query parametri se tiho ignoriraju (testirano
uzivo, uvijek isti puni odgovor), pa se filtriranje na Medimursku
zupaniju (`countyCode == "ck"`) radi lokalno nakon dohvata. Puno cistiji
izvor od HTML scrapinga ostalih adaptera — `dateFrom`/`dateTo` su vec
puni ISO 8601 (s vremenskom zonom), naslov/opis/lokacija vec odvojeni
polja (nema parsanja iz slobodnog HTML teksta).
"""

from datetime import date, datetime, timedelta

import requests

from .base import RawEvent, SourceAdapter

API_URL = "https://api.evento.sh/api/events"
USER_AGENT = "Mozilla/5.0 (compatible; KamDenesBot/1.0; +https://kamdenes.hr)"
COUNTY_CODE = "ck"  # Medimurska zupanija (evento.sh interni kod, vidi /ck rutu)

# Isti obrazac kao TribeEventsListAdapter.max_days_ahead — sprjecava
# nepotreban Claude trosak na dogadaje predaleko u buducnosti za portal
# fokusiran na "sto se danas/ovaj tjedan dogadja".
MAX_DAYS_AHEAD = 30


class EventoAdapter(SourceAdapter):
    source_name = "evento"

    def fetch_raw_events(self) -> list[RawEvent]:
        response = requests.get(
            API_URL, headers={"User-Agent": USER_AGENT}, timeout=20
        )
        response.raise_for_status()
        payload = response.json()

        today = date.today()
        cutoff = today + timedelta(days=MAX_DAYS_AHEAD)

        events: list[RawEvent] = []
        for item in payload.get("data", []):
            if item.get("countyCode") != COUNTY_CODE:
                continue

            title = (item.get("title") or "").strip()
            date_from = item.get("dateFrom")
            share_id = item.get("shareId")
            if not title or not date_from or not share_id:
                continue

            try:
                event_date = datetime.fromisoformat(
                    date_from.replace("Z", "+00:00")
                ).date()
            except ValueError:
                continue

            # Vec zapoceo prije danas (dugotrajna "stalna ponuda") ili
            # predaleko u buducnosti — izvan trazenog prozora.
            if event_date < today or event_date > cutoff:
                continue

            date_to = item.get("dateTo")
            date_text = date_from if not date_to else f"{date_from} - {date_to}"

            hosts = item.get("hosts") or []
            location_text = item.get("locationText") or ""
            if hosts:
                location_text = f"{', '.join(hosts)}, {location_text}".strip(", ")

            events.append(
                RawEvent(
                    source_name=self.source_name,
                    # Vlastita evento.sh stranica dogadaja (shareId), ne
                    # `sourceUrl` iz API-ja (cesto vodi na Facebook event,
                    # ne stabilnu stranicu) — dosljedno ostalim adapterima
                    # koji kao source_url koriste stranicu na kojoj je
                    # dogadaj stvarno naden.
                    source_url=f"https://evento.sh/{COUNTY_CODE}/{share_id}",
                    title=title,
                    date_text=date_text,
                    location_text=location_text,
                    excerpt=item.get("description"),
                    image_url=item.get("imageUrl"),
                    start_date_hint=date_from[:10],
                )
            )

        return events
