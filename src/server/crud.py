from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session, joinedload

from .models import Alert, CalibrationResult, MarketEvent, OddsSnapshot, Source


def list_sources(db: Session) -> list[Source]:
    return db.query(Source).order_by(Source.display_name).all()


def list_events(
    db: Session,
    *,
    page: int = 1,
    limit: int = 20,
    source: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "edge_score",
    sort_order: str = "desc",
    min_edge: Optional[float] = None,
    min_drift: Optional[float] = None,
) -> tuple[list[MarketEvent], int]:
    q = db.query(MarketEvent).options(joinedload(MarketEvent.source))
    if source:
        q = q.join(Source).filter(Source.name == source)
    if category:
        q = q.filter(MarketEvent.category == category)
    if status:
        q = q.filter(MarketEvent.status == status)
    if search:
        like = f"%{search.lower()}%"
        q = q.filter(
            or_(
                func.lower(MarketEvent.title).like(like),
                func.lower(MarketEvent.description).like(like),
            )
        )
    if min_edge is not None:
        q = q.filter(MarketEvent.edge_score >= min_edge)
    if min_drift is not None:
        q = q.filter(MarketEvent.drift_score >= min_drift)

    total = q.count()
    sort_col = {
        "edge_score": MarketEvent.edge_score,
        "drift_score": MarketEvent.drift_score,
        "divergence_score": MarketEvent.divergence_score,
        "current_probability": MarketEvent.current_probability,
        "adjusted_probability": MarketEvent.adjusted_probability,
        "title": MarketEvent.title,
        "category": MarketEvent.category,
        "status": MarketEvent.status,
        "resolution_date": MarketEvent.resolution_date,
    }.get(sort_by, MarketEvent.edge_score)
    if sort_order == "asc":
        q = q.order_by(sort_col.asc().nullslast())
    else:
        q = q.order_by(sort_col.desc().nullslast())

    items = q.offset(max(0, (page - 1) * limit)).limit(limit).all()
    return items, total


def get_event(db: Session, event_id: str) -> Optional[MarketEvent]:
    return (
        db.query(MarketEvent)
        .options(joinedload(MarketEvent.source))
        .filter(MarketEvent.id == event_id)
        .first()
    )


def get_event_history(db: Session, event_id: str) -> list[OddsSnapshot]:
    return (
        db.query(OddsSnapshot)
        .filter(OddsSnapshot.event_id == event_id)
        .order_by(OddsSnapshot.timestamp.asc())
        .all()
    )


def list_related_events(db: Session, event: MarketEvent, limit: int = 6) -> list[MarketEvent]:
    return (
        db.query(MarketEvent)
        .options(joinedload(MarketEvent.source))
        .filter(
            and_(
                MarketEvent.id != event.id,
                or_(
                    MarketEvent.slug == event.slug,
                    MarketEvent.category == event.category,
                ),
            )
        )
        .order_by(MarketEvent.edge_score.desc())
        .limit(limit)
        .all()
    )


def list_platform_quotes(db: Session, slug: str) -> list[MarketEvent]:
    return (
        db.query(MarketEvent)
        .options(joinedload(MarketEvent.source))
        .filter(MarketEvent.slug == slug)
        .all()
    )


def list_alerts(
    db: Session,
    *,
    severity: Optional[str] = None,
    source: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50,
) -> list[Alert]:
    q = (
        db.query(Alert)
        .options(joinedload(Alert.event).joinedload(MarketEvent.source))
        .order_by(Alert.score.desc())
    )
    if severity:
        q = q.filter(Alert.severity == severity)
    if source or category:
        q = q.join(MarketEvent, Alert.event_id == MarketEvent.id)
        if category:
            q = q.filter(MarketEvent.category == category)
        if source:
            q = q.join(Source, MarketEvent.source_id == Source.id).filter(Source.name == source)
    return q.limit(limit).all()


def list_calibration_results(db: Session, scope_type: Optional[str] = None) -> list[CalibrationResult]:
    q = db.query(CalibrationResult)
    if scope_type:
        q = q.filter(CalibrationResult.scope_type == scope_type)
    return q.all()


def summary_metrics(db: Session) -> dict:
    total = db.query(MarketEvent).count()
    active = db.query(MarketEvent).filter(MarketEvent.status == "active").count()
    resolved = db.query(MarketEvent).filter(MarketEvent.status == "resolved").count()
    flagged = (
        db.query(MarketEvent)
        .filter(MarketEvent.signal_label != "neutral")
        .count()
    )
    avg_brier = db.query(func.avg(MarketEvent.brier_score)).filter(MarketEvent.outcome.isnot(None)).scalar() or 0.0
    avg_cal = db.query(func.avg(MarketEvent.calibration_error)).filter(MarketEvent.outcome.isnot(None)).scalar() or 0.0
    avg_drift = db.query(func.avg(MarketEvent.drift_score)).scalar() or 0.0
    avg_div = db.query(func.avg(MarketEvent.divergence_score)).scalar() or 0.0
    # Only successfully synchronized providers count as available sources.
    n_sources = db.query(Source).filter(Source.status == "ok").count()
    return {
        "total_events": total,
        "active_events": active,
        "resolved_events": resolved,
        "flagged_events": flagged,
        "avg_brier_score": round(float(avg_brier), 4),
        "avg_calibration_error": round(float(avg_cal), 4),
        "avg_drift": round(float(avg_drift), 4),
        "avg_divergence": round(float(avg_div), 4),
        "sources": n_sources,
    }
