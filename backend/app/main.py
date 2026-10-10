"""FastAPI application entrypoint for FloodSafe."""
from __future__ import annotations
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.models import HealthResponse
from backend.app.storage import storage

from backend.app.routers.events import router as events_router
from backend.app.routers.sources import router as sources_router
from backend.app.routers.assessments import router as assessments_router
from backend.app.routers.plans import router as plans_router
from backend.app.routers.field_tests import router as field_tests_router
from backend.app.routers.risk_map import router as risk_map_router
from backend.app.routers.audit import router as audit_router
from backend.app.routers.config_router import router as config_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed default synthetic dataset on startup if not present
    if not storage.list_events():
        storage.seed_default_data(seed=42)
    yield


app = FastAPI(
    title="FloodSafe API",
    description=(
        "Post-flood water-source vulnerability triage & testing-allocation engine. "
        "Built with AWS open-source tools (Cedar authorization)."
    ),
    version="0.1.0",
    docs_url="/docs",
    openapi_url="/api/v1/openapi.json",
    lifespan=lifespan,
)

# CORS middleware for local frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(events_router)
app.include_router(sources_router)
app.include_router(assessments_router)
app.include_router(plans_router)
app.include_router(field_tests_router)
app.include_router(risk_map_router)
app.include_router(audit_router)
app.include_router(config_router)


from backend.app.auth import require_auth, get_current_user_and_role, authorize
from fastapi import Depends


@app.post(
    "/api/v1/advisories",
    tags=["Safety & Cedar Boundaries"],
)
def issue_public_advisory(user_info: tuple = Depends(get_current_user_and_role)):
    """
    Attempt to issue a public water contamination advisory.
    Strictly FORBIDDEN by Cedar policy 'no-automatic-advisory' across all roles.
    """
    user_id, roles = user_info
    authorize(user_id, roles, "IssueAdvisory", 'FloodSafe::FloodEvent::"default"')
    return {"status": "success"}


@app.get("/health", response_model=HealthResponse, tags=["System"])
@app.get("/api/v1/health", response_model=HealthResponse, tags=["System"])
def get_health() -> HealthResponse:
    """System health check endpoint."""
    return HealthResponse(
        status="healthy",
        app="FloodSafe API",
        version="0.1.0",
        is_synthetic=True,
    )
