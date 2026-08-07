"""Claude API ekstrakcija/kategorizacija (Faza 6-7, ADR-020).

Pretvara jedan `RawEvent` (slobodan tekst s izvora) u normalizirani zapis
spreman za upis u `events` — naslov/opis preuzeti kakvi jesu, datum/vrijeme na ISO 8601
(Europe/Zagreb), kategorija i lokacija mapirane na STVARNE slugove iz baze
(prosljedeni u promptu, model ih ne smije izmisljati).

Vraca None ako model ne moze pouzdano odrediti kategoriju/lokaciju/datum —
pipeline.py takav zapis preskace (ne upisuje pogadanje u bazu), human review
(ADR-002) je sigurnosna mreza za sve sto PROĐE ekstrakciju, ne za popunjavanje
praznina koje AI sam prijavljuje kao neizvjesne.
"""

import json
import os
from datetime import date

import anthropic

from .adapters.base import RawEvent

MODEL = "claude-sonnet-5"

EXTRACT_TOOL = {
    "name": "extract_event",
    "description": "Normalizirani podaci o jednom dogadaju, spremni za upis u bazu.",
    "input_schema": {
        "type": "object",
        "properties": {
            "confident": {
                "type": "boolean",
                "description": (
                    "false ako nedostaje dovoljno informacija za pouzdano "
                    "odredivanje datuma POCETKA ili kategorije ili lokacije — "
                    "u tom slucaju ostala polja mogu biti prazna, event se "
                    "nece upisati u bazu."
                ),
            },
            "title": {"type": "string"},
            "description": {"type": "string"},
            "start_at": {
                "type": "string",
                "description": "ISO 8601 s vremenskom zonom, npr. 2026-06-12T08:00:00+02:00 (Europe/Zagreb).",
            },
            "end_at": {
                "type": ["string", "null"],
                "description": "ISO 8601 ili null ako dogadaj nema naveden zavrsetak.",
            },
            "venue_name": {"type": ["string", "null"]},
            "category_slug": {
                "type": "string",
                "description": "Mora biti TOCNO jedan od ponudenih slugova kategorija.",
            },
            "location_slug": {
                "type": "string",
                "description": "Mora biti TOCNO jedan od ponudenih slugova lokacija.",
            },
        },
        "required": ["confident", "category_slug", "location_slug", "start_at"],
    },
}


def _build_prompt(
    raw: RawEvent, categories: list[dict], locations: list[dict]
) -> str:
    category_list = "\n".join(f"- {c['slug']}: {c['name']}" for c in categories)
    location_list = "\n".join(f"- {l['slug']}: {l['name']}" for l in locations)

    return f"""Izvuci strukturirane podatke o dogadaju iz sljedeceg sirovog
teksta s hrvatskog portala {raw.source_name}. Danasnji datum: {date.today().isoformat()}.

NASLOV: {raw.title}
DATUM/VRIJEME (slobodan tekst): {raw.date_text}
ISO SIDRO za datum pocetka (koristi za godinu ako tekst nema godinu): {raw.start_date_hint or "nepoznato"}
LOKACIJA (slobodan tekst s izvora): {raw.location_text}
OPIS: {raw.excerpt or "(nema)"}

Dostupne kategorije (koristi TOCNO jedan slug):
{category_list}

Dostupne lokacije (koristi TOCNO jedan slug — Medimurska zupanija, grad ili opcina):
{location_list}

Ako datum pocetka, kategorija ili lokacija nisu jasni iz teksta, postavi
confident=false umjesto pogadanja."""


def normalize(
    raw: RawEvent, categories: list[dict], locations: list[dict]
) -> dict | None:
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            tools=[EXTRACT_TOOL],
            tool_choice={"type": "tool", "name": "extract_event"},
            messages=[
                {"role": "user", "content": _build_prompt(raw, categories, locations)}
            ],
        )
    except anthropic.APIError as exc:
        # Jedna neuspjela ekstrakcija ne smije srusiti cijeli pipeline run
        # (uoceno tijekom testiranja: rate limit/timeout na jednom zapisu
        # prekidao je obradu svih preostalih). Pipeline.py ovakav zapis
        # tretira kao "skipped_extraction", isto kao i confident=false.
        print(f"  [greska: Claude API] {raw.title} -- {exc}")
        return None

    tool_use = next(
        (block for block in response.content if block.type == "tool_use"), None
    )
    if not tool_use:
        return None

    result = tool_use.input
    if not result.get("confident"):
        return None

    valid_category_slugs = {c["slug"] for c in categories}
    valid_location_slugs = {l["slug"] for l in locations}
    if (
        result.get("category_slug") not in valid_category_slugs
        or result.get("location_slug") not in valid_location_slugs
        or not result.get("start_at")
    ):
        return None

    return result
