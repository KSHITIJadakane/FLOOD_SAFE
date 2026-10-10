"""Field Tests & Feedback API Router."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.app.models import (
    CreateFieldTestRequest,
    FieldTest,
    RunAssessmentRequest,
    VerificationStatus,
)
from backend.app.storage import storage
from backend.app.routers.assessments import run_risk_assessment
from backend.app.auth import authorize, get_current_user_and_role


router = APIRouter(prefix="/api/v1/field-tests", tags=["Field Tests"])


@router.post("", response_model=FieldTest)
def record_field_test(
    req: CreateFieldTestRequest,
    user_info: tuple = Depends(get_current_user_and_role),
) -> FieldTest:
    """Records a rapid, lab, or inspection field result with Cedar evaluation."""
    user_id, roles = user_info
    
    # Cedar Policy Check with dynamic verification_status context
    resource = f'FloodSafe::Source::"{req.source_id}"'
    authorize(
        user_id=user_id,
        roles=roles,
        action="RecordFieldTest",
        resource=resource,
        context={"verification_status": req.verification_status.value},
    )

    event = storage.get_event(req.event_id)
    if not event:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Flood event {req.event_id} not found."}
        )

    source = storage.get_source_by_id(req.source_id)
    if not source:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Water source {req.source_id} not found."}
        )

    observed_time = req.observed_at or datetime.now(timezone.utc)
    field_test = FieldTest(
        event_id=req.event_id,
        source_id=source.id,
        observed_at=observed_time,
        test_type=req.test_type,
        result_category=req.result_category,
        verification_status=req.verification_status,
        notes=req.notes,
    )
    storage.add_field_test(field_test)

    # If result was abnormal, automatically trigger a reassessment to reflect feedback uplift
    if req.result_category.value == "abnormal":
        run_risk_assessment(RunAssessmentRequest(event_id=req.event_id))

    return field_test


@router.get("", response_model=List[FieldTest])
def list_field_tests(event_id: Optional[str] = None) -> List[FieldTest]:
    """Lists field tests for an event."""
    events = storage.list_events()
    active_event_id = event_id or (events[0].id if events else None)
    if not active_event_id:
        return []
    return storage.get_field_tests(active_event_id)
