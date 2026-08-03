from .base import RawEvent, SourceAdapter
from .emedjimurje import EmedjimurjeAdapter

ADAPTERS: dict[str, type[SourceAdapter]] = {
    EmedjimurjeAdapter.source_name: EmedjimurjeAdapter,
}

__all__ = ["RawEvent", "SourceAdapter", "EmedjimurjeAdapter", "ADAPTERS"]
