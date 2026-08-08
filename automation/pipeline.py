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
import hashlib
import re
import time
import unicodedata

from dotenv import load_dotenv

from . import db
from .adapters import ADAPTERS
from .adapters.base import RawEvent
from .dedup import find_fuzzy_duplicate
from .extract import normalize

# Razmak izmedu uzastopnih Claude API poziva, da eventualni rate limit na
# jednom zapisu ne poveca sanse za isto na sljedecem odmah zatim.
EXTRACT_DELAY_SECONDS = 1

# Sigurnosni strop na broj STVARNIH Claude poziva po pokretanju — sprjecava
# tih runaway trosak ako scraping bug (npr. selektor koji odjednom pogodi
# preveliki dio stranice, ili paginacija koja ne prestaje) odjednom vrati
# puno vise zapisa nego ocekivano. Normalan dnevni run (nakon
# content_hash filtera, 0028) trazi ekstrakciju samo za par novih zapisa;
# prvi run posve novog izvora moze legalno trebati nekoliko desetaka —
# 100 je namjerno iznad tog legalnog slucaja, ne strogi dnevni budzet.
MAX_EXTRACTIONS_PER_RUN = 100


def content_hash(raw: RawEvent) -> str:
    """Fingerprint sirovih polja s izvora, prije Claude ekstrakcije (0028).

    Adapter dohvaca CIJELI vremenski prozor na svakom pokretanju (dnevni
    cron), pa bi isti nepromijenjeni zapis inace dobio Claude ekstrakciju
    iznova svaki dan do vlastitog datuma pocetka. Usporedbom ovog hasha s
    `source_content_hash` vec pohranjenim u bazi, `run()` preskace Claude
    poziv u potpunosti kad se sadrzaj s izvora nije promijenio.
    """
    fields = "\x1e".join(
        [raw.title, raw.date_text, raw.location_text, raw.excerpt or "", raw.image_url or ""]
    )
    return hashlib.sha256(fields.encode("utf-8")).hexdigest()


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

    stats = {
        "inserted": 0,
        "updated": 0,
        "skipped_duplicate": 0,
        "skipped_extraction": 0,
        "skipped_unchanged": 0,
        "stopped_at_cap": False,
    }

    api_calls_made = 0
    for i, raw in enumerate(raw_events):
        existing = db.find_by_source_url(client, raw.source_url)
        raw_hash = content_hash(raw)

        if existing and existing.get("source_content_hash") == raw_hash:
            stats["skipped_unchanged"] += 1
            print(f"  [preskoceno: nepromijenjeno od proslog pokretanja, bez Claude poziva] {raw.title}")
            continue

        if api_calls_made >= MAX_EXTRACTIONS_PER_RUN:
            stats["stopped_at_cap"] = True
            print(
                f"  [STOP: dosegnut sigurnosni strop od {MAX_EXTRACTIONS_PER_RUN} "
                f"Claude poziva u ovom pokretanju — preskacem preostalih "
                f"{len(raw_events) - i} zapisa, provjeri izvor prije sljedeceg runa]"
            )
            break

        if api_calls_made > 0:
            time.sleep(EXTRACT_DELAY_SECONDS)
        normalized = normalize(raw, categories, locations)
        api_calls_made += 1
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
            "source_content_hash": raw_hash,
        }

        if existing:
            stats["updated"] += 1
            admin_edited_fields = existing.get("admin_edited_fields") or []
            skipped_note = (
                f" (preskace {len(admin_edited_fields)} rucno uredenih polja)"
                if admin_edited_fields
                else ""
            )
            print(f"  [azuriranje postojeceg (source_url)]{skipped_note} {event['title']}")
            if not dry_run:
                db.update_event_by_source_url(
                    client, raw.source_url, event, admin_edited_fields
                )
            continue

        fuzzy_candidates = db.find_fuzzy_candidates(
            client, location_id, normalized["start_at"]
        )
        duplicate = find_fuzzy_duplicate(
            event["title"], normalized["start_at"], fuzzy_candidates
        )
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
