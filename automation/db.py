"""Supabase pristup za automation/ pipeline (Faza 6-7, ADR-020).

Koristi service_role kljuc — namjerno zaobilazi RLS (isti obrazac kao
seed/migracije, ne anon/RLS upisni put poput ADR-016 javne forme). Nikad
ne uvoziti ovaj modul u Next.js aplikaciju (src/) — kljuc je samo za
server-side automation okruzenje.
"""

import os

from supabase import Client, create_client


def get_client() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def get_scraper_user_id() -> str:
    """UUID dedicated 'scraper' Supabase Auth korisnika — MORA biti
    postavljen kao `created_by` za svaki automatizirani insert (vidi
    0024_scraper_source_and_dedup.sql, komentar o rate-limit trigeru).
    """
    return os.environ["SCRAPER_USER_ID"]


def get_categories(client: Client) -> list[dict]:
    """[{id, slug, name}, ...] — prosljeduje se Claude promptu (extract.py)
    da model bira samo medu postojecim slugovima, nikad ne halucinira nove.
    """
    res = client.table("categories").select("id, slug, name").execute()
    return res.data or []


def get_locations(client: Client) -> list[dict]:
    """[{id, slug, name}, ...] — isto obrazlozenje kao get_categories."""
    res = client.table("locations").select("id, slug, name").execute()
    return res.data or []


def find_by_source_url(client: Client, source_url: str) -> dict | None:
    """Postojeci redak s istim source_url (za upsert umjesto insert) —
    oslanja se na `events_source_url_unique` partial unique index.
    Ukljucuje `source_content_hash` da pipeline.py moze preskociti Claude
    ekstrakciju kad se sirovi sadrzaj s izvora nije promijenio (0028).
    Ukljucuje `admin_edited_fields` (0032) da update_event_by_source_url
    zna koja polja NE smije prepisati, bez dodatnog upita."""
    res = (
        client.table("events")
        .select("id, title, status, source_content_hash, admin_edited_fields")
        .eq("source_url", source_url)
        .maybe_single()
        .execute()
    )
    return res.data if res else None


def find_fuzzy_candidates(
    client: Client, location_id: str, start_date_iso: str
) -> list[dict]:
    """Kandidati za fuzzy dedup: isti location_id, start_at unutar +/- 1
    dan od kandidatovog datuma. Fuzzy usporedba naslova radi se u
    dedup.py (rapidfuzz) — ovo samo suzava kandidate na baze-razini prije
    skupljeg tekstualnog uspredivanja.
    """
    from datetime import datetime, timedelta

    day = datetime.fromisoformat(start_date_iso)
    window_start = (day - timedelta(days=1)).isoformat()
    window_end = (day + timedelta(days=1)).isoformat()

    res = (
        client.table("events")
        .select("id, title, start_at")
        .eq("location_id", location_id)
        .gte("start_at", window_start)
        .lte("start_at", window_end)
        .neq("status", "rejected")
        .execute()
    )
    return res.data or []


def insert_event(client: Client, event: dict) -> dict:
    """Insert novog scraped dogadaja. `event` mora vec sadrzavati
    `created_by` = scraper UUID (vidi get_scraper_user_id) i
    `status` = 'pending_review'."""
    res = client.table("events").insert(event).execute()
    return res.data[0] if res.data else {}


def update_event_by_source_url(
    client: Client,
    source_url: str,
    event: dict,
    admin_edited_fields: list[str] | None = None,
) -> dict:
    """Re-scrape istog source_url: azurira postojeci redak umjesto novog
    inserta. Ne dira `status` (admin je mozda vec odobrio/odbio — re-scrape
    ne smije ponistiti ljudsku odluku, samo osvjezava sadrzajna polja).

    Polja s vrijednosti None se NE upisuju preko postojece vrijednosti u
    bazi — sprjecava re-scrape da tiho izbrise rucni admin unos. Otkriveno
    uzivo 2026-08-07: mnovine.hr nikad ne daje sliku u listi (uvijek
    image_url=None), pa je re-scrape prepisao rucno dodanu sliku admina
    natrag na prazno. Isti rizik postoji za description/venue_name/end_at
    kod izvora koji ta polja ne pruzaju.

    `admin_edited_fields` (0032) — polja koja je admin RUCNO izmijenio kroz
    /uredi ili alat za spajanje duplikata (vidi applyEventFormUpdate u
    src/lib/admin-events.ts) se preskacu OVDJE isto, cak i kad scraper vrati
    stvarnu (ne-None) vrijednost — zatvara preostali propust iz ADR-020
    dopune (2026-08-07): prijasnja zastita je stitila samo od None, ne i od
    scraperove drugacije vrijednosti koja bi prepisala rucnu ispravku
    (npr. admin ispravljena kategorija)."""
    skip = set(admin_edited_fields or [])
    event = {
        k: v
        for k, v in event.items()
        if k not in ("status", "created_by") and v is not None and k not in skip
    }
    res = (
        client.table("events")
        .update(event)
        .eq("source_url", source_url)
        .execute()
    )
    return res.data[0] if res.data else {}
