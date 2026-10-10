"""Router for Risk Engine Configuration & Dynamic Weight Tuning (What-If Sensitivity Analysis)."""
from __future__ import annotations
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from backend.app.auth import require_auth
from backend.app.config import RiskConfig, load_risk_config, set_active_risk_config, get_project_root
from backend.app.storage import storage
from backend.app.risk_engine import score_all_sources
import yaml

router = APIRouter(prefix="/api/v1/config", tags=["Configuration & What-If Tuning"])


class RiskWeightsUpdate(BaseModel):
    flood_exposure: float = Field(..., ge=0.0, le=1.0)
    drain_proximity_risk: float = Field(..., ge=0.0, le=1.0)
    historical_risk: float = Field(..., ge=0.0, le=1.0)
    source_vulnerability: float = Field(..., ge=0.0, le=1.0)
    population_exposure: float = Field(..., ge=0.0, le=1.0)


class RiskConfigResponse(BaseModel):
    version: str
    weights: Dict[str, float]
    neutral_value: float
    bands: Dict[str, Any]
    optimizer: Dict[str, Any]
    feedback: Dict[str, Any]
    is_custom_tuned: bool = False


@router.get("/risk", response_model=RiskConfigResponse)
def get_risk_config(user_info: tuple = Depends(require_auth("ViewQueue", "FloodEvent"))):
    """Get active risk scoring configuration and MCDA weights."""
    cfg = load_risk_config()
    root = get_project_root()
    yaml_path = root / "config" / "risk_config_v1.yaml"
    is_custom = False
    if yaml_path.exists():
        with open(yaml_path, "r", encoding="utf-8") as f:
            base_data = yaml.safe_load(f) or {}
            base_weights = base_data.get("weights", {})
            if base_weights != cfg.weights:
                is_custom = True

    return RiskConfigResponse(
        version=cfg.version,
        weights=cfg.weights,
        neutral_value=cfg.neutral_value,
        bands=cfg.bands,
        optimizer=cfg.optimizer,
        feedback=cfg.feedback,
        is_custom_tuned=is_custom,
    )


@router.put("/risk", response_model=RiskConfigResponse)
def update_risk_weights(
    payload: RiskWeightsUpdate,
    user_info: tuple = Depends(require_auth("RunAssessment", "FloodEvent")),
):
    """
    Update MCDA risk weights on the fly for Real-Time What-If Sensitivity analysis.
    Validates that sum of weights > 0, normalizes to sum to 1.0, and sets active configuration.
    """
    raw_weights = {
        "flood_exposure": float(payload.flood_exposure),
        "drain_proximity_risk": float(payload.drain_proximity_risk),
        "historical_risk": float(payload.historical_risk),
        "source_vulnerability": float(payload.source_vulnerability),
        "population_exposure": float(payload.population_exposure),
    }

    total = sum(raw_weights.values())
    if total <= 0.0001:
        raise HTTPException(status_code=400, detail="Total weights sum must be greater than 0.")

    # Normalize weights so they sum to 1.0
    normalized_weights = {k: round(v / total, 4) for k, v in raw_weights.items()}
    diff = round(1.0 - sum(normalized_weights.values()), 4)
    normalized_weights["flood_exposure"] = round(normalized_weights["flood_exposure"] + diff, 4)

    curr = load_risk_config()
    new_cfg = RiskConfig(
        version=f"{curr.version}-tuned",
        weights=normalized_weights,
        neutral_value=curr.neutral_value,
        bands=curr.bands,
        optimizer=curr.optimizer,
        feedback=curr.feedback,
    )
    set_active_risk_config(new_cfg)

    # Recompute any existing events' assessment in storage
    events = storage.list_events()
    for ev in events:
        sources = storage.get_sources()
        if sources:
            scored_dict = score_all_sources(sources, cfg=new_cfg)
            from backend.app.models import AssessmentRun
            new_assessment = AssessmentRun(
                event_id=ev.id,
                config_version=new_cfg.version,
                data_version="data-synthetic-v1",
                sources_scored=len(scored_dict),
                scores=scored_dict,
            )
            storage.save_assessment_run(new_assessment)

    return RiskConfigResponse(
        version=new_cfg.version,
        weights=new_cfg.weights,
        neutral_value=new_cfg.neutral_value,
        bands=new_cfg.bands,
        optimizer=new_cfg.optimizer,
        feedback=new_cfg.feedback,
        is_custom_tuned=True,
    )


@router.post("/risk/reset", response_model=RiskConfigResponse)
def reset_risk_weights(
    user_info: tuple = Depends(require_auth("RunAssessment", "FloodEvent")),
):
    """Reset MCDA risk weights back to default YAML configuration baseline."""
    root = get_project_root()
    yaml_path = root / "config" / "risk_config_v1.yaml"
    if yaml_path.exists():
        with open(yaml_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
            base_cfg = RiskConfig(
                version=data.get("config_version", "risk-v1"),
                weights=data.get("weights", {
                    "flood_exposure": 0.30,
                    "drain_proximity_risk": 0.25,
                    "historical_risk": 0.15,
                    "source_vulnerability": 0.15,
                    "population_exposure": 0.15,
                }),
                neutral_value=float(data.get("missing_policy", {}).get("neutral_value", 0.5)),
                bands={
                    "low": (0.00, 0.25),
                    "moderate": (0.25, 0.50),
                    "high": (0.50, 0.75),
                    "very_high": (0.75, 1.00),
                },
                optimizer=data.get("optimizer", {
                    "coverage_radius_m": 500.0,
                    "objective": "max_unique_high_risk_population",
                    "baseline_trials": 1000,
                }),
                feedback=data.get("feedback", {
                    "neighbor_radius_m": 300.0,
                    "abnormal_uplift": 0.15,
                }),
            )
            set_active_risk_config(base_cfg)
    else:
        base_cfg = load_risk_config()

    # Recompute existing assessments
    events = storage.list_events()
    for ev in events:
        sources = storage.get_sources()
        if sources:
            scored_dict = score_all_sources(sources, cfg=base_cfg)
            from backend.app.models import AssessmentRun
            new_assessment = AssessmentRun(
                event_id=ev.id,
                config_version=base_cfg.version,
                data_version="data-synthetic-v1",
                sources_scored=len(scored_dict),
                scores=scored_dict,
            )
            storage.save_assessment_run(new_assessment)

    return RiskConfigResponse(
        version=base_cfg.version,
        weights=base_cfg.weights,
        neutral_value=base_cfg.neutral_value,
        bands=base_cfg.bands,
        optimizer=base_cfg.optimizer,
        feedback=base_cfg.feedback,
        is_custom_tuned=False,
    )
