"""Water Sources API Router."""
from __future__ import annotations
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.models import ScoredSource, WaterSource
from backend.app.storage import storage
from backend.app.risk_engine import score_all_sources, score_single_source
from backend.app.config import load_risk_config


router = APIRouter(prefix="/api/v1/sources", tags=["Water Sources"])


@router.get("", response_model=List[ScoredSource])
def list_sources(
    event_id: Optional[str] = None,
    ward_id: Optional[str] = None,
    source_type: Optional[str] = None,
    band: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=500, le=1000),
    offset: int = Query(default=0, ge=0),
) -> List[ScoredSource]:
    """Lists water sources with current vulnerability scores and filtering."""
    events = storage.list_events()
    active_event_id = event_id or (events[0].id if events else None)
    
    # Check if we have an active assessment run
    assessment = storage.get_latest_assessment(active_event_id) if active_event_id else None
    
    if assessment and assessment.scores:
        scored_list = list(assessment.scores.values())
    else:
        # Score dynamically on the fly
        raw_sources = storage.get_sources()
        cfg = load_risk_config()
        scored_map = score_all_sources(raw_sources, cfg)
        scored_list = list(scored_map.values())

    # Apply filters
    filtered = scored_list
    if ward_id:
        filtered = [s for s in filtered if s.ward_id == ward_id]
    if source_type:
        filtered = [s for s in filtered if s.source_type.value == source_type]
    if band:
        filtered = [s for s in filtered if s.band.value == band]
    if search:
        s_lower = search.lower()
        filtered = [
            s for s in filtered
            if s_lower in s.source_code.lower() or (s.ward_id and s_lower in s.ward_id.lower())
        ]

    # Sort by relative vulnerability score descending
    filtered.sort(key=lambda s: s.relative_vulnerability_score, reverse=True)
    return filtered[offset : offset + limit]


@router.get("/{source_id}", response_model=ScoredSource)
def get_source_detail(source_id: str, event_id: Optional[str] = None) -> ScoredSource:
    """Retrieves full explainability details for a single water source."""
    events = storage.list_events()
    active_event_id = event_id or (events[0].id if events else None)

    if active_event_id:
        assessment = storage.get_latest_assessment(active_event_id)
        if assessment and assessment.scores:
            if source_id in assessment.scores:
                return assessment.scores[source_id]
            # Try matching by source_code
            for s in assessment.scores.values():
                if s.source_code == source_id:
                    return s

    raw_src = storage.get_source_by_id(source_id)
    if not raw_src:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Source {source_id} not found."}
        )

    cfg = load_risk_config()
    return score_single_source(raw_src, cfg)
