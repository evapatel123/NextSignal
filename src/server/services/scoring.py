from __future__ import annotations

import math
import statistics
from collections import defaultdict
from datetime import datetime
from typing import Iterable, Sequence

from ..models import MarketEvent, OddsSnapshot


# ------- atomic metrics -------


def brier_score(predicted: float, outcome: int) -> float:
    """Brier score for a single binary forecast."""
    return (predicted - outcome) ** 2


def calibration_error(predicted: float, outcome: int) -> float:
    """Absolute calibration error for a single forecast."""
    return abs(predicted - outcome)


def bias(predicted: float, outcome: int) -> float:
    """Signed bias: positive = market over-predicted YES."""
    return predicted - outcome


def odds_drift(snapshots: Sequence[OddsSnapshot]) -> float:
    """Total absolute movement / time, normalized to [0, 1]."""
    if len(snapshots) < 2:
        return 0.0
    pts = sorted(snapshots, key=lambda s: s.timestamp)
    diffs = [abs(pts[i].probability - pts[i - 1].probability) for i in range(1, len(pts))]
    raw = sum(diffs) / max(len(diffs), 1)
    # squash, drift of 0.10 average per snapshot is "high"
    return min(1.0, raw * 6)


def divergence_across_platforms(probabilities: Iterable[float]) -> float:
    """Standard deviation of latest probability across platforms, scaled to [0, 1]."""
    probs = list(probabilities)
    if len(probs) < 2:
        return 0.0
    s = statistics.pstdev(probs)
    return min(1.0, s * 4)


def edge_score(adjusted: float, market: float, divergence: float, drift: float) -> float:
    """Composite mispricing score combining model edge, disagreement, and drift."""
    raw_edge = abs(adjusted - market)
    score = 0.55 * raw_edge + 0.25 * divergence + 0.20 * drift
    return float(max(0.0, min(1.0, score)))


# ------- adjustment / signal -------


def adjust_probability(
    market: float,
    *,
    category_bias: float,
    source_bias: float,
    sample_size: int,
    drift: float,
    divergence: float,
) -> float:
    """
    Apply explainable adjustments:
      - bias correction (categorical + source) shrunk by sample size
      - small dampening by drift (uncertain markets are pulled toward 0.5)
    """
    n = max(sample_size, 1)
    shrink = 1.0 / (1.0 + math.exp(-(n - 8) / 6))  # ~0 with little data, ~1 with lots
    correction = -(0.6 * category_bias + 0.4 * source_bias) * shrink
    pulled = market + correction
    pulled = (1 - 0.18 * drift) * pulled + 0.18 * drift * 0.5
    pulled = (1 - 0.10 * divergence) * pulled + 0.10 * divergence * 0.5
    return float(max(0.001, min(0.999, pulled)))


def signal_label_from(adjusted: float, market: float, divergence: float, drift: float) -> tuple[str, str]:
    delta = adjusted - market
    if abs(delta) < 0.04 and divergence < 0.25 and drift < 0.30:
        return "neutral", "Markets agree and movement is stable; no actionable edge detected."
    if delta > 0.06:
        return (
            "underpriced",
            f"Adjusted probability is {delta * 100:.1f} pts above market — historical calibration "
            "suggests the market is underpricing this outcome.",
        )
    if delta < -0.06:
        return (
            "overconfident",
            f"Adjusted probability is {abs(delta) * 100:.1f} pts below market — calibration history "
            "suggests the market is overconfident here.",
        )
    if divergence > 0.45:
        return (
            "divergent",
            "Cross-platform disagreement is unusually high — pricing is inconsistent across sources.",
        )
    if drift > 0.55:
        return (
            "drifting",
            "Odds have moved sharply in a short window, indicating fresh information or instability.",
        )
    return "neutral", "Conditions are normal; probability is broadly consistent with history."


# ------- segment aggregation -------


def aggregate_segments(
    events: Iterable[MarketEvent], scope: str
) -> list[dict]:
    """
    scope = 'source' or 'category' — aggregates Brier, calibration error, bias on resolved events.
    """
    by_label: dict[str, list[MarketEvent]] = defaultdict(list)
    for ev in events:
        if ev.outcome is None:
            continue
        if scope == "source":
            label = ev.source.name if ev.source else "unknown"
        elif scope == "category":
            label = ev.category or "other"
        else:
            label = "all"
        by_label[label].append(ev)

    out: list[dict] = []
    for label, group in by_label.items():
        n = len(group)
        if n == 0:
            continue
        b = sum(brier_score(e.current_probability, e.outcome or 0) for e in group) / n
        ce = sum(calibration_error(e.current_probability, e.outcome or 0) for e in group) / n
        bi = sum(bias(e.current_probability, e.outcome or 0) for e in group) / n
        out.append(
            {
                "label": label,
                "sample_size": n,
                "brier_score": round(b, 4),
                "calibration_error": round(ce, 4),
                "bias": round(bi, 4),
            }
        )
    out.sort(key=lambda x: -x["sample_size"])
    return out


def reliability_curve(events: Iterable[MarketEvent], n_buckets: int = 10) -> list[dict]:
    """Reliability diagram: predicted vs observed outcome rate per probability bucket."""
    edges = [i / n_buckets for i in range(n_buckets + 1)]
    rows: list[dict] = []
    resolved = [e for e in events if e.outcome is not None]
    for i in range(n_buckets):
        lo, hi = edges[i], edges[i + 1]
        bucket = [
            e for e in resolved
            if (lo <= e.current_probability < hi) or (i == n_buckets - 1 and e.current_probability == hi)
        ]
        n = len(bucket)
        if n == 0:
            rows.append(
                {
                    "bucket": f"{int(lo * 100)}-{int(hi * 100)}%",
                    "predicted": round((lo + hi) / 2, 3),
                    "observed": round((lo + hi) / 2, 3),
                    "sample_size": 0,
                }
            )
            continue
        predicted = sum(e.current_probability for e in bucket) / n
        observed = sum(e.outcome or 0 for e in bucket) / n
        rows.append(
            {
                "bucket": f"{int(lo * 100)}-{int(hi * 100)}%",
                "predicted": round(predicted, 3),
                "observed": round(observed, 3),
                "sample_size": n,
            }
        )
    return rows


def severity_for(score: float) -> str:
    if score >= 0.65:
        return "critical"
    if score >= 0.45:
        return "high"
    if score >= 0.25:
        return "medium"
    return "low"
