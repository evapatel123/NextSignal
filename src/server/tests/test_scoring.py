from __future__ import annotations

import math

from src.server.services.scoring import (
    adjust_probability,
    bias,
    brier_score,
    calibration_error,
    divergence_across_platforms,
    edge_score,
    severity_for,
    signal_label_from,
)


def test_brier_score():
    assert brier_score(1.0, 1) == 0.0
    assert brier_score(0.0, 1) == 1.0
    assert math.isclose(brier_score(0.5, 1), 0.25)


def test_calibration_error():
    assert math.isclose(calibration_error(0.7, 1), 0.3)
    assert math.isclose(calibration_error(0.7, 0), 0.7)


def test_bias_signed():
    assert bias(0.6, 1) < 0
    assert bias(0.6, 0) > 0


def test_divergence_increases_with_spread():
    low = divergence_across_platforms([0.50, 0.51, 0.49])
    high = divergence_across_platforms([0.20, 0.80, 0.50])
    assert high > low


def test_edge_score_bounded():
    s = edge_score(0.95, 0.05, 0.9, 0.9)
    assert 0.0 <= s <= 1.0


def test_adjust_probability_pulls_with_drift():
    base = 0.80
    quiet = adjust_probability(base, category_bias=0.0, source_bias=0.0, sample_size=20, drift=0.0, divergence=0.0)
    noisy = adjust_probability(base, category_bias=0.0, source_bias=0.0, sample_size=20, drift=1.0, divergence=1.0)
    assert quiet > noisy
    assert 0 < noisy < 1
    assert 0 < quiet < 1


def test_signal_label_neutral():
    label, _ = signal_label_from(0.50, 0.50, 0.05, 0.05)
    assert label == "neutral"


def test_signal_label_underpriced():
    label, _ = signal_label_from(0.70, 0.55, 0.10, 0.10)
    assert label == "underpriced"


def test_severity_thresholds():
    assert severity_for(0.10) == "low"
    assert severity_for(0.30) == "medium"
    assert severity_for(0.50) == "high"
    assert severity_for(0.80) == "critical"
