"""Manually trigger a live Polymarket and Kalshi refresh when live mode is enabled."""
from __future__ import annotations

import logging

from ..config import settings
from ..database import SessionLocal, init_db
from ..services.sync import run_sync


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    init_db()
    if not settings.enable_live_ingest:
        raise SystemExit("Live ingestion is disabled. Set ENABLE_LIVE_INGEST=true in the backend environment.")
    with SessionLocal() as db:
        result = run_sync(db, force=True)
    print(f"Live refresh complete: {result}")


if __name__ == "__main__":
    main()
