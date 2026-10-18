from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_session
from ..models import MarketEvent
from ..schemas import (
    EventDetail,
    EventDetailResponse,
    EventHistoryResponse,
    EventListResponse,
    EventSummary,
    OddsPoint,
    PlatformQuote,
)


router = APIRouter()


def _to_summary(ev: MarketEvent) -> EventSummary:
    return EventSummary(
        id=ev.id,
        title=ev.title,
        slug=ev.slug,
        category=ev.category,
        status=ev.status,
        source=ev.source.name if ev.source else "unknown",
        source_display=ev.source.display_name if ev.source else "Unknown",
        current_probability=ev.current_probability,
        adjusted_probability=ev.adjusted_probability,
        edge_score=ev.edge_score,
        divergence_score=ev.divergence_score,
        drift_score=ev.drift_score,
        signal_label=ev.signal_label,
        resolution_date=ev.resolution_date,
        volume=ev.volume,
        liquidity=ev.liquidity,
    )


def _to_detail(ev: MarketEvent) -> EventDetail:
    s = _to_summary(ev)
    return EventDetail(
        **s.model_dump(),
        description=ev.description,
        url=ev.url,
        signal_explanation=ev.signal_explanation,
        brier_score=ev.brier_score,
        calibration_error=ev.calibration_error,
        outcome=ev.outcome,
    )


@router.get("/events", response_model=EventListResponse)
def list_events(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    source: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "edge_score",
    sort_order: str = "desc",
    min_edge: Optional[float] = Query(None, ge=0, le=1),
    min_drift: Optional[float] = Query(None, ge=0, le=1),
    db: Session = Depends(get_session),
) -> EventListResponse:
    items, total = crud.list_events(
        db,
        page=page,
        limit=limit,
        source=source,
        category=category,
        status=status,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        min_edge=min_edge,
        min_drift=min_drift,
    )
    return EventListResponse(
        items=[_to_summary(e) for e in items], page=page, limit=limit, total=total
    )


@router.get("/events/{event_id}", response_model=EventDetailResponse)
def get_event(event_id: str, db: Session = Depends(get_session)) -> EventDetailResponse:
    ev = crud.get_event(db, event_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    history_snapshots = crud.get_event_history(db, event_id)
    platform_events = crud.list_platform_quotes(db, ev.slug)
    related = crud.list_related_events(db, ev)

    points = [
        OddsPoint(
            timestamp=s.timestamp,
            probability=s.probability,
            source=ev.source.name if ev.source else "unknown",
        )
        for s in history_snapshots
    ]
    platforms = [
        PlatformQuote(
            source=p.source.name if p.source else "unknown",
            source_display=p.source.display_name if p.source else "Unknown",
            probability=p.current_probability,
            last_updated=p.updated_at,
            volume=p.volume,
        )
        for p in platform_events
    ]
    return EventDetailResponse(
        event=_to_detail(ev),
        history=points,
        platforms=platforms,
        related_events=[_to_summary(r) for r in related if r.id != ev.id],
    )


@router.get("/events/{event_id}/history", response_model=EventHistoryResponse)
def get_event_history(event_id: str, db: Session = Depends(get_session)) -> EventHistoryResponse:
    ev = crud.get_event(db, event_id)
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    snaps = crud.get_event_history(db, event_id)
    return EventHistoryResponse(
        event_id=event_id,
        points=[
            OddsPoint(
                timestamp=s.timestamp,
                probability=s.probability,
                source=ev.source.name if ev.source else "unknown",
            )
            for s in snaps
        ],
    )
