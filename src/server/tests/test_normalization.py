from __future__ import annotations

from src.server.services.normalize import normalize_event


def test_normalize_minimal():
    out = normalize_event(
        "kalshi",
        {
            "id": "ks-1",
            "title": "Test",
            "slug": "test-event",
            "category": "Politics",
            "current_probability": 0.42,
        },
    )
    assert out["source_event_id"] == "ks-1"
    assert out["source_name"] == "kalshi"
    assert out["category"] == "politics"
    assert out["current_probability"] == 0.42
    assert out["status"] == "active"


def test_normalize_handles_missing_fields():
    out = normalize_event("polymarket", {})
    assert out["title"] == "Untitled event"
    assert out["category"] == "other"
    assert out["status"] == "active"
