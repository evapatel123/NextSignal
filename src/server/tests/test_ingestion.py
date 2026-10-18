from __future__ import annotations

import os
import tempfile

import pytest


@pytest.fixture()
def temp_db(monkeypatch):
    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp.close()
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp.name}")
    monkeypatch.setenv("ENABLE_LIVE_INGEST", "false")
    # Reload modules so they pick up the new env var.
    import importlib

    import src.server.config as config_mod
    import src.server.database as db_mod
    import src.server.models as models_mod
    import src.server.crud as crud_mod
    import src.server.services.ingest as ingest_mod
    import src.server.services.sync as sync_mod

    importlib.reload(config_mod)
    importlib.reload(db_mod)
    importlib.reload(models_mod)
    importlib.reload(crud_mod)
    importlib.reload(ingest_mod)
    importlib.reload(sync_mod)

    yield db_mod
    os.unlink(tmp.name)


def test_ingest_runs(temp_db):
    import src.server.services.ingest as ingest_mod

    db_mod = temp_db
    db_mod.init_db()
    with db_mod.SessionLocal() as db:
        result = ingest_mod.ingest_all(db)

    assert result["sources"] == 3
    assert result["events"] > 0


def test_ingest_creates_alerts_and_metrics(temp_db):
    import src.server.crud as crud_mod
    import src.server.services.ingest as ingest_mod

    db_mod = temp_db
    db_mod.init_db()
    with db_mod.SessionLocal() as db:
        ingest_mod.ingest_all(db)
        events, total = crud_mod.list_events(db, page=1, limit=100)
        summary = crud_mod.summary_metrics(db)

    assert total > 0
    assert summary["sources"] == 3
    assert summary["total_events"] == total


def test_live_sync_preserves_snapshots_and_does_not_fabricate_history(temp_db, monkeypatch):
    import src.server.services.ingest as ingest_mod
    from src.server.models import OddsSnapshot, MarketEvent

    db_mod = temp_db
    db_mod.init_db()
    monkeypatch.setattr(ingest_mod.settings, "enable_live_ingest", True)
    probability = {"value": 0.41}

    def fake_polymarket(limit=100):
        return [{
            "id": "live-market-1",
            "title": "Will the test event happen?",
            "slug": "will-the-test-event-happen",
            "description": "Test provider payload",
            "category": "science",
            "status": "active",
            "url": "https://example.com/market",
            "resolution_date": None,
            "current_probability": probability["value"],
            "probability": probability["value"],
            "volume": 1000,
            "liquidity": 200,
            "history_days": 1,
            "drift_intensity": 0.0,
            "outcome": None,
            "final_market_probability": None,
        }]

    def fake_kalshi(limit=100):
        return []

    monkeypatch.setattr(ingest_mod, "fetch_polymarket_markets", fake_polymarket)
    monkeypatch.setattr(ingest_mod, "fetch_kalshi_markets", fake_kalshi)

    with db_mod.SessionLocal() as db:
        first = ingest_mod.ingest_all(db)
        assert first["live"] is True
        probability["value"] = 0.49
        second = ingest_mod.ingest_all(db)
        assert second["live"] is True
        event = db.query(MarketEvent).filter(MarketEvent.source_event_id == "live-market-1").one()
        snapshots = db.query(OddsSnapshot).filter(OddsSnapshot.event_id == event.id).order_by(OddsSnapshot.timestamp).all()
        assert len(snapshots) == 2
        assert snapshots[0].probability == 0.41
        assert snapshots[1].probability == 0.49
        assert event.current_probability == 0.49
