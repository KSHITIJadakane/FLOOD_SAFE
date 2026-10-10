# API Specification

Base prefix: `/api/v1`. JSON over HTTPS. OpenAPI served at `/docs`.

## 1. Endpoints
| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | health check |
| POST | `/flood-events` | create flood event |
| GET | `/flood-events` | list events |
| GET | `/sources` | filter/list sources |
| GET | `/sources/{source_id}` | details + explanation |
| GET | `/risk-map` | map-ready GeoJSON |
| POST | `/risk-assessments/run` | run/refresh assessment |
| GET | `/testing-queue` | ranked candidates |
| POST | `/testing-plans` | generate plan for budget K |
| GET | `/testing-plans/{plan_id}` | plan + coverage metrics |
| POST | `/field-tests` | record simulated/unverified/verified result |
| GET | `/audit/assessments/{assessment_id}` | run provenance (access-controlled) |

## 2. Design requirements
- Validate coordinates, numeric ranges, IDs, event associations.
- Explicit Pydantic response schemas; never raw DB objects.
- Include timestamps and `data_version` / `config_version` in outputs.
- Distinguish `simulated`, `unverified`, `verified` field data.
- Clear errors when required inputs are missing.
- Hide sensitive operational fields from unauthorized clients.
- Pagination + spatial filters (`bbox`, `ward_id`, `band`) as data grows.
- Auth, authorization, rate limits, secure config before real use.
- Every response carrying synthetic data includes `"is_synthetic": true`.

## 3. Examples

### POST /flood-events
```json
{ "name": "Synthetic Flood 2026-A", "event_time": "2026-09-01T06:00:00Z",
  "geometry": { "type": "MultiPolygon", "coordinates": [] },
  "data_version": "synthetic-v1", "is_synthetic": true }
```

### POST /risk-assessments/run
```json
{ "event_id": "…", "config_version": "risk-v1" }
```
Response:
```json
{ "assessment_run_id": "…", "event_id": "…", "sources_scored": 500,
  "config_version": "risk-v1", "data_version": "synthetic-v1",
  "created_at": "2026-10-09T10:00:00Z", "is_synthetic": true }
```

### GET /sources/{id}
```json
{
  "source_code": "SYN-047", "source_type": "well",
  "relative_vulnerability_score": 0.91, "band": "very_high",
  "feature_values": { "flood_exposure": 0.95, "drain_proximity_risk": 0.88,
                      "historical_risk": null, "source_vulnerability": 0.7,
                      "population_exposure": 0.9 },
  "feature_contributions": { "flood_exposure": 0.285, "...": 0.0 },
  "missing_features": ["historical_risk"],
  "data_quality": "partial",
  "explanation": "…template-generated from contributions…",
  "disclaimer": "Prioritization signal for field verification, not a contamination diagnosis.",
  "config_version": "risk-v1", "data_version": "synthetic-v1", "is_synthetic": true
}
```

### POST /testing-plans
```json
{ "event_id": "…", "assessment_run_id": "…", "capacity_k": 15,
  "coverage": { "type": "radius", "radius_m": 500 },
  "objective": "max_unique_high_risk_population", "seed": 42,
  "include_baseline": true, "baseline_trials": 1000 }
```
Response (values illustrative — real values come from the run):
```json
{
  "plan_id": "…", "selected": [
    { "order": 1, "source_code": "SYN-047", "marginal_coverage": 5820 } ],
  "metrics": { "unique_population_covered": 0, "pct_high_risk_covered": 0.0,
               "covered_per_test": 0.0, "overlap": 0, "runtime_ms": 0 },
  "baseline": { "trials": 1000, "seed": 42, "mean": 0, "median": 0,
                "p5": 0, "p95": 0, "optimizer": 0 },
  "algorithm_version": "greedy-v1", "data_version": "synthetic-v1",
  "is_synthetic": true
}
```

### POST /field-tests
```json
{ "event_id": "…", "source_id": "…", "observed_at": "2026-09-02T09:30:00Z",
  "test_type": "rapid", "result_category": "abnormal",
  "verification_status": "simulated", "notes": "demo" }
```

## 4. Errors
```json
{ "error": { "code": "MISSING_INPUT", "message": "No assessment run for event", 
              "details": { "event_id": "…" } } }
```
Codes: `VALIDATION_ERROR` (422), `NOT_FOUND` (404), `MISSING_INPUT` (409), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `RATE_LIMITED` (429), `INTERNAL` (500).

## 5. Roles (proposed)
| Role | Permissions |
| --- | --- |
| viewer | read queue, map, plans |
| operator | create events, run assessments/plans |
| field_recorder | submit field tests |
| admin | audit access, config changes |
