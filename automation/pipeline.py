"""Orkestracija scraper pipelinea (Faza 6-7, ADR-020).

Usage:
    python -m automation.pipeline --source emedjimurje
    python -m automation.pipeline --source emedjimurje --dry-run

n8n (Korak 5) poziva `run()` preko `server.py` HTTP wrappera (HTTP Request
node), ne izravno ovaj CLI — n8n sluzbeni Docker image je "Docker Hardened
Image" bez package managera, pa Python ne moze ziti u ISTOM kontejneru
(vidi automation/deploy/Dockerfile). CLI ostaje za lokalno pokretanje/
debug (`python -m automation.pipeline --source emedjimurje --dry-run`).
"""

import argparse
import re
import unicodedata

from dotenv import load_dotenv

from . import db
from .adapters import ADAPTERS
from .adapters.base import RawEvent
from .dedup import find_fuzzy_duplicate
from .extract import normalize


def slugify(text: str) -> str:
    """Isti obrazac kao src/lib/slug.ts — NFD normalizacija skida
    naglaske, đ/Đ preveden rucno prije toga (NFD ga ne raspada)."""
    text = text.replace("đ", "d").replace("Đ", "d")
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text


def unique_slug(client, base_slug: str) -> str:
    res = (
        client.table("events")
        .select("slug")
        .like("slug", f"{base_slug}%")
        .execute()
    )
    existing = {row["slug"] for row in (res.data or [])}
    if base_slug not in existing:
        return base_slug
    suffix = 2
    while f"{base_slug}-{suffix}" in existing:
        suffix += 1
    return f"{base_slug}-{suffix}"


def run(source: str, dry_run: bool) -> dict:
    if source not in ADAPTERS:
        raise SystemExit(
            f"Nepoznat izvor '{source}'. Dostupno: {', '.join(ADAPTERS)}"
        )

    client = db.get_client()
    scraper_user_id = db.get_scraper_user_id()
    categories = db.get_categories(client)
    locations = db.get_locations(client)
    category_by_slug = {c["slug"]: c["id"] for c in categories}
    location_by_slug = {l["slug"]: l["id"] for l in locations}

    adapter = ADAPTERS[source]()
    raw_events: list[RawEvent] = adapter.fetch_raw_events()
    print(f"[{source}] dohvaceno {len(raw_events)} sirovih zapisa")

    stats = {"inserted": 0, "updated": 0, "skipped_duplicate": 0, "skipped_extraction": 0}

    for raw in raw_events:
        existing = db.find_by_source_url(client, raw.source_url)

        normalized = normalize(raw, categories, locations)
        if not normalized:
            stats["skipped_extraction"] += 1
            print(f"  [preskoceno: ekstrakcija neizvjesna] {raw.title}")
            continue

        category_id = category_by_slug.get(normalized["category_slug"])
        location_id = location_by_slug.get(normalized["location_slug"])
        if not category_id or not location_id:
            stats["skipped_extraction"] += 1
            print(f"  [preskoceno: nepoznat slug] {raw.title}")
            continue

        event = {
            "title": normalized.get("title") or raw.title,
            "description": normalized.get("description"),
            "category_id": category_id,
            "location_id": location_id,
            "venue_name": normalized.get("venue_name"),
            "start_at": normalized["start_at"],
            "end_at": normalized.get("end_at"),
            "source_url": raw.source_url,
            "source_name": raw.source_name,
            "image_url": raw.image_url,
        }

        if existing:
            stats["updated"] += 1
            print(f"  [azuriranje postojeceg (source_url)] {event['title']}")
            if not dry_run:
                db.update_event_by_source_url(client, raw.source_url, event)
            continue

        fuzzy_candidates = db.find_fuzzy_candidates(
            client, location_id, normalized["start_at"]
        )
        duplicate = find_fuzzy_duplicate(event["title"], fuzzy_candidates)
        if duplicate:
            stats["skipped_duplicate"] += 1
            print(
                f"  [preskoceno: vjerojatan duplikat postojeceg '{duplicate['title']}'] {event['title']}"
            )
            continue

        event["slug"] = unique_slug(client, slugify(event["title"]))
        event["status"] = "pending_review"
        event["created_by"] = scraper_user_id

        stats["inserted"] += 1
        print(f"  [novi] {event['title']}")
        if not dry_run:
            db.insert_event(client, event)

    print(f"[{source}] gotovo: {stats}")
    return stats


def main() -> None:
    load_dotenv()
    parser = argparse.ArgumentParser(description="Kam denes scraper pipeline")
    parser.add_argument("--source", required=True, choices=list(ADAPTERS))
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Ispisuje sto bi se dogodilo, bez upisa u bazu.",
    )
    args = parser.parse_args()
    run(args.source, args.dry_run)


if __name__ == "__main__":
    main()
