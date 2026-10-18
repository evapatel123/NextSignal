from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Optional


def _parse_dt(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return None


def normalize_event(source_name: str, raw: dict[str, Any]) -> dict[str, Any]:
    """Normalize a raw event. Use normalized title for cautious cross-source grouping;
    provider IDs/slugs are not comparable across platforms and must not be used as match keys.
    This exact-title key is deliberately conservative and is not semantic market matching.
    """
    title = str(raw.get("title") or "Untitled event").strip()
    canonical_title = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-") or "untitled"
    return {
        "source_event_id": str(raw.get("id") or raw.get("event_id") or raw.get("slug")),
        "title": title,
        "slug": canonical_title,
        "description": raw.get("description", ""),
        "category": (raw.get("category") or "other").lower(),
        "status": (raw.get("status") or "active").lower(),
        "url": raw.get("url", ""),
        "resolution_date": _parse_dt(raw.get("resolution_date")),
        "current_probability": float(raw.get("current_probability") or raw.get("probability") or 0.5),
        "outcome": raw.get("outcome"),
        "volume": float(raw.get("volume") or 0.0),
        "liquidity": float(raw.get("liquidity") or 0.0),
        "history_days": int(raw.get("history_days") or 14),
        "drift_intensity": float(raw.get("drift_intensity") or 0.05),
        "final_market_probability": raw.get("final_market_probability"),
        "source_name": source_name,
    }
