"""Risk Assessments & Testing Queue API Router."""
from __future__ import annotations
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.app.models import (
    AssessmentRun,
    RunAssessmentRequest,
    ScoredSource,
)
from backend.app.storage import storage
from backend.app.risk_engine import score_all_sources
from backend.app.config import load_risk_config
from backend.app.geo_utils import haversine_distance_m, compute_spatial_contamination_propagation
from backend.app.auth import require_auth


router = APIRouter(prefix="/api/v1", tags=["Risk Assessments"])


@router.post(
    "/risk-assessments/run",
    response_model=AssessmentRun,
    dependencies=[Depends(require_auth("RunAssessment", "FloodEvent"))],
)
def run_risk_assessment(req: RunAssessmentRequest) -> AssessmentRun:
    """Executes or refreshes relative vulnerability assessment for all sources in an event."""
    event = storage.get_event(req.event_id)
    if not event:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Flood event {req.event_id} not found."}
        )

    cfg = load_risk_config()
    raw_sources = storage.get_sources()

    # Calculate graph-aware spatial uplifts based on any recorded abnormal field tests in this event
    field_tests = storage.get_field_tests(req.event_id)
    abnormal_sources = [
        storage.get_source_by_id(t.source_id)
        for t in field_tests
        if t.result_category.value == "abnormal"
    ]
    abnormal_dicts = [
        {
            "id": s.id,
            "source_code": s.source_code,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "drain_distance_m": s.drain_distance_m,
        }
        for s in abnormal_sources if s is not None
    ]

    uplifts: Dict[str, float] = {}
    uplift_sources_map: Dict[str, List[Dict[str, Any]]] = {}

    for src in raw_sources:
        # Check if the source itself is directly abnormal
        is_direct_abnormal = any(ab["id"] == src.id for ab in abnormal_dicts)
        
        # Compute spatial propagation from all abnormal test sites
        spatial_uplift, contributors = compute_spatial_contamination_propagation(
            target_lat=src.latitude,
            target_lon=src.longitude,
            target_drain_dist_m=src.drain_distance_m,
            abnormal_sources=abnormal_dicts,
            max_distance_m=1200.0,
            sigma_m=400.0,
            base_uplift=cfg.feedback.get("abnormal_uplift", 0.15),
        )

        if is_direct_abnormal:
            spatial_uplift = max(spatial_uplift, 0.25)

        if spatial_uplift > 0:
            uplifts[src.id] = spatial_uplift
            uplift_sources_map[src.id] = contributors

    scored_map = score_all_sources(
        raw_sources,
        cfg,
        neighbor_uplifts=uplifts,
        uplift_sources_map=uplift_sources_map,
    )

    run = AssessmentRun(
        event_id=req.event_id,
        sources_scored=len(scored_map),
        config_version=cfg.version,
        data_version=event.data_version,
        is_synthetic=True,
        scores=scored_map,
    )
    storage.save_assessment_run(run)
    return run


@router.get("/testing-queue", response_model=List[Dict[str, Any]])
def get_testing_queue(
    event_id: Optional[str] = None,
    plan_id: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
) -> List[Dict[str, Any]]:
    """Returns ranked candidate queue with optimizer selection status."""
    events = storage.list_events()
    active_event_id = event_id or (events[0].id if events else None)
    if not active_event_id:
        return []

    # Get latest assessment
    assessment = storage.get_latest_assessment(active_event_id)
    if not assessment:
        # Run default
        assessment = run_risk_assessment(RunAssessmentRequest(event_id=active_event_id))

    # Check active plan selections
    plan = None
    if plan_id:
        plan = storage.get_testing_plan(plan_id)
    else:
        # Latest plan for this event
        for p in reversed(list(storage.testing_plans.values())):
            if p.event_id == active_event_id:
                plan = p
                break

    selected_map: Dict[str, int] = {}
    if plan:
        for site in plan.selected:
            selected_map[site.source_id] = site.order

    queue: List[Dict[str, Any]] = []
    sorted_sources = sorted(
        assessment.scores.values(),
        key=lambda s: s.relative_vulnerability_score,
        reverse=True
    )

    for rank, src in enumerate(sorted_sources, start=1):
        is_selected = src.source_id in selected_map
        sel_order = selected_map.get(src.source_id)

        top_contributions = sorted(
            src.feature_contributions.items(), key=lambda x: x[1], reverse=True
        )[:2]
        top_factors = [
            f"{k.replace('_', ' ')} ({v:.3f})" for k, v in top_contributions
        ]

        queue.append({
            "rank": rank,
            "source_id": src.source_id,
            "source_code": src.source_code,
            "source_type": src.source_type.value,
            "ward_id": src.ward_id,
            "latitude": src.latitude,
            "longitude": src.longitude,
            "relative_vulnerability_score": src.relative_vulnerability_score,
            "band": src.band.value,
            "population_served": src.population_served,
            "top_factors": top_factors,
            "quality_score": src.quality_score,
            "data_quality": src.data_quality,
            "spatial_uplift": getattr(src, "spatial_uplift", 0.0),
            "uplift_sources": getattr(src, "uplift_sources", []),
            "missing_features": src.missing_features,
            "is_selected_by_optimizer": is_selected,
            "selection_order": sel_order,
            "is_synthetic": True,
        })

    return queue[offset : offset + limit]
