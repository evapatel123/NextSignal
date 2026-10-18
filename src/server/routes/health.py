from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_session
from ..models import MarketEvent, Source
from ..schemas import HealthResponse
from ..services.sync import get_last_sync


router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health(db: Session = Depends(get_session)) -> HealthResponse:
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"
    # Persisted source timestamps survive API restarts; the in-memory sync timestamp does not.
    last_sync_at = db.query(func.max(Source.last_sync_at)).scalar()
    if last_sync_at is None:
        last_sync_at, _job_id = get_last_sync()
    source_count = db.query(Source).count()
    event_count = db.query(MarketEvent).count()
    source_statuses = [row.status for row in db.query(Source.status).all()]
    # Database DateTime columns are stored as naive UTC. Normalize defensively before
    # computing freshness so deployments with timezone-aware drivers do not crash.
    if last_sync_at is not None and last_sync_at.tzinfo is not None:
        from datetime import timezone
        last_sync_at = last_sync_at.astimezone(timezone.utc).replace(tzinfo=None)
    age_seconds = (datetime.utcnow() - last_sync_at).total_seconds() if last_sync_at else None
    is_fresh = age_seconds is not None and -120 <= age_seconds < 15 * 60
    # A partial provider outage is degraded, even if another provider is healthy.
    healthy_sources = source_count > 0 and all(status == "ok" for status in source_statuses)
    return HealthResponse(
        status="ok" if db_status == "connected" and event_count > 0 and healthy_sources and is_fresh else "degraded",
        db=db_status,
        data_mode="live" if settings.enable_live_ingest else "demo",
        last_sync_at=last_sync_at,
        version=settings.version,
    )
