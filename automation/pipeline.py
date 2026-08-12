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
import csv
import hashlib
import re
import sys
import time
import unicodedata
from datetime import datetime
from pathlib import Path

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

# CSV izvoz (korisnikov zahtjev, 2026-08-12) — opcionalan, uz postojeci upis
# u Supabase, ne umjesto njega. Pregledna lista SVIH obradenih sirovih
# zapisa iz ovog pokretanja (ne samo novih), bez obzira na ishod, da se
# jednim pogledom u Excelu vidi sto je scraper tog dana zatekao.
EXPORTS_DIR = Path(__file__).resolve().parent / "exports"
CSV_FIELDNAMES = [
    "status",
    "naslov",
    "kategorija",
    "lokacija",
    "mjesto_odrzavanja",
    "pocetak",
    "kraj",
    "izvor",
    "izvor_url",
    "napomena",
]


def default_export_path(source: str) -> Path:
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return EXPORTS_DIR / f"{source}_{stamp}.csv"


def _csv_row(
    raw: RawEvent,
    status: str,
    *,
    naslov: str | None = None,
    kategorija: str = "",
    lokacija: str = "",
    mjesto: str = "",
    pocetak: str = "",
    kraj: str = "",
    napomena: str = "",
) -> dict:
    """Jedan red CSV izvoza. Prima najbolje dostupne podatke u trenutku
    poziva — za zapise koji nisu prosli (punu) ekstrakciju to su sirova
    polja s izvora (raw.date_text/location_text), ne normalizirani podaci,
    da se izbjegne dodatni Claude poziv samo radi izvjestaja."""
    return {
        "status": status,
        "naslov": naslov or raw.title,
        "kategorija": kategorija,
        "lokacija": lokacija,
        "mjesto_odrzavanja": mjesto,
        "pocetak": pocetak,
        "kraj": kraj,
        "izvor": raw.source_name,
        "izvor_url": raw.source_url,
        "napomena": napomena,
    }


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


def run(source: str, dry_run: bool, export_csv: str | None = None) -> dict:
    """`export_csv`: None = bez izvoza (zadano). Prazan string = izvezi na
    automatski generiranu putanju u `automation/exports/`. Bilo koja druga
    vrijednost = izvezi na tu tocnu putanju. Ne utjece na dry_run/upis u
    Supabase — oba se mogu kombinirati neovisno."""
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
    category_name_by_id = {c["id"]: c["name"] for c in categories}
    location_name_by_id = {l["id"]: l["name"] for l in locations}
    export_rows: list[dict] = []

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
            if export_csv is not None:
                export_rows.append(
                    _csv_row(
                        raw,
                        "nepromijenjeno (preskoceno)",
                        lokacija=raw.location_text,
                        pocetak=raw.date_text,
                        napomena="isti sadrzaj kao prosli put, ekstrakcija preskocena radi troska — prikazana su sirova polja s izvora, ne normalizirana",
                    )
                )
            continue

        if api_calls_made >= MAX_EXTRACTIONS_PER_RUN:
            stats["stopped_at_cap"] = True
            print(
                f"  [STOP: dosegnut sigurnosni strop od {MAX_EXTRACTIONS_PER_RUN} "
                f"Claude poziva u ovom pokretanju — preskacem preostalih "
                f"{len(raw_events) - i} zapisa, provjeri izvor prije sljedeceg runa]"
            )
            if export_csv is not None:
                for remaining in raw_events[i:]:
                    export_rows.append(
                        _csv_row(
                            remaining,
                            "nije obradeno (dosegnut sigurnosni strop)",
                            lokacija=remaining.location_text,
                            pocetak=remaining.date_text,
                        )
                    )
            break

        if api_calls_made > 0:
            time.sleep(EXTRACT_DELAY_SECONDS)
        normalized = normalize(raw, categories, locations)
        api_calls_made += 1
        if not normalized:
            stats["skipped_extraction"] += 1
            print(f"  [preskoceno: ekstrakcija neizvjesna] {raw.title}")
            if export_csv is not None:
                export_rows.append(
                    _csv_row(
                        raw,
                        "ekstrakcija neuspjela",
                        lokacija=raw.location_text,
                        pocetak=raw.date_text,
                        napomena="Claude ekstrakcija nije vratila dovoljno pouzdan rezultat",
                    )
                )
            continue

        category_id = category_by_slug.get(normalized["category_slug"])
        location_id = location_by_slug.get(normalized["location_slug"])
        if not category_id or not location_id:
            stats["skipped_extraction"] += 1
            print(f"  [preskoceno: nepoznat slug] {raw.title}")
            if export_csv is not None:
                export_rows.append(
                    _csv_row(
                        raw,
                        "ekstrakcija neuspjela",
                        lokacija=raw.location_text,
                        pocetak=raw.date_text,
                        napomena=f"nepoznat slug kategorije/lokacije iz ekstrakcije ({normalized['category_slug']!r}/{normalized['location_slug']!r})",
                    )
                )
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
            if export_csv is not None:
                export_rows.append(
                    _csv_row(
                        raw,
                        "azurirano (postojeci)",
                        naslov=event["title"],
                        kategorija=category_name_by_id.get(category_id, ""),
                        lokacija=location_name_by_id.get(location_id, ""),
                        mjesto=event.get("venue_name") or "",
                        pocetak=event["start_at"],
                        kraj=event.get("end_at") or "",
                        napomena=skipped_note.strip(" ()"),
                    )
                )
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
            if export_csv is not None:
                export_rows.append(
                    _csv_row(
                        raw,
                        "preskoceno (vjerojatan duplikat)",
                        naslov=event["title"],
                        kategorija=category_name_by_id.get(category_id, ""),
                        lokacija=location_name_by_id.get(location_id, ""),
                        mjesto=event.get("venue_name") or "",
                        pocetak=event["start_at"],
                        kraj=event.get("end_at") or "",
                        napomena=f"podudara se s postojecim: {duplicate['title']}",
                    )
                )
            continue

        event["slug"] = unique_slug(client, slugify(event["title"]))
        event["status"] = "pending_review"
        event["created_by"] = scraper_user_id

        stats["inserted"] += 1
        print(f"  [novi] {event['title']}")
        if export_csv is not None:
            export_rows.append(
                _csv_row(
                    raw,
                    "nov",
                    naslov=event["title"],
                    kategorija=category_name_by_id.get(category_id, ""),
                    lokacija=location_name_by_id.get(location_id, ""),
                    mjesto=event.get("venue_name") or "",
                    pocetak=event["start_at"],
                    kraj=event.get("end_at") or "",
                )
            )
        if not dry_run:
            db.insert_event(client, event)

    if export_csv is not None:
        export_path = Path(export_csv) if export_csv else default_export_path(source)
        export_path.parent.mkdir(parents=True, exist_ok=True)
        with export_path.open("w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=CSV_FIELDNAMES)
            writer.writeheader()
            writer.writerows(export_rows)
        stats["export_csv_path"] = str(export_path)
        print(f"[{source}] CSV izvoz: {export_path} ({len(export_rows)} redaka)")

    print(f"[{source}] gotovo: {stats}")
    return stats


def main() -> None:
    # Windows konzola defaultira na lokalnu OS kodnu stranicu (npr. cp1250),
    # ne UTF-8 — otkriveno uzivo (2026-08-11): evento.sh naslov s emoji-jem
    # ("🎸 PSIHOMODO POP") srusio je citav run na obicnom print()-u, na pola
    # obrade izvora. Docker kontejner (Linux) ovo ne pogadja, ali CLI (ovaj
    # main()) je bas za lokalno pokretanje, pa treba biti otporan i ovdje.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    load_dotenv()
    parser = argparse.ArgumentParser(description="Kam denes scraper pipeline")
    parser.add_argument("--source", required=True, choices=list(ADAPTERS))
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Ispisuje sto bi se dogodilo, bez upisa u bazu.",
    )
    parser.add_argument(
        "--export-csv",
        nargs="?",
        const="",
        default=None,
        metavar="PUTANJA",
        help=(
            "Uz upis u bazu (radi i s --dry-run), izvozi pregledan popis "
            "SVIH obradenih zapisa iz ovog pokretanja u CSV. Bez vrijednosti "
            "sprema automatski u automation/exports/<izvor>_<vrijeme>.csv; "
            "s vrijednoscu sprema na zadanu putanju."
        ),
    )
    args = parser.parse_args()
    run(args.source, args.dry_run, export_csv=args.export_csv)


if __name__ == "__main__":
    main()
