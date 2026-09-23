from .base import RawEvent, SourceAdapter
from .emedjimurje import EmedjimurjeAdapter
from .eventinfo import EventinfoAdapter
from .evento import EventoAdapter
from .mnovine import MnovineAdapter
from .prelog import PrelogAdapter

ADAPTERS: dict[str, type[SourceAdapter]] = {
    EmedjimurjeAdapter.source_name: EmedjimurjeAdapter,
    MnovineAdapter.source_name: MnovineAdapter,
    PrelogAdapter.source_name: PrelogAdapter,
    EventoAdapter.source_name: EventoAdapter,
    EventinfoAdapter.source_name: EventinfoAdapter,
}

__all__ = [
    "RawEvent",
    "SourceAdapter",
    "EmedjimurjeAdapter",
    "MnovineAdapter",
    "PrelogAdapter",
    "EventoAdapter",
    "EventinfoAdapter",
    "ADAPTERS",
]
