from __future__ import annotations

from typing import Iterable

from ..models import MarketEvent


def generate_event_explanation(
    *,
    title: str,
    base_explanation: str,
    adjusted: float,
    market: float,
    divergence: float,
    drift: float,
    category: str,
    source: str,
    cat_bias: float,
    src_bias: float,
) -> str:
    delta = (adjusted - market) * 100
    parts = [base_explanation]
    if abs(delta) >= 1:
        direction = "above" if delta > 0 else "below"
        parts.append(
            f"Calibrated estimate is {abs(delta):.1f} pts {direction} the {source} quote of "
            f"{market * 100:.0f}%."
        )
    if abs(cat_bias) >= 0.05:
        skew = "overestimates" if cat_bias > 0 else "underestimates"
        parts.append(f"Historically the {category} category {skew} YES outcomes by {abs(cat_bias) * 100:.0f} pts.")
    if abs(src_bias) >= 0.05:
        skew = "overestimates" if src_bias > 0 else "underestimates"
        parts.append(f"{source} tends to {skew} resolved YES outcomes in our sample.")
    if divergence >= 0.40:
        parts.append(f"Cross-platform divergence is elevated ({divergence:.2f}).")
    if drift >= 0.45:
        parts.append(f"Recent odds drift is high ({drift:.2f}) — fresh signal is moving the market.")
    return " ".join(parts)


def generate_dashboard_insights(events: Iterable[MarketEvent], summary: dict) -> list[dict]:
    """Return short narrative bullets for the dashboard panel."""
    evs = list(events)
    insights: list[dict] = []
    if not evs:
        return insights

    # 1. best calibrated source
    by_source: dict[str, list[MarketEvent]] = {}
    for e in evs:
        if e.outcome is None:
            continue
        if e.source:
            by_source.setdefault(e.source.display_name, []).append(e)
    if by_source:
        ranked = sorted(
            ((s, sum(x.brier_score for x in g) / len(g), len(g)) for s, g in by_source.items()),
            key=lambda x: x[1],
        )
        top_src, top_brier, n = ranked[0]
        insights.append(
            {
                "id": "best-calibrated",
                "icon": "trophy",
                "title": f"{top_src} is best calibrated",
                "body": f"Lowest mean Brier score ({top_brier:.3f}) across {n} resolved events.",
                "metric": f"Brier {top_brier:.3f}",
                "tone": "positive",
            }
        )

    # 2. most biased category
    by_cat: dict[str, list[MarketEvent]] = {}
    for e in evs:
        if e.outcome is None:
            continue
        by_cat.setdefault(e.category, []).append(e)
    if by_cat:
        biases = [
            (cat, sum((x.current_probability - (x.outcome or 0)) for x in g) / len(g), len(g))
            for cat, g in by_cat.items()
        ]
        biases.sort(key=lambda x: -abs(x[1]))
        cat, b, n = biases[0]
        skew = "overestimates" if b > 0 else "underestimates"
        insights.append(
            {
                "id": "biased-category",
                "icon": "trend",
                "title": f"{cat.title()} markets {skew} YES",
                "body": f"Average bias of {b * 100:+.1f} pts across {n} resolved {cat} events.",
                "metric": f"Bias {b * 100:+.1f}%",
                "tone": "warning" if abs(b) > 0.08 else "neutral",
            }
        )

    # 3. top divergence event
    divergent = sorted(evs, key=lambda x: -x.divergence_score)
    if divergent and divergent[0].divergence_score > 0.0:
        d = divergent[0]
        insights.append(
            {
                "id": "top-divergence",
                "icon": "diff",
                "title": "Sharpest cross-market disagreement",
                "body": f"{d.title} shows {d.divergence_score:.2f} divergence between platforms.",
                "metric": f"Δ {d.divergence_score:.2f}",
                "tone": "warning",
            }
        )

    # 4. mispricing alert
    flagged = sorted(evs, key=lambda x: -x.edge_score)
    if flagged and flagged[0].edge_score > 0.0:
        f = flagged[0]
        insights.append(
            {
                "id": "top-edge",
                "icon": "alert",
                "title": "Top mispricing signal",
                "body": f"{f.title} flagged as {f.signal_label} with edge {f.edge_score:.2f}.",
                "metric": f"Edge {f.edge_score:.2f}",
                "tone": "danger" if f.signal_label != "neutral" else "neutral",
            }
        )

    # 5. activity
    insights.append(
        {
            "id": "activity",
            "icon": "pulse",
            "title": "Live market coverage",
            "body": f"Tracking {summary['total_events']} events across {summary['sources']} platforms with "
            f"{summary['flagged_events']} active alerts.",
            "metric": f"{summary['active_events']} active",
            "tone": "neutral",
        }
    )

    return insights[:5]
