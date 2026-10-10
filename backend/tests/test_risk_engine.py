"""Unit tests for Phase 2 — Risk Engine & Vulnerability Scoring."""
from __future__ import annotations
import pytest
from backend.app.config import RiskConfig, load_risk_config
from backend.app.models import SourceType, WaterSource, RiskBand
from backend.app.risk_engine import (
    score_single_source,
    score_all_sources,
    normalize_features,
    determine_risk_band,
)
from backend.app.data_generator import generate_synthetic_dataset


@pytest.fixture
def risk_cfg() -> RiskConfig:
    return load_risk_config()


def test_weights_sum_to_one(risk_cfg):
    total_weights = sum(risk_cfg.weights.values())
    assert pytest.approx(total_weights, rel=1e-4) == 1.0


def test_score_bounded_and_deterministic(risk_cfg):
    src = WaterSource(
        source_code="SYN-TEST-01",
        latitude=13.05,
        longitude=80.23,
        source_type=SourceType.WELL,
        ward_id="Ward-1",
        population_served=1500,
        drain_distance_m=120.0,
        flood_exposure=0.85,
        historical_risk=0.60,
        source_vulnerability=0.70,
    )

    s1 = score_single_source(src, risk_cfg)
    s2 = score_single_source(src, risk_cfg)

    assert 0.0 <= s1.relative_vulnerability_score <= 1.0
    assert s1.relative_vulnerability_score == s2.relative_vulnerability_score
    assert s1.feature_contributions == s2.feature_contributions
    assert s1.missing_features == []
    assert s1.quality_score == 1.0


def test_missing_data_neutral_imputation_and_penalty(risk_cfg):
    """Verify that missing features are NEVER silent zeroes and impute at 0.5 with quality penalty."""
    src_missing = WaterSource(
        source_code="SYN-MISSING-01",
        latitude=13.05,
        longitude=80.23,
        source_type=SourceType.PUBLIC_TAP,
        population_served=2000,
        drain_distance_m=None,  # missing
        flood_exposure=0.50,
        historical_risk=None,   # missing
        source_vulnerability=0.50,
    )

    scored = score_single_source(src_missing, risk_cfg)

    # Historical risk and drain proximity must be explicitly listed as missing
    assert "historical_risk" in scored.missing_features
    assert "drain_proximity_risk" in scored.missing_features
    assert len(scored.missing_features) == 2

    # Imputed at 0.5 * weight
    expected_hist_contrib = round(risk_cfg.weights["historical_risk"] * 0.5, 4)
    expected_drain_contrib = round(risk_cfg.weights["drain_proximity_risk"] * 0.5, 4)

    assert scored.feature_contributions["historical_risk"] == expected_hist_contrib
    assert scored.feature_contributions["drain_proximity_risk"] == expected_drain_contrib

    # Quality score reduced: 1 - 2/5 = 0.60
    assert scored.quality_score == 0.60
    assert scored.data_quality == "partial"


def test_monotonicity_flood_and_drainage(risk_cfg):
    """Increasing flood exposure or moving closer to drainage must never lower vulnerability score."""
    base_src = WaterSource(
        source_code="SYN-BASE",
        latitude=13.05,
        longitude=80.23,
        source_type=SourceType.WELL,
        population_served=1000,
        drain_distance_m=500.0,
        flood_exposure=0.30,
        historical_risk=0.40,
        source_vulnerability=0.50,
    )
    score_base = score_single_source(base_src, risk_cfg).relative_vulnerability_score

    # 1. Higher flood exposure
    src_higher_flood = base_src.model_copy(update={"flood_exposure": 0.90})
    score_flood = score_single_source(src_higher_flood, risk_cfg).relative_vulnerability_score
    assert score_flood > score_base

    # 2. Closer to drainage (100m instead of 500m)
    src_closer_drain = base_src.model_copy(update={"drain_distance_m": 100.0})
    score_drain = score_single_source(src_closer_drain, risk_cfg).relative_vulnerability_score
    assert score_drain > score_base


def test_contributions_sum_strictly_to_total_score(risk_cfg):
    _, sources, _ = generate_synthetic_dataset(seed=42, num_sources=100, num_pop_units=10)
    scored_dict = score_all_sources(sources, risk_cfg)

    for s_id, scored in scored_dict.items():
        sum_contribs = round(sum(scored.feature_contributions.values()), 4)
        assert pytest.approx(sum_contribs, rel=1e-4) == scored.relative_vulnerability_score
        assert scored.is_synthetic is True
        assert "not evidence of water contamination" in scored.explanation


def test_risk_band_thresholds(risk_cfg):
    assert determine_risk_band(0.10, risk_cfg.bands) == RiskBand.LOW
    assert determine_risk_band(0.35, risk_cfg.bands) == RiskBand.MODERATE
    assert determine_risk_band(0.65, risk_cfg.bands) == RiskBand.HIGH
    assert determine_risk_band(0.85, risk_cfg.bands) == RiskBand.VERY_HIGH


def test_weight_sensitivity_rank_stability(risk_cfg):
    """Perturbing weights by +-20% should maintain strong rank correlation (Spearman rho > 0.85)."""
    _, sources, _ = generate_synthetic_dataset(seed=42, num_sources=200, num_pop_units=10)

    # Base scores
    base_scored = list(score_all_sources(sources, risk_cfg).values())
    base_ranks = {s.source_id: rank for rank, s in enumerate(sorted(base_scored, key=lambda x: x.relative_vulnerability_score, reverse=True))}

    # Perturbed config (+20% flood, -20% drain)
    perturbed_weights = {
        "flood_exposure": 0.36,
        "drain_proximity_risk": 0.20,
        "historical_risk": 0.14,
        "source_vulnerability": 0.15,
        "population_exposure": 0.15,
    }
    # normalize weights
    s_weights = sum(perturbed_weights.values())
    perturbed_weights = {k: v / s_weights for k, v in perturbed_weights.items()}

    perturbed_cfg = RiskConfig(
        version="risk-v1-perturbed",
        weights=perturbed_weights,
        neutral_value=0.5,
    )

    pert_scored = list(score_all_sources(sources, perturbed_cfg).values())
    pert_ranks = {s.source_id: rank for rank, s in enumerate(sorted(pert_scored, key=lambda x: x.relative_vulnerability_score, reverse=True))}

    # Spearman rank correlation calculation
    n = len(sources)
    d_sq_sum = sum((base_ranks[s_id] - pert_ranks[s_id]) ** 2 for s_id in base_ranks)
    rho = 1.0 - (6.0 * d_sq_sum) / (n * (n**2 - 1))

    # Top-20 overlap
    top20_base = set(list(base_ranks.keys())[:20])
    top20_pert = set(list(pert_ranks.keys())[:20])
    top20_overlap = len(top20_base & top20_pert) / 20.0

    print(f"\n[Sensitivity] Spearman rho: {rho:.3f} | Top-20 Overlap: {top20_overlap*100:.1f}%")
    assert rho > 0.85
    assert top20_overlap >= 0.70
