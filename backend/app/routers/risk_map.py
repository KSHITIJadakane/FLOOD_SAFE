"""Risk Map GeoJSON API Router."""
from __future__ import annotations
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query
from backend.app.storage import storage
from backend.app.routers.assessments import run_risk_assessment
from backend.app.models import RunAssessmentRequest


router = APIRouter(prefix="/api/v1/risk-map", tags=["Risk Map"])


@router.get("", response_model=Dict[str, Any])
def get_risk_map_geojson(
    event_id: Optional[str] = None,
    plan_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Returns map-ready GeoJSON bundle with:
    - Flood Inundation MultiPolygon layer
    - Water Sources Point features with risk scores & band colors
    - Selected Plan Sites with ranking and coverage radius
    - Population clusters summary
    """
    events = storage.list_events()
    active_event = None
    if event_id:
        active_event = storage.get_event(event_id)
    if not active_event and events:
        active_event = events[0]

    if not active_event:
        return {"type": "FeatureCollection", "features": [], "is_synthetic": True}

    assessment = storage.get_latest_assessment(active_event.id)
    if not assessment:
        assessment = run_risk_assessment(RunAssessmentRequest(event_id=active_event.id))

    # Resolve testing plan if available
    plan = None
    if plan_id:
        plan = storage.get_testing_plan(plan_id)
    else:
        for p in reversed(list(storage.testing_plans.values())):
            if p.event_id == active_event.id:
                plan = p
                break

    selected_order_map = {}
    if plan:
        for s in plan.selected:
            selected_order_map[s.source_id] = s.order

    features: List[Dict[str, Any]] = []

    # 1. Flood Inundation Geometry
    if active_event.geometry:
        features.append({
            "type": "Feature",
            "id": f"flood-{active_event.id}",
            "geometry": active_event.geometry,
            "properties": {
                "layer_type": "flood_zone",
                "name": active_event.name,
                "data_version": active_event.data_version,
                "is_synthetic": True,
            }
        })

    # 2. Water Sources Points
    for src in assessment.scores.values():
        sel_order = selected_order_map.get(src.source_id)
        features.append({
            "type": "Feature",
            "id": src.source_id,
            "geometry": {
                "type": "Point",
                "coordinates": [src.longitude, src.latitude],
            },
            "properties": {
                "layer_type": "water_source",
                "source_id": src.source_id,
                "source_code": src.source_code,
                "source_type": src.source_type.value,
                "ward_id": src.ward_id,
                "population_served": src.population_served,
                "relative_vulnerability_score": src.relative_vulnerability_score,
                "band": src.band.value,
                "quality_score": src.quality_score,
                "data_quality": src.data_quality,
                "missing_features": src.missing_features,
                "is_selected": sel_order is not None,
                "selection_order": sel_order,
                "is_synthetic": True,
            }
        })

    # 3. Selected Plan Coverage Radii
    if plan:
        for s in plan.selected:
            features.append({
                "type": "Feature",
                "id": f"coverage-{s.source_id}",
                "geometry": {
                    "type": "Point",
                    "coordinates": [s.longitude, s.latitude],
                },
                "properties": {
                    "layer_type": "coverage_circle",
                    "source_id": s.source_id,
                    "source_code": s.source_code,
                    "selection_order": s.order,
                    "radius_m": plan.coverage_definition.get("radius_m", 500.0),
                    "marginal_coverage": s.marginal_coverage,
                    "is_synthetic": True,
                }
            })

    return {
        "type": "FeatureCollection",
        "event_id": active_event.id,
        "event_name": active_event.name,
        "plan_id": plan.plan_id if plan else None,
        "features": features,
        "is_synthetic": True,
    }
