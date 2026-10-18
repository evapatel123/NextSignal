from __future__ import annotations

import os
import tempfile

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client():
    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp.close()
    os.environ["DATABASE_URL"] = f"sqlite:///{tmp.name}"
    os.environ["AUTO_SEED"] = "true"
    os.environ["ENABLE_LIVE_INGEST"] = "false"

    import importlib

    import src.server.config as config_mod
    import src.server.database as db_mod
    import src.server.models as models_mod
    import src.server.crud as crud_mod
    import src.server.services.ingest as ingest_mod
    import src.server.services.sync as sync_mod
    import src.server.routes.events as events_mod
    import src.server.routes.health as health_mod
    import src.server.routes.metrics as metrics_mod
    import src.server.routes.alerts as alerts_mod
    import src.server.routes.sources as sources_mod
    import src.server.routes.admin as admin_mod

    importlib.reload(config_mod)
    importlib.reload(db_mod)
    importlib.reload(models_mod)
    importlib.reload(crud_mod)
    importlib.reload(ingest_mod)
    importlib.reload(sync_mod)
    importlib.reload(events_mod)
    importlib.reload(health_mod)
    importlib.reload(metrics_mod)
    importlib.reload(alerts_mod)
    importlib.reload(sources_mod)
    importlib.reload(admin_mod)

    import src.server.main as main_mod

    importlib.reload(main_mod)

    with TestClient(main_mod.app) as c:
        yield c

    os.unlink(tmp.name)


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] in {"ok", "degraded"}
    assert body["db"] == "connected"


def test_sources(client):
    r = client.get("/api/sources")
    assert r.status_code == 200
    assert len(r.json()["sources"]) == 3


def test_events_listing(client):
    r = client.get("/api/events?limit=5")
    assert r.status_code == 200
    body = r.json()
    assert body["total"] > 0
    assert len(body["items"]) <= 5
    e = body["items"][0]
    assert "edge_score" in e
    assert "signal_label" in e


def test_event_detail(client):
    r = client.get("/api/events?limit=1")
    eid = r.json()["items"][0]["id"]

    detail = client.get(f"/api/events/{eid}").json()
    assert detail["event"]["id"] == eid
    assert isinstance(detail["history"], list)
    assert isinstance(detail["platforms"], list)


def test_metrics_summary(client):
    r = client.get("/api/metrics/summary")
    assert r.status_code == 200
    body = r.json()
    assert body["total_events"] > 0
    assert body["sources"] == 3


def test_calibration(client):
    r = client.get("/api/metrics/calibration")
    assert r.status_code == 200
    body = r.json()
    assert "overall" in body
    assert isinstance(body["buckets"], list)


def test_alerts(client):
    r = client.get("/api/alerts")
    assert r.status_code == 200
    assert "items" in r.json()


def test_admin_sync(client):
    r = client.post("/api/admin/sync", json={"force": True})
    assert r.status_code == 200
    body = r.json()
    assert body["started"] is True
    assert body["sources_synced"] == 3
