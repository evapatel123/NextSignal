from __future__ import annotations

import hashlib
import json
import logging
import math
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Iterable

from sqlalchemy.orm import Session

from ..config import DATA_DIR, settings
from ..models import (
    Alert,
    CalibrationResult,
    MarketEvent,
    OddsSnapshot,
    RawEventPayload,
    Source,
)
from .narrative import generate_event_explanation
from .live_sources import fetch_kalshi_markets, fetch_polymarket_markets
from .normalize import normalize_event
from .scoring import (
    adjust_probability,
    aggregate_segments,
    bias,
    brier_score,
    calibration_error,
    divergence_across_platforms,
    edge_score,
    odds_drift,
    reliability_curve,
    severity_for,
    signal_label_from,
)


logger = logging.getLogger(__name__)


SOURCE_FILES = {
    "polymarket": ("Polymarket", "sample_polymarket.json"),
    "kalshi": ("Kalshi", "sample_kalshi.json"),
    "metaculus": ("Metaculus", "sample_metaculus.json"),
}


def _load_sample(filename: str) -> dict[str, Any]:
    p = DATA_DIR / filename
    with open(p, "r", encoding="utf-8") as fh:
        return json.load(fh)


def _hash_payload(payload: dict[str, Any]) -> str:
    return hashlib.sha1(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()


def _generate_history(
    *,
    final_prob: float,
    days: int,
    drift_intensity: float,
    seed: int,
    end: datetime | None = None,
) -> list[tuple[datetime, float]]:
    """Deterministic synthetic odds history backing into the current probability."""
    rng = random.Random(seed)
    end = end or datetime.utcnow()
    n = max(8, min(days, 60))
    points: list[tuple[datetime, float]] = []
    p = max(0.05, min(0.95, final_prob + rng.uniform(-0.18, 0.18)))
    for i in range(n):
        ts = end - timedelta(days=(n - 1 - i), hours=rng.randint(0, 23))
        # mean-reverting walk towards final_prob
        pull = (final_prob - p) * 0.18
        noise = rng.uniform(-1, 1) * drift_intensity * 0.6
        p = max(0.01, min(0.99, p + pull + noise))
        points.append((ts, round(p, 4)))
    points.append((end, round(final_prob, 4)))
    return points


def reset_database(db: Session) -> None:
    """Wipe all data — used by seed/sync to keep the demo deterministic."""
    db.query(Alert).delete()
    db.query(OddsSnapshot).delete()
    db.query(MarketEvent).delete()
    db.query(RawEventPayload).delete()
    db.query(CalibrationResult).delete()
    db.query(Source).delete()
    db.commit()


def ingest_all(db: Session) -> dict[str, int]:
    """Fetch real Polymarket markets when enabled; otherwise load clearly labelled demo fixtures."""
    now = datetime.utcnow()

    live_mode = settings.enable_live_ingest
    active_sources = {"polymarket": SOURCE_FILES["polymarket"], "kalshi": ("Kalshi", "")} if live_mode else SOURCE_FILES
    payloads: dict[str, dict[str, Any]] = {}
    failed_sources: set[str] = set()
    if live_mode:
        # Try each public feed independently so a provider outage does not hide all live data.
        adapters = {"polymarket": fetch_polymarket_markets, "kalshi": fetch_kalshi_markets}
        for slug, adapter in adapters.items():
            try:
                rows = adapter()
                if rows:
                    payloads[slug] = {"events": rows}
                else:
                    failed_sources.add(slug)
                    logger.warning("Live source %s returned no usable markets", slug)
            except Exception as exc:
                failed_sources.add(slug)
                logger.warning("Live source %s failed: %s", slug, exc)
        if not payloads:
            raise RuntimeError("All live market feeds failed. Check your internet connection and try syncing again.")
        # Keep failed providers visible in /sources instead of silently hiding them.
        # Only successfully fetched providers contribute event rows below.
    else:
        for slug, (_display, filename) in active_sources.items():
            payloads[slug] = _load_sample(filename)

    # Demo fixtures are deterministic and can be rebuilt. In live mode, preserve existing
    # rows and append real snapshots so drift is measured from observed history rather than
    # fabricated values. A provider outage must not erase previously fetched data.
    if not live_mode:
        reset_database(db)
    else:
        # Alerts are recomputed from the latest snapshot set; avoid duplicate alerts each sync.
        db.query(Alert).delete(synchronize_session=False)
        db.query(CalibrationResult).delete(synchronize_session=False)

    # ---- 1. sources ----
    sources_by_name: dict[str, Source] = {}
    for slug, (display, filename) in active_sources.items():
        src = db.query(Source).filter(Source.name == slug).first() if live_mode else None
        if src is None:
            src = Source(id=f"src_{slug}", name=slug, display_name=display)
            db.add(src)
        src.display_name = display
        src.status = "degraded" if slug in failed_sources else "ok"
        # Keep last successful sync timestamp during an outage; never mark failure as success.
        if slug not in failed_sources and slug in payloads:
            src.last_sync_at = now
        sources_by_name[slug] = src
    db.flush()

    # ---- 2. raw payloads + normalized events ----
    # Group by canonical slug so multi-platform events get joined.
    grouped: dict[str, list[dict[str, Any]]] = {}
    for slug, (_display, filename) in active_sources.items():
        payload = payloads.get(slug, {})
        for raw in payload.get("events", []):
            db.add(
                RawEventPayload(
                    id=f"raw_{uuid.uuid4().hex[:12]}",
                    source_id=sources_by_name[slug].id,
                    source_event_id=str(raw.get("id")),
                    payload_json=json.dumps(raw),
                    fetched_at=now,
                    hash=_hash_payload(raw),
                )
            )
            norm = normalize_event(slug, raw)
            grouped.setdefault(norm["slug"], []).append(norm)

    # We still want a unique MarketEvent per (source, source_event_id) so platforms can be compared.
    events: list[MarketEvent] = []
    seed_counter = 1
    for canonical_slug, group in grouped.items():
        for n in group:
            src = sources_by_name[n["source_name"]]
            event_id = f"evt_{n['source_name']}_{n['source_event_id']}"
            # For resolved events we want current_probability to reflect what the market *predicted*
            # (final_market_probability) so Brier/calibration are meaningful.
            if n["status"] == "resolved" and n.get("final_market_probability") is not None:
                effective_probability = float(n["final_market_probability"])
            else:
                effective_probability = n["current_probability"]
            ev = db.query(MarketEvent).filter(MarketEvent.id == event_id).first() if live_mode else None
            if ev is None:
                ev = MarketEvent(
                    id=event_id,
                    source_id=src.id,
                    source_event_id=n["source_event_id"],
                    title=n["title"],
                    slug=canonical_slug,
                    description=n["description"],
                    category=n["category"],
                    status=n["status"],
                    url=n["url"],
                    resolution_date=n["resolution_date"],
                    current_probability=effective_probability,
                    liquidity=n["liquidity"],
                    volume=n["volume"],
                    outcome=n["outcome"],
                    created_at=now - timedelta(days=n["history_days"]),
                    updated_at=now,
                )
                db.add(ev)
            else:
                ev.source_id = src.id
                ev.source_event_id = n["source_event_id"]
                ev.title = n["title"]
                ev.slug = canonical_slug
                ev.description = n["description"]
                ev.category = n["category"]
                ev.status = n["status"]
                ev.url = n["url"]
                ev.resolution_date = n["resolution_date"]
                ev.current_probability = effective_probability
                ev.liquidity = n["liquidity"]
                ev.volume = n["volume"]
                ev.outcome = n["outcome"]
                ev.updated_at = now
            events.append(ev)

            # synth history snapshots
            final_prob = (
                n["final_market_probability"]
                if n["status"] == "resolved" and n.get("final_market_probability") is not None
                else n["current_probability"]
            )
            if live_mode:
                # Persist one real observation per successful sync, including quick successive
                # refreshes. Each snapshot has a unique ID and precise timestamp.
                history = [(now, round(final_prob, 4))]
            else:
                history = _generate_history(
                    final_prob=final_prob,
                    days=n["history_days"],
                    drift_intensity=n["drift_intensity"],
                    seed=seed_counter,
                    end=n["resolution_date"] if n["status"] == "resolved" else now,
                )
                seed_counter += 1
            for ts, p in history:
                db.add(
                    OddsSnapshot(
                        id=f"snap_{uuid.uuid4().hex[:12]}",
                        event_id=ev.id,
                        source_id=src.id,
                        timestamp=ts,
                        probability=p,
                        price=p,
                        volume=n["volume"] / max(len(history), 1) if n["volume"] else None,
                        liquidity=n["liquidity"] or None,
                    )
                )
    db.flush()

    # ---- 3. compute scoring on every event ----
    # First aggregate category bias (resolved only) for adjustment.
    category_bias_map = {row["label"]: row["bias"] for row in aggregate_segments(events, "category")}
    source_bias_map = {row["label"]: row["bias"] for row in aggregate_segments(events, "source")}

    # Group by canonical slug for divergence (latest probability across platforms).
    latest_per_slug: dict[str, list[float]] = {}
    for ev in events:
        latest_per_slug.setdefault(ev.slug, []).append(ev.current_probability)

    alerts_to_add: list[Alert] = []
    for ev in events:
        snaps = [s for s in db.query(OddsSnapshot).filter(OddsSnapshot.event_id == ev.id).all()]
        drift = odds_drift(snaps)
        divergence = divergence_across_platforms(latest_per_slug.get(ev.slug, []))
        cat_bias = category_bias_map.get(ev.category, 0.0)
        src_bias = source_bias_map.get(ev.source.name, 0.0)
        sample_size = len(
            [
                e
                for e in events
                if e.outcome is not None
                and (e.category == ev.category or (ev.source and e.source.name == ev.source.name))
            ]
        )
        adjusted = adjust_probability(
            ev.current_probability,
            category_bias=cat_bias,
            source_bias=src_bias,
            sample_size=sample_size,
            drift=drift,
            divergence=divergence,
        )
        edge = edge_score(adjusted, ev.current_probability, divergence, drift)
        label, base_explanation = signal_label_from(adjusted, ev.current_probability, divergence, drift)
        explanation = generate_event_explanation(
            title=ev.title,
            base_explanation=base_explanation,
            adjusted=adjusted,
            market=ev.current_probability,
            divergence=divergence,
            drift=drift,
            category=ev.category,
            source=ev.source.display_name,
            cat_bias=cat_bias,
            src_bias=src_bias,
        )

        ev.divergence_score = round(divergence, 4)
        ev.drift_score = round(drift, 4)
        ev.edge_score = round(edge, 4)
        ev.adjusted_probability = round(adjusted, 4)
        ev.signal_label = label
        ev.signal_explanation = explanation

        if ev.outcome is not None:
            ev.brier_score = round(brier_score(ev.current_probability, ev.outcome), 4)
            ev.calibration_error = round(calibration_error(ev.current_probability, ev.outcome), 4)
        else:
            ev.brier_score = round(0.5 * (1 - 2 * abs(ev.current_probability - 0.5)) ** 2, 4)
            ev.calibration_error = round(abs(ev.current_probability - adjusted), 4)

        # Generate alerts for elevated edge / divergence / drift.
        components: list[tuple[str, float, str]] = []
        if edge >= 0.08 or label != "neutral":
            components.append(("anomaly" if label == "neutral" else label, edge, base_explanation))
        if divergence >= 0.15:
            components.append(("divergence", divergence, "Cross-platform spread is unusually wide."))
        if drift >= 0.25:
            components.append(("drift", drift, "Odds have moved sharply in a short window."))

        for atype, score, reason in components:
            alerts_to_add.append(
                Alert(
                    id=f"alr_{uuid.uuid4().hex[:12]}",
                    event_id=ev.id,
                    alert_type=atype,
                    severity=severity_for(score),
                    score=round(score, 4),
                    reason=reason,
                    created_at=now,
                )
            )

    db.add_all(alerts_to_add)

    # ---- 4. persist calibration aggregates ----
    db.query(CalibrationResult).delete()
    overall_curve = reliability_curve(events)
    overall = {
        "label": "overall",
        "sample_size": sum(1 for e in events if e.outcome is not None),
        "brier_score": round(
            (sum(e.brier_score for e in events if e.outcome is not None) / max(1, sum(1 for e in events if e.outcome is not None))),
            4,
        ),
        "calibration_error": round(
            (sum(e.calibration_error for e in events if e.outcome is not None) / max(1, sum(1 for e in events if e.outcome is not None))),
            4,
        ),
        "bias": round(
            (sum(bias(e.current_probability, e.outcome or 0) for e in events if e.outcome is not None) / max(1, sum(1 for e in events if e.outcome is not None))),
            4,
        ),
    }
    db.add(
        CalibrationResult(
            id=f"cal_overall_{uuid.uuid4().hex[:8]}",
            scope_type="overall",
            scope_value="overall",
            sample_size=overall["sample_size"],
            brier_score=overall["brier_score"],
            calibration_error=overall["calibration_error"],
            bias=overall["bias"],
            reliability_curve_json=json.dumps(overall_curve),
            created_at=now,
        )
    )
    for seg in aggregate_segments(events, "source"):
        db.add(
            CalibrationResult(
                id=f"cal_src_{seg['label']}_{uuid.uuid4().hex[:6]}",
                scope_type="source",
                scope_value=seg["label"],
                sample_size=seg["sample_size"],
                brier_score=seg["brier_score"],
                calibration_error=seg["calibration_error"],
                bias=seg["bias"],
                reliability_curve_json="[]",
                created_at=now,
            )
        )
    for seg in aggregate_segments(events, "category"):
        db.add(
            CalibrationResult(
                id=f"cal_cat_{seg['label']}_{uuid.uuid4().hex[:6]}",
                scope_type="category",
                scope_value=seg["label"],
                sample_size=seg["sample_size"],
                brier_score=seg["brier_score"],
                calibration_error=seg["calibration_error"],
                bias=seg["bias"],
                reliability_curve_json="[]",
                created_at=now,
            )
        )
    for bkt in overall_curve:
        db.add(
            CalibrationResult(
                id=f"cal_bkt_{bkt['bucket']}_{uuid.uuid4().hex[:6]}",
                scope_type="bucket",
                scope_value=bkt["bucket"],
                sample_size=bkt["sample_size"],
                brier_score=0.0,
                calibration_error=round(abs(bkt["predicted"] - bkt["observed"]), 4),
                bias=round(bkt["predicted"] - bkt["observed"], 4),
                reliability_curve_json="[]",
                created_at=now,
            )
        )

    db.commit()
    healthy_sources = sum(1 for source in sources_by_name.values() if source.status == "ok")
    return {
        "events": len(events),
        "sources": healthy_sources if live_mode else len(sources_by_name),
        "healthy_sources": healthy_sources,
        "failed_sources": sorted(failed_sources),
        "alerts": len(alerts_to_add),
        "live": live_mode,
    }
