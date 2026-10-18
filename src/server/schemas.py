from __future__ import annotations

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class SourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    display_name: str
    status: str
    last_sync_at: Optional[datetime] = None


class SourcesResponse(BaseModel):
    sources: List[SourceOut]


class EventSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    slug: str
    category: str
    status: str
    source: str
    source_display: str
    current_probability: float
    adjusted_probability: float
    edge_score: float
    divergence_score: float
    drift_score: float
    signal_label: str
    resolution_date: Optional[datetime] = None
    volume: float = 0.0
    liquidity: float = 0.0


class OddsPoint(BaseModel):
    timestamp: datetime
    probability: float
    source: str


class PlatformQuote(BaseModel):
    source: str
    source_display: str
    probability: float
    last_updated: datetime
    volume: float = 0.0


class EventDetail(EventSummary):
    description: str = ""
    url: str = ""
    signal_explanation: str = ""
    brier_score: float = 0.0
    calibration_error: float = 0.0
    outcome: Optional[int] = None


class EventListResponse(BaseModel):
    items: List[EventSummary]
    page: int
    limit: int
    total: int


class EventDetailResponse(BaseModel):
    event: EventDetail
    history: List[OddsPoint]
    platforms: List[PlatformQuote]
    related_events: List[EventSummary]


class EventHistoryResponse(BaseModel):
    event_id: str
    points: List[OddsPoint]


class HealthResponse(BaseModel):
    status: str
    db: str
    data_mode: str = "demo"
    last_sync_at: Optional[datetime] = None
    version: str = "0.1.0"


class SummaryMetrics(BaseModel):
    total_events: int
    active_events: int
    resolved_events: int
    avg_brier_score: float
    avg_calibration_error: float
    flagged_events: int
    sources: int
    avg_drift: float
    avg_divergence: float


class BucketScore(BaseModel):
    bucket: str
    predicted: float
    observed: float
    sample_size: int


class SegmentScore(BaseModel):
    label: str
    sample_size: int
    brier_score: float
    calibration_error: float
    bias: float


class CalibrationSummary(BaseModel):
    sample_size: int
    brier_score: float
    calibration_error: float
    bias: float
    curve: List[BucketScore]


class CalibrationResponse(BaseModel):
    overall: CalibrationSummary
    by_source: List[SegmentScore]
    by_category: List[SegmentScore]
    buckets: List[BucketScore]


class AlertItem(BaseModel):
    id: str
    event_id: str
    event_title: str
    event_slug: str
    source: str
    category: str
    alert_type: str
    severity: str
    score: float
    reason: str
    edge_score: float
    drift_score: float
    divergence_score: float
    current_probability: float
    adjusted_probability: float
    created_at: datetime


class AlertsResponse(BaseModel):
    items: List[AlertItem]
    generated_at: datetime


class SyncRequest(BaseModel):
    force: bool = False


class SyncResponse(BaseModel):
    started: bool
    job_id: str
    events_processed: int
    sources_synced: int
