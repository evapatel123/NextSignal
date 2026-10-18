from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_session
from ..schemas import (
    BucketScore,
    CalibrationResponse,
    CalibrationSummary,
    SegmentScore,
    SummaryMetrics,
)
from ..services.narrative import generate_dashboard_insights


router = APIRouter()


@router.get("/metrics/summary", response_model=SummaryMetrics)
def metrics_summary(db: Session = Depends(get_session)) -> SummaryMetrics:
    return SummaryMetrics(**crud.summary_metrics(db))


@router.get("/metrics/insights")
def metrics_insights(db: Session = Depends(get_session)):
    summary = crud.summary_metrics(db)
    events, _total = crud.list_events(db, page=1, limit=200)
    insights = generate_dashboard_insights(events, summary)
    return {"items": insights}


@router.get("/metrics/calibration", response_model=CalibrationResponse)
def metrics_calibration(
    source: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_session),
) -> CalibrationResponse:
    results = crud.list_calibration_results(db)
    overall = next((r for r in results if r.scope_type == "overall"), None)

    by_source = [
        SegmentScore(
            label=r.scope_value,
            sample_size=r.sample_size,
            brier_score=r.brier_score,
            calibration_error=r.calibration_error,
            bias=r.bias,
        )
        for r in results
        if r.scope_type == "source"
    ]
    by_category = [
        SegmentScore(
            label=r.scope_value,
            sample_size=r.sample_size,
            brier_score=r.brier_score,
            calibration_error=r.calibration_error,
            bias=r.bias,
        )
        for r in results
        if r.scope_type == "category"
    ]
    buckets_curve = []
    if overall and overall.reliability_curve_json:
        try:
            buckets_curve = [BucketScore(**b) for b in json.loads(overall.reliability_curve_json)]
        except Exception:
            buckets_curve = []

    overall_summary = CalibrationSummary(
        sample_size=overall.sample_size if overall else 0,
        brier_score=overall.brier_score if overall else 0.0,
        calibration_error=overall.calibration_error if overall else 0.0,
        bias=overall.bias if overall else 0.0,
        curve=buckets_curve,
    )
    return CalibrationResponse(
        overall=overall_summary,
        by_source=by_source,
        by_category=by_category,
        buckets=buckets_curve,
    )
