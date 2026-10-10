"""Testing Plans API Router."""
from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from backend.app.models import CreatePlanRequest, TestingPlan
from backend.app.storage import storage
from backend.app.optimizer import generate_testing_plan
from backend.app.routers.assessments import run_risk_assessment
from backend.app.models import RunAssessmentRequest
from backend.app.auth import require_auth


router = APIRouter(prefix="/api/v1/testing-plans", tags=["Testing Plans"])


@router.post(
    "",
    response_model=TestingPlan,
    dependencies=[Depends(require_auth("CreatePlan", "FloodEvent"))],
)
def create_testing_plan(req: CreatePlanRequest) -> TestingPlan:
    """Generates an optimized testing-allocation plan under capacity budget K."""
    event = storage.get_event(req.event_id)
    if not event:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Flood event {req.event_id} not found."}
        )

    # Resolve assessment run
    assessment = None
    if req.assessment_run_id:
        assessment = storage.get_assessment_run(req.assessment_run_id)
    if not assessment:
        assessment = storage.get_latest_assessment(req.event_id)
    if not assessment:
        assessment = run_risk_assessment(RunAssessmentRequest(event_id=req.event_id))

    pop_units = storage.get_population_units(req.event_id)
    if not pop_units:
        raise HTTPException(
            status_code=400,
            detail={"code": "MISSING_INPUT", "message": f"No population units found for event {req.event_id}."}
        )

    plan = generate_testing_plan(
        event_id=req.event_id,
        assessment_run_id=assessment.assessment_run_id,
        scored_sources=assessment.scores,
        pop_units=pop_units,
        capacity_k=req.capacity_k,
        coverage_radius_m=req.coverage_radius_m,
        objective=req.objective,
        seed=req.seed,
        include_baseline=req.include_baseline,
        baseline_trials=req.baseline_trials,
    )

    storage.save_testing_plan(plan)
    return plan


@router.get("/{plan_id}", response_model=TestingPlan)
def get_testing_plan(plan_id: str) -> TestingPlan:
    """Retrieves a testing plan by ID."""
    plan = storage.get_testing_plan(plan_id)
    if not plan:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Testing plan {plan_id} not found."}
        )
    return plan


@router.get("", response_model=List[TestingPlan])
def list_testing_plans(event_id: Optional[str] = None) -> List[TestingPlan]:
    """Lists generated testing plans."""
    plans = list(storage.testing_plans.values())
    if event_id:
        plans = [p for p in plans if p.event_id == event_id]
    return list(reversed(plans))
