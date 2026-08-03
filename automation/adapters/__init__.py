from .base import RawEvent, SourceAdapter
from .emedjimurje import EmedjimurjeAdapter
from .mnovine import MnovineAdapter

ADAPTERS: dict[str, type[SourceAdapter]] = {
    EmedjimurjeAdapter.source_name: EmedjimurjeAdapter,
    MnovineAdapter.source_name: MnovineAdapter,
}

__all__ = [
    "RawEvent",
    "SourceAdapter",
    "EmedjimurjeAdapter",
    "MnovineAdapter",
    "ADAPTERS",
]
