from .base import RawEvent, SourceAdapter
from .emedjimurje import EmedjimurjeAdapter
from .mnovine import MnovineAdapter
from .prelog import PrelogAdapter

ADAPTERS: dict[str, type[SourceAdapter]] = {
    EmedjimurjeAdapter.source_name: EmedjimurjeAdapter,
    MnovineAdapter.source_name: MnovineAdapter,
    PrelogAdapter.source_name: PrelogAdapter,
}

__all__ = [
    "RawEvent",
    "SourceAdapter",
    "EmedjimurjeAdapter",
    "MnovineAdapter",
    "PrelogAdapter",
    "ADAPTERS",
]
