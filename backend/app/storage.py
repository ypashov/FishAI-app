from __future__ import annotations

import json
from pathlib import Path
from typing import List

from .schemas import ClassificationResponse


def _read_metadata(path: Path) -> List[ClassificationResponse]:
    if not path.exists():
        return []
    raw = path.read_text(encoding="utf-8").strip()
    if not raw:
        return []
    data = json.loads(raw)
    return [ClassificationResponse(**item) for item in data]


def _write_metadata(path: Path, items: List[ClassificationResponse]) -> None:
    serialized = []
    for item in items:
        payload = item.dict()
        payload["created_at"] = item.created_at.isoformat()
        serialized.append(payload)
    path.write_text(json.dumps(serialized, ensure_ascii=False, indent=2), encoding="utf-8")


def add_record(path: Path, record: ClassificationResponse, limit: int = 50) -> None:
    items = _read_metadata(path)
    items.insert(0, record)
    if len(items) > limit:
        items = items[:limit]
    _write_metadata(path, items)


def list_records(path: Path, limit: int = 20) -> List[ClassificationResponse]:
    items = _read_metadata(path)
    return items[:limit]


def count_records(path: Path) -> int:
    return len(_read_metadata(path))
