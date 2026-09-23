"""Adapter: eventinfo.com.hr JSON API (Faza 6-7, korisnikov zahtjev 2026-09-23).

eventinfo.com.hr je namjenski kalendar ISKLJUČIVO za Međimursku županiju
("Zbivanja u Međimurju") — za razliku od evento.sh, nema potrebe za
filtriranjem po županiji. Vlastita PHP stranica (ne WordPress/tribe-events
kao ostali adapteri), ali iza `fullcalendar.js` widgeta stoji čist,
neautenticiran JSON endpoint otkriven uživo (mrežna inspekcija):

    https://eventinfo.com.hr/framework/getListOfResults.php?s=dogadajiSvi

Vraća SVE trenutno nadolazeće događaje odjednom (20 u trenutku analize —
potvrđeno uživo da to NIJE umjetni stranični strop nego stvaran ukupan
broj: zbroj po-kategorijskih poziva `?k=kategorijaDogadaji&id=N` daje isti
ukupan broj). `page`/`offset`/`limit` query parametri se tiho ignoriraju
(isti obrazac kao evento.sh). Bogatiji od većine ostalih izvora — uključuje
punu adresu i koordinate (lat/long), ne samo naziv mjesta.

Poznata svojstva izvora:
- `vrijeme` polje sadrži "01:23" kao dosljednu oznaku "vrijeme nije
  navedeno" (potvrđeno uživo — pojavljuje se isključivo kod višednevnih
  izložbi/festivala, jednodnevni događaji imaju stvaran termin).
- `naslov`/`opis`/`mjesto` sadrže HTML entitete (npr. "&amp;", "&quot;") —
  potrebno `html.unescape()`.
- Stvarno preklapanje s evento.sh (isti događaji, npr. "Croatia Classic
  Tourist Trophy Rally") — očekivano, postojeći fuzzy dedup (dedup.py) to
  hvata neovisno o izvoru.
"""

import html
from datetime import date, datetime, timedelta

import requests

from .base import RawEvent, SourceAdapter

API_URL = "https://eventinfo.com.hr/framework/getListOfResults.php?s=dogadajiSvi"
USER_AGENT = "Mozilla/5.0 (compatible; KamDenesBot/1.0; +https://kamdenes.hr)"
IMAGE_BASE_URL = "https://eventinfo.com.hr/admin/slike_dogadaji/mala/"
EVENT_PAGE_BASE_URL = "https://eventinfo.com.hr/dogadaj/"

# "Vrijeme nije navedeno" sentinel — vidi napomenu u docstringu iznad.
NO_TIME_SENTINEL = "01:23"

# Isti obrazac kao TribeEventsListAdapter.max_days_ahead/evento.py
# MAX_DAYS_AHEAD — sigurnosna ograda, ne stroga potreba (izvor trenutno
# ionako ima samo ~20 stavki), ali sprjecava neocekivan trosak ako izvor
# jednog dana poceo vracati puno vise/dalje u buducnost.
MAX_DAYS_AHEAD = 60


def _parse_croatian_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return datetime.strptime(value.strip(), "%d.%m.%Y").date()
    except ValueError:
        return None


class EventinfoAdapter(SourceAdapter):
    source_name = "eventinfo"

    def fetch_raw_events(self) -> list[RawEvent]:
        response = requests.get(
            API_URL, headers={"User-Agent": USER_AGENT}, timeout=20
        )
        response.raise_for_status()
        payload = response.json()

        today = date.today()
        cutoff = today + timedelta(days=MAX_DAYS_AHEAD)

        events: list[RawEvent] = []
        for item in payload:
            title = html.unescape((item.get("naslov") or "").strip())
            slug = item.get("slug")
            pocetak = _parse_croatian_date(item.get("pocetak"))
            if not title or not slug or not pocetak:
                continue

            if pocetak < today or pocetak > cutoff:
                continue

            vrijeme = (item.get("vrijeme") or "").strip()
            has_time = bool(vrijeme) and vrijeme != NO_TIME_SENTINEL

            date_text = pocetak.strftime("%d.%m.%Y")
            if has_time:
                date_text += f" u {vrijeme}"

            zavrsetak = _parse_croatian_date(item.get("zavrsetak"))
            if zavrsetak and zavrsetak != pocetak:
                date_text += f" - {zavrsetak.strftime('%d.%m.%Y')}"

            mjesto = html.unescape((item.get("mjesto") or "").strip())
            adresa = html.unescape((item.get("adresa") or "").strip())
            if mjesto and adresa:
                location_text = f"{mjesto}, {adresa}"
            else:
                location_text = mjesto or adresa

            slika = item.get("slika")
            image_url = f"{IMAGE_BASE_URL}{slika}" if slika else None

            opis = item.get("opis")
            excerpt = html.unescape(opis.strip()) if opis else None

            events.append(
                RawEvent(
                    source_name=self.source_name,
                    source_url=f"{EVENT_PAGE_BASE_URL}{slug}",
                    title=title,
                    date_text=date_text,
                    location_text=location_text,
                    excerpt=excerpt,
                    image_url=image_url,
                    start_date_hint=pocetak.isoformat(),
                )
            )

        return events
