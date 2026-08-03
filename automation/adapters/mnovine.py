"""Adapter: mnovine.hr/dogadjanja/ (Faza 6-7, ADR-020).

Isti WordPress "The Events Calendar" plugin kao emedjimurje.net.hr —
potvrdeno uzivo (identicni tribe-events CSS selektori, cak i preklapajuci
sadrzaj nekih dogadaja) prije pisanja ovog adaptera. Parsing logika je u
`tribe_events.TribeEventsListAdapter`. Za razliku od emedjimurje.net.hr,
ovaj izvor u listi NE prikazuje venue/opis/sliku (uvijek prazno/None) —
naslov cesto vec sadrzi lokaciju u tekstu (npr. "Notorious Festival 2026.,
SRC Trate Nedelisce"), pa extract.py svejedno ima dovoljno signala.
"""

from .tribe_events import TribeEventsListAdapter


class MnovineAdapter(TribeEventsListAdapter):
    source_name = "mnovine"
    start_url = "https://www.mnovine.hr/dogadjanja/"
