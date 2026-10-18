"""Seed the SQLite database with bundled sample data."""
from __future__ import annotations

import logging

from ..database import SessionLocal, init_db
from ..services.sync import run_sync


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    init_db()
    with SessionLocal() as db:
        result = run_sync(db, force=True)
    print(f"Seeded database: {result}")


if __name__ == "__main__":
    main()
