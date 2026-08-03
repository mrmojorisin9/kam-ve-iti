"""Pilot adapter: emedjimurje.net.hr/dogadjaji/lista/ (Faza 6-7, ADR-020).

Server-rendered HTML (WordPress "The Events Calendar" plugin, tribe-events
klase) — potvrdeno uzivim dohvatom stranice (curl) prije pisanja ovog
adaptera, selektori nisu naganjani. Parsing logika je u
`tribe_events.TribeEventsListAdapter` (dijeli je i mnovine.py — isti
plugin). Ako izvor promijeni template, prvo mjesto za provjeru je ondje
(`fetch_raw_events` vraca prazno -> selektori vise ne pogadaju).
"""

from .tribe_events import TribeEventsListAdapter


class EmedjimurjeAdapter(TribeEventsListAdapter):
    source_name = "emedjimurje"
    start_url = "https://emedjimurje.net.hr/dogadjaji/lista/"
