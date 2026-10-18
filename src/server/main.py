from __future__ import annotations

import logging
import os
import threading

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import SessionLocal, init_db
from .routes import admin, alerts, events, health, metrics, sources
from .services.sync import run_sync


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
_sync_stop: threading.Event | None = None
_sync_thread: threading.Thread | None = None


def _start_periodic_sync() -> None:
    """Run periodic live refreshes for a single backend process when enabled."""
    global _sync_stop, _sync_thread
    if not settings.enable_live_ingest or os.getenv("AUTO_SYNC", "true").lower() not in {"1", "true", "yes"}:
        return
    if _sync_thread and _sync_thread.is_alive():
        return
    try:
        interval_minutes = max(1, int(os.getenv("AUTO_SYNC_INTERVAL_MINUTES", "5")))
    except ValueError:
        interval_minutes = 5
    stop_event = threading.Event()
    _sync_stop = stop_event

    def loop() -> None:
        while not stop_event.wait(interval_minutes * 60):
            try:
                with SessionLocal() as db:
                    result = run_sync(db, force=True)
                    logger.info("Scheduled live sync complete: %s events from %s sources", result["events"], result["sources"])
            except Exception:
                logger.exception("Scheduled live sync failed; retaining last known market data")

    _sync_thread = threading.Thread(target=loop, name="nextsignal-live-sync", daemon=True)
    _sync_thread.start()
    logger.info("Scheduled live refresh enabled every %s minute(s)", interval_minutes)


def _stop_periodic_sync() -> None:
    global _sync_stop, _sync_thread
    if _sync_stop:
        _sync_stop.set()
    if _sync_thread and _sync_thread.is_alive():
        _sync_thread.join(timeout=2)
    _sync_stop = None
    _sync_thread = None


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version=settings.version)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def _startup() -> None:
        init_db()
        if os.getenv("AUTO_SEED", "true").lower() in {"1", "true", "yes"}:
            with SessionLocal() as db:
                # If empty, seed
                from .models import MarketEvent

                if db.query(MarketEvent).count() == 0:
                    if settings.enable_live_ingest:
                        logger.info("Initializing empty database from live Polymarket markets...")
                    else:
                        logger.info("Initializing empty database with bundled demo samples...")
                    try:
                        result = run_sync(db, force=True)
                        logger.info("Initial sync complete: %s events from %s sources", result["events"], result["sources"])
                    except Exception:
                        # Keep the API available so the user can inspect health and retry sync.
                        logger.exception("Initial market-data sync failed; API will start in degraded mode")
                else:
                    logger.info("Database already populated; attempting a live refresh when enabled.")
                    if settings.enable_live_ingest:
                        try:
                            result = run_sync(db, force=True)
                            logger.info("Live refresh complete: %s events from %s sources", result["events"], result["sources"])
                        except Exception:
                            logger.exception("Live refresh failed; retaining existing database contents")
        _start_periodic_sync()

    @app.on_event("shutdown")
    def _shutdown() -> None:
        _stop_periodic_sync()

    app.include_router(health.router, prefix="/api", tags=["health"])
    app.include_router(events.router, prefix="/api", tags=["events"])
    app.include_router(metrics.router, prefix="/api", tags=["metrics"])
    app.include_router(alerts.router, prefix="/api", tags=["alerts"])
    app.include_router(sources.router, prefix="/api", tags=["sources"])
    app.include_router(admin.router, prefix="/api", tags=["admin"])

    @app.get("/")
    def _root() -> dict[str, str]:
        return {
            "service": settings.app_name,
            "version": settings.version,
            "docs": "/docs",
        }

    return app


app = create_app()
