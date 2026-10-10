"""Pydantic schemas and domain models for FloodSafe."""
from __future__ import annotations
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
from pydantic import BaseModel, Field


class SourceType(str, Enum):
    WELL = "well"
    PUBLIC_TAP = "public_tap"
    STORAGE_POINT = "storage_point"


class RiskBand(str, Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERY_HIGH = "very_high"


class VerificationStatus(str, Enum):
    SIMULATED = "simulated"
    UNVERIFIED = "unverified"
    VERIFIED = "verified"


class FieldTestType(str, Enum):
    RAPID = "rapid"
    LAB = "lab"
    INSPECTION = "inspection"


class ResultCategory(str, Enum):
    NORMAL = "normal"
    ABNORMAL = "abnormal"
    INCONCLUSIVE = "inconclusive"


class UserRole(str, Enum):
    VIEWER = "viewer"
    OPERATOR = "operator"
    FIELD_RECORDER = "field_recorder"
    ADMIN = "admin"


# GeoJSON Types
class GeoPoint(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]


class GeoMultiPolygon(BaseModel):
    type: str = "MultiPolygon"
    coordinates: List[List[List[List[float]]]]


# Domain Models
class FloodEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    event_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    geometry: Dict[str, Any]
    data_version: str = "synthetic-v1"
    is_synthetic: bool = True
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WaterSource(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    source_code: str
    latitude: float
    longitude: float
    source_type: SourceType
    ward_id: Optional[str] = None
    population_served: int = 0
    population_provenance: str = "synthetic-cluster-estimate"
    drain_distance_m: Optional[float] = None
    flood_exposure: Optional[float] = None  # 0.0 - 1.0
    historical_risk: Optional[float] = None  # 0.0 - 1.0
    source_vulnerability: Optional[float] = None  # 0.0 - 1.0
    data_quality_status: str = "complete"  # complete / partial / stale
    is_synthetic: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PopulationUnit(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    event_id: str
    unit_code: str
    latitude: float
    longitude: float
    population: int
    is_high_risk: bool = True
    is_synthetic: bool = True


class ScoredSource(BaseModel):
    source_id: str
    source_code: str
    source_type: SourceType
    latitude: float
    longitude: float
    ward_id: Optional[str]
    population_served: int
    relative_vulnerability_score: float
    band: RiskBand
    feature_values: Dict[str, Optional[float]]
    feature_contributions: Dict[str, float]
    missing_features: List[str]
    data_quality: str
    quality_score: float
    spatial_uplift: float = 0.0
    uplift_sources: List[Dict[str, Any]] = Field(default_factory=list)
    explanation: str
    disclaimer: str = (
        "Prioritization signal for field verification, not a contamination diagnosis."
    )
    config_version: str
    data_version: str
    is_synthetic: bool = True


class AssessmentRun(BaseModel):
    assessment_run_id: str = Field(default_factory=lambda: str(uuid4()))
    event_id: str
    sources_scored: int
    config_version: str
    data_version: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_synthetic: bool = True
    scores: Dict[str, ScoredSource] = Field(default_factory=dict)


class SelectedSite(BaseModel):
    order: int
    source_id: str
    source_code: str
    source_type: SourceType
    latitude: float
    longitude: float
    marginal_coverage: int
    cumulative_coverage: int
    relative_vulnerability_score: float
    band: RiskBand
    covered_unit_ids: List[str]


class PlanMetrics(BaseModel):
    unique_population_covered: int
    total_high_risk_population: int
    pct_high_risk_covered: float
    covered_per_test: float
    overlap: int
    runtime_ms: float


class BaselineStats(BaseModel):
    trials: int = 1000
    seed: int = 42
    mean: float
    median: float
    p5: float
    p95: float
    optimizer: int
    top_k_score: int
    gain_over_random_mean: float
    gain_over_top_k: float


class TestingPlan(BaseModel):
    plan_id: str = Field(default_factory=lambda: str(uuid4()))
    event_id: str
    assessment_run_id: str
    capacity_k: int
    coverage_definition: Dict[str, Any]
    objective: str
    algorithm_version: str = "greedy-v1"
    data_version: str = "synthetic-v1"
    random_seed: int = 42
    selected: List[SelectedSite]
    metrics: PlanMetrics
    baseline: Optional[BaselineStats] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_synthetic: bool = True


class FieldTest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    event_id: str
    source_id: str
    observed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    recorded_by: str = "demo-user"
    test_type: FieldTestType = FieldTestType.RAPID
    result_category: ResultCategory = ResultCategory.ABNORMAL
    verification_status: VerificationStatus = VerificationStatus.SIMULATED
    notes: Optional[str] = "Simulated field assessment"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Request Schemas
class CreateEventRequest(BaseModel):
    name: str
    event_time: Optional[datetime] = None
    geometry: Optional[Dict[str, Any]] = None
    data_version: str = "synthetic-v1"
    is_synthetic: bool = True


class RunAssessmentRequest(BaseModel):
    event_id: str
    config_version: str = "risk-v1"


class CreatePlanRequest(BaseModel):
    event_id: str
    assessment_run_id: Optional[str] = None
    capacity_k: int = 15
    coverage_radius_m: float = 500.0
    objective: str = "max_unique_high_risk_population"
    seed: int = 42
    include_baseline: bool = True
    baseline_trials: int = 1000


class CreateFieldTestRequest(BaseModel):
    event_id: str
    source_id: str
    observed_at: Optional[datetime] = None
    test_type: FieldTestType = FieldTestType.RAPID
    result_category: ResultCategory = ResultCategory.ABNORMAL
    verification_status: VerificationStatus = VerificationStatus.SIMULATED
    notes: Optional[str] = "Demo field test"


class HealthResponse(BaseModel):
    status: str = "healthy"
    app: str = "FloodSafe API"
    version: str = "0.1.0"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_synthetic: bool = True
