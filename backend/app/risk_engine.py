"""Risk Engine for FloodSafe.

Calculates transparent, explainable relative vulnerability priority scores
for drinking-water sources.

Pure, deterministic module: zero DB sessions, zero request objects.
"""
from __future__ import annotations
from typing import Any, Dict, List, Optional, Tuple
from backend.app.config import RiskConfig, load_risk_config
from backend.app.models import RiskBand, ScoredSource, WaterSource
from backend.app.geo_utils import compute_drain_proximity_risk


POPULATION_NORMALIZATION_MAX = 5000.0


def normalize_features(
    source: WaterSource,
    max_drain_distance_m: float = 1000.0,
    max_population: float = POPULATION_NORMALIZATION_MAX,
) -> Dict[str, Optional[float]]:
    """
    Extracts and normalizes raw source attributes into a [0.0, 1.0] scale.
    Missing features are explicitly preserved as None (no silent zeroes).
    """
    # 1. Flood Exposure (already [0, 1] or None)
    flood_norm = (
        min(max(source.flood_exposure, 0.0), 1.0)
        if source.flood_exposure is not None
        else None
    )

    # 2. Drain Proximity Risk (closer to drain -> higher risk)
    drain_norm = (
        compute_drain_proximity_risk(source.drain_distance_m, max_drain_distance_m)
        if source.drain_distance_m is not None
        else None
    )

    # 3. Historical Risk (already [0, 1] or None)
    hist_norm = (
        min(max(source.historical_risk, 0.0), 1.0)
        if source.historical_risk is not None
        else None
    )

    # 4. Source Vulnerability ([0, 1] rule-based or None)
    vuln_norm = (
        min(max(source.source_vulnerability, 0.0), 1.0)
        if source.source_vulnerability is not None
        else None
    )

    # 5. Population Exposure (normalized by reference max served)
    pop_norm = (
        min(max(float(source.population_served) / max_population, 0.0), 1.0)
        if source.population_served is not None
        else None
    )

    return {
        "flood_exposure": flood_norm,
        "drain_proximity_risk": drain_norm,
        "historical_risk": hist_norm,
        "source_vulnerability": vuln_norm,
        "population_exposure": pop_norm,
    }


def determine_risk_band(score: float, bands: Dict[str, Tuple[float, float]]) -> RiskBand:
    """Classifies a score into display bands."""
    if score >= bands.get("very_high", (0.75, 1.00))[0]:
        return RiskBand.VERY_HIGH
    elif score >= bands.get("high", (0.50, 0.75))[0]:
        return RiskBand.HIGH
    elif score >= bands.get("moderate", (0.25, 0.50))[0]:
        return RiskBand.MODERATE
    else:
        return RiskBand.LOW


def generate_source_explanation(
    source_code: str,
    score: float,
    band: RiskBand,
    contributions: Dict[str, float],
    missing_features: List[str],
    quality_score: float,
    population_served: int,
    spatial_uplift: float = 0.0,
    uplift_sources: List[Dict[str, Any]] | None = None,
) -> str:
    """
    Constructs a plain-language explanation matching exact contribution values.
    Explicitly clarifies this is a triage priority, never a contamination diagnosis.
    """
    sorted_contributors = sorted(
        contributions.items(), key=lambda item: item[1], reverse=True
    )
    top_factors = [
        f"{k.replace('_', ' ')} (contrib: {v:.3f})"
        for k, v in sorted_contributors[:3]
        if v > 0.0
    ]
    top_text = ", ".join(top_factors) if top_factors else "baseline indicators"

    uplift_text = ""
    if spatial_uplift > 0 and uplift_sources:
        origin_codes = ", ".join([f"{u.get('source_code')} ({u.get('distance_m')}m)" for u in uplift_sources[:2]])
        uplift_text = f" Includes +{spatial_uplift:.3f} dynamic spatial uplift propagated from nearby abnormal test results [{origin_codes}]."

    missing_text = ""
    if missing_features:
        missing_names = ", ".join(m.replace("_", " ") for m in missing_features)
        missing_text = f" Inputs missing: [{missing_names}], imputed at neutral 0.5 (quality confidence: {quality_score*100:.0f}%)."
    else:
        missing_text = " All feature inputs verified complete (quality confidence: 100%)."

    explanation = (
        f"Source {source_code} has a relative vulnerability score of {score:.2f} ({band.value} band). "
        f"Prioritized primarily due to {top_text}, serving ~{population_served:,} residents.{uplift_text}{missing_text} "
        f"This score establishes field verification priority and is not evidence of water contamination."
    )
    return explanation


def score_single_source(
    source: WaterSource,
    cfg: RiskConfig,
    neighbor_uplift: float = 0.0,
    uplift_sources: List[Dict[str, Any]] | None = None,
) -> ScoredSource:
    """
    Scores an individual water source against the versioned RiskConfig.
    Guarantees exact contribution summation, spatial propagation, and transparent missing-data handling.
    """
    norm_features = normalize_features(source)
    contributions: Dict[str, float] = {}
    missing_features: List[str] = []

    total_weight = sum(cfg.weights.values())
    if total_weight <= 0:
        total_weight = 1.0

    for name, weight in cfg.weights.items():
        val = norm_features.get(name)
        if val is None:
            missing_features.append(name)
            # Neutral imputation policy
            imputed_val = cfg.neutral_value
            contributions[name] = round(weight * imputed_val, 4)
        else:
            contributions[name] = round(weight * val, 4)

    raw_score = sum(contributions.values()) + neighbor_uplift
    final_score = round(min(max(raw_score, 0.0), 1.0), 4)

    quality_score = round(1.0 - (len(missing_features) / len(cfg.weights)), 2)
    data_quality = "complete" if quality_score == 1.0 else ("partial" if quality_score >= 0.5 else "stale")
    band = determine_risk_band(final_score, cfg.bands)

    uplift_list = uplift_sources or []

    explanation = generate_source_explanation(
        source_code=source.source_code,
        score=final_score,
        band=band,
        contributions=contributions,
        missing_features=missing_features,
        quality_score=quality_score,
        population_served=source.population_served,
        spatial_uplift=neighbor_uplift,
        uplift_sources=uplift_list,
    )

    return ScoredSource(
        source_id=source.id,
        source_code=source.source_code,
        source_type=source.source_type,
        latitude=source.latitude,
        longitude=source.longitude,
        ward_id=source.ward_id,
        population_served=source.population_served,
        relative_vulnerability_score=final_score,
        band=band,
        feature_values=norm_features,
        feature_contributions=contributions,
        missing_features=missing_features,
        data_quality=data_quality,
        quality_score=quality_score,
        spatial_uplift=neighbor_uplift,
        uplift_sources=uplift_list,
        explanation=explanation,
        config_version=cfg.version,
        data_version="synthetic-v1",
        is_synthetic=True,
    )


def score_all_sources(
    sources: List[WaterSource],
    cfg: RiskConfig | None = None,
    neighbor_uplifts: Dict[str, float] | None = None,
    uplift_sources_map: Dict[str, List[Dict[str, Any]]] | None = None,
) -> Dict[str, ScoredSource]:
    """
    Evaluates relative vulnerability priority for a collection of sources.
    Returns a mapping of source_id -> ScoredSource.
    """
    if cfg is None:
        cfg = load_risk_config()

    uplifts = neighbor_uplifts or {}
    uplift_map = uplift_sources_map or {}
    results: Dict[str, ScoredSource] = {}
    for src in sources:
        uplift = uplifts.get(src.id, 0.0)
        up_srcs = uplift_map.get(src.id, [])
        results[src.id] = score_single_source(
            src, cfg, neighbor_uplift=uplift, uplift_sources=up_srcs
        )
    return results
