# Architecture

## 1. Workflow
```text
Flood event + geographic data
        |
Data ingestion and checks
        |
Water-source inventory + GIS
        |
Feature preparation and quality
        |
Relative vulnerability score
     |                |
Explainability   Risk map and queue
     |                |
     +------ Testing budget K + coverage model
                      |
          Greedy maximum-coverage selection
                      |
              Field verification
                      |
        Record verified/simulated field results
                      |
          Recalculate and re-prioritize
```

## 2. Components
```text
React + TypeScript UI (Map, Queue, WHY panel)
              |
      FastAPI REST API (validation, auth*)
              |
   +----------+-----------+
   |          |           |
Risk Engine  Coverage    Field Feedback
             Optimizer   Reassessment
   +----------+-----------+
              |
     PostgreSQL + PostGIS

Authorization: every protected route -> Cedar policy check (default deny)
Stretch: LocalStack S3 -> SAM local Lambda ingestion -> PostGIS
Optional: structured assessment -> LLM -> short incident brief
```
`*` Auth is required before any real operational deployment; demo setups are not production-secure.

## 3. Backend
Python 3.11+, FastAPI, Pydantic, SQLAlchemy + GeoAlchemy2, psycopg, NumPy/Pandas, Shapely/GeoPandas/Rasterio as needed, boto3 (optional), pytest.

**Rule:** `risk_engine.py` and `coverage_optimizer.py` are **pure, testable modules** — no DB sessions, no request objects, no route logic.

| Module | Responsibility |
| --- | --- |
| `services/risk_engine.py` | normalize, weight, explain, missing-data policy |
| `services/coverage_optimizer.py` | greedy selection, unique coverage, baseline |
| `services/geo_utils.py` | CRS transforms, distance, spatial joins |
| `services/incident_brief.py` | optional LLM narrative from computed fields |
| `api/*` | thin routes: validate → call service → serialize |

## 4. Frontend
React, Vite, TypeScript, React-Leaflet, Axios, Lucide, optionally Tailwind. Basemap attribution is mandatory. Real/synthetic/stale/missing data are visually distinguished.

## 5. Database
PostgreSQL + PostGIS for geometries, spatial joins, distances. Assessment runs are versioned so any queue is traceable to its data and config. See DATA_MODEL.md.

## 6. Optional LLM
May write a concise brief from already-computed structured values. Must not invent facts, set scores, or declare contamination. Output is schema-validated and labelled "generated assistance". The app works without it.

## 7. Cross-cutting concerns
- **Versioning:** `data_version`, `config_version`, `algorithm_version` on every run.
- **Reproducibility:** fixed seeds; frozen demo dataset.
- **Errors:** explicit response schemas; clear errors for missing inputs.
- **Security:** env-based config, least privilege, no secrets in repo.
- **Observability:** structured logs without secrets or personal data.

## 8. Design decisions
| Decision | Rationale |
| --- | --- |
| Weighted sum, not ML | no labelled field data; explainable |
| Greedy max coverage | simple, testable, (1-1/e) approximation for monotone submodular coverage |
| PostGIS | native spatial ops, distance in projected CRS |
| Local-first | demo must not depend on cloud availability |
