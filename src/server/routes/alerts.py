from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_session
from ..schemas import AlertItem, AlertsResponse


router = APIRouter()


@router.get("/alerts", response_model=AlertsResponse)
def list_alerts(
    severity: Optional[str] = None,
    source: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_session),
) -> AlertsResponse:
    rows = crud.list_alerts(db, severity=severity, source=source, category=category, limit=limit)
    items: list[AlertItem] = []
    for a in rows:
        ev = a.event
        items.append(
            AlertItem(
                id=a.id,
                event_id=ev.id,
                event_title=ev.title,
                event_slug=ev.slug,
                source=ev.source.name if ev.source else "unknown",
                category=ev.category,
                alert_type=a.alert_type,
                severity=a.severity,
                score=a.score,
                reason=a.reason,
                edge_score=ev.edge_score,
                drift_score=ev.drift_score,
                divergence_score=ev.divergence_score,
                current_probability=ev.current_probability,
                adjusted_probability=ev.adjusted_probability,
                created_at=a.created_at,
            )
        )
    return AlertsResponse(items=items, generated_at=datetime.utcnow())
