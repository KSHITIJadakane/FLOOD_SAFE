"""Audit & Provenance API Router."""
from __future__ import annotations
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from backend.app.storage import storage
from backend.app.auth import require_auth


router = APIRouter(prefix="/api/v1/audit", tags=["Audit & Provenance"])


@router.get(
    "/assessments/{assessment_id}",
    response_model=Dict[str, Any],
    dependencies=[Depends(require_auth("ViewAudit", "FloodEvent"))],
)
def get_assessment_audit(assessment_id: str) -> Dict[str, Any]:
    """Retrieves execution audit trail and provenance metadata for an assessment run."""
    run = storage.get_assessment_run(assessment_id)
    if not run:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Assessment {assessment_id} not found."}
        )

    band_counts = {"very_high": 0, "high": 0, "moderate": 0, "low": 0}
    quality_counts = {"complete": 0, "partial": 0, "stale": 0}

    for s in run.scores.values():
        band_counts[s.band.value] = band_counts.get(s.band.value, 0) + 1
        quality_counts[s.data_quality] = quality_counts.get(s.data_quality, 0) + 1

    return {
        "assessment_run_id": run.assessment_run_id,
        "event_id": run.event_id,
        "created_at": run.created_at,
        "sources_scored": run.sources_scored,
        "config_version": run.config_version,
        "data_version": run.data_version,
        "band_distribution": band_counts,
        "data_quality_distribution": quality_counts,
        "is_synthetic": True,
        "provenance_notes": "Scored using pure deterministic risk engine under neutral imputation policy (0.5).",
    }
