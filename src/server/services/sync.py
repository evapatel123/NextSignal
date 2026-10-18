from __future__ import annotations

import logging
import uuid
from datetime import datetime
from threading import Lock

from sqlalchemy.orm import Session

from .ingest import ingest_all


_logger = logging.getLogger(__name__)
_LAST_SYNC_LOCK = Lock()
_LAST_SYNC_AT: datetime | None = None
_LAST_JOB_ID: str | None = None
_LAST_RESULT: dict | None = None


def get_last_sync() -> tuple[datetime | None, str | None]:
    return _LAST_SYNC_AT, _LAST_JOB_ID


def run_sync(db: Session, force: bool = False) -> dict:
    """Run a full ingestion + scoring cycle. Returns the new job summary."""
    global _LAST_SYNC_AT, _LAST_JOB_ID, _LAST_RESULT
    with _LAST_SYNC_LOCK:
        job_id = f"sync_{uuid.uuid4().hex[:10]}"
        _logger.info("Starting sync job %s (force=%s)", job_id, force)
        result = ingest_all(db)
        _LAST_SYNC_AT = datetime.utcnow()
        _LAST_JOB_ID = job_id
        _LAST_RESULT = {**result, "job_id": job_id, "at": _LAST_SYNC_AT.isoformat()}
        return _LAST_RESULT
