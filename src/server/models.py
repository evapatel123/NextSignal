from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _utcnow() -> datetime:
    return datetime.utcnow()


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="ok")
    last_sync_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, onupdate=_utcnow)

    events: Mapped[list["MarketEvent"]] = relationship(back_populates="source", cascade="all,delete")
    raw_payloads: Mapped[list["RawEventPayload"]] = relationship(
        back_populates="source", cascade="all,delete"
    )


class MarketEvent(Base):
    __tablename__ = "market_events"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    source_id: Mapped[str] = mapped_column(String, ForeignKey("sources.id"), index=True)
    source_event_id: Mapped[str] = mapped_column(String, index=True)
    title: Mapped[str] = mapped_column(String)
    slug: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String, index=True)
    status: Mapped[str] = mapped_column(String, index=True, default="active")
    url: Mapped[str] = mapped_column(String, default="")
    resolution_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, onupdate=_utcnow)

    current_probability: Mapped[float] = mapped_column(Float, default=0.5)
    adjusted_probability: Mapped[float] = mapped_column(Float, default=0.5)
    edge_score: Mapped[float] = mapped_column(Float, default=0.0)
    divergence_score: Mapped[float] = mapped_column(Float, default=0.0)
    drift_score: Mapped[float] = mapped_column(Float, default=0.0)
    liquidity: Mapped[float] = mapped_column(Float, default=0.0)
    volume: Mapped[float] = mapped_column(Float, default=0.0)
    outcome: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    calibration_error: Mapped[float] = mapped_column(Float, default=0.0)
    brier_score: Mapped[float] = mapped_column(Float, default=0.0)
    signal_label: Mapped[str] = mapped_column(String, default="neutral")
    signal_explanation: Mapped[str] = mapped_column(Text, default="")

    source: Mapped[Source] = relationship(back_populates="events")
    snapshots: Mapped[list["OddsSnapshot"]] = relationship(
        back_populates="event", cascade="all,delete-orphan"
    )
    alerts: Mapped[list["Alert"]] = relationship(
        back_populates="event", cascade="all,delete-orphan"
    )


class OddsSnapshot(Base):
    __tablename__ = "odds_snapshots"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    event_id: Mapped[str] = mapped_column(String, ForeignKey("market_events.id"), index=True)
    source_id: Mapped[str] = mapped_column(String, ForeignKey("sources.id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, index=True)
    probability: Mapped[float] = mapped_column(Float)
    price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    volume: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    liquidity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    event: Mapped[MarketEvent] = relationship(back_populates="snapshots")


class CalibrationResult(Base):
    __tablename__ = "calibration_results"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    scope_type: Mapped[str] = mapped_column(String, index=True)
    scope_value: Mapped[str] = mapped_column(String, index=True)
    sample_size: Mapped[int] = mapped_column(Integer, default=0)
    brier_score: Mapped[float] = mapped_column(Float, default=0.0)
    calibration_error: Mapped[float] = mapped_column(Float, default=0.0)
    bias: Mapped[float] = mapped_column(Float, default=0.0)
    reliability_curve_json: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    event_id: Mapped[str] = mapped_column(String, ForeignKey("market_events.id"), index=True)
    alert_type: Mapped[str] = mapped_column(String, index=True)
    severity: Mapped[str] = mapped_column(String, index=True)
    score: Mapped[float] = mapped_column(Float, default=0.0)
    reason: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    event: Mapped[MarketEvent] = relationship(back_populates="alerts")


class RawEventPayload(Base):
    __tablename__ = "raw_event_payloads"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    source_id: Mapped[str] = mapped_column(String, ForeignKey("sources.id"), index=True)
    source_event_id: Mapped[str] = mapped_column(String, index=True)
    payload_json: Mapped[str] = mapped_column(Text)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    hash: Mapped[str] = mapped_column(String, index=True)

    source: Mapped[Source] = relationship(back_populates="raw_payloads")
