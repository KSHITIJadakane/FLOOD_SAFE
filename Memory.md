# 🧠 Codebase Memory & State Context — FloodSafe

> **Purpose**: This living memory document maintains active context, recent changes, architectural decisions, and verification states across AI development sessions, preventing redundant re-reads and context drift.

---

## 1. Project Identity & Active State

* **Repository**: `github.com/SumedhXy/Flood_safe`
* **Local Root**: `d:\codeverse\hackathons\AI WATER HACKATHON`
* **Target Competition**: WeMakeDevs AWS Environmental Hacks (October 2026)
* **Overall Status**: **Feature-Complete, 100% Tested, Production-Verified**
* **Active Working Branch**: `main`

---

## 2. Key Architecture Decisions Made

1. **Dual Storage Strategy (Memory + DynamoDB)**:
   * Thread-safe in-memory repository (`StorageRepository` in `backend/app/storage.py`) provides zero-latency execution for local evaluation and container demos.
   * `backend/app/dynamodb_storage.py` activates when `USE_DYNAMODB=true`, persisting scored sources, plans, and Cedar decision audit logs to real AWS DynamoDB tables (`FloodSafe_WaterSources`, `FloodSafe_TestingPlans`, `FloodSafe_AuditLog`).
2. **Dedicated Serverless Optimizer**:
   * Isolated greedy maximum coverage algorithm into a self-contained, deployable AWS Lambda handler: `aws/lambda_optimizer/handler.py`.
   * Wired into AWS SAM template `aws/template.yaml` with HTTP API trigger (`POST /optimize`) and DynamoDB CRUD policies.
3. **Dead Weight Elimination**:
   * Removed unused PostGIS service and volumes from `docker-compose.yml`. The system relies on its pure Python geodesic math engine (`geo_utils.py` / `shapely` / `numpy`), which runs with zero external DB dependencies.
4. **Real Earth Observation STAC Integration**:
   * Built `backend/app/stac_discovery.py` querying Copernicus Data Space Ecosystem STAC API (`https://catalogue.dataspace.copernicus.eu/stac/search`) for actual Sentinel-1 SAR imagery metadata around flood events.
   * Exposed via `GET /api/v1/satellite/discover` with automatic fallback to regional cached passes.
5. **Single-Command Full-Stack Deployment**:
   * FastAPI entrypoint (`backend/app/main.py`) serves the compiled React + Leaflet SPA directly from `frontend/dist/`. Running `uvicorn backend.app.main:app` hosts the entire frontend + backend on port `8000`.

---

## 3. Verified Benchmark Numbers (Grounded Facts)

Do not hallucinate or guess these metrics. Use these exact benchmark results:
* **Evaluation Scope**: 500 candidate water sources, 500 population units, Budget $K=15$ test kits, Radius $R=500\text{m}$, Seed $42$.
* **FloodSafe Greedy Max-Coverage**:
  * Unique High-Risk Citizens Covered: **`221,559`** out of $840,872$ total ($26.4\%$).
  * Covered Population per Kit: **`14,770.6`** people/test.
  * Overlap Avoided: **`0`** people double-counted.
  * Execution Latency: **`24.6 ms`**.
* **Naive Top-K by Risk Score Baseline**:
  * Unique Citizens Covered: **`75,341`**.
  * **FloodSafe Lift over Naive**: **`+194.1%`** (+146,218 additional citizens covered).
* **Random Selection Baseline (1,000 Monte Carlo Trials)**:
  * Mean Covered: **`72,575.1`** (Median: $72,131$).
  * **FloodSafe Lift over Random**: **`+205.3%`**.

---

## 4. Current Test & Quality Verification Status

* **Pytest Suite (`backend/tests/`)**:
  * Command: `python -m pytest backend/tests/ -v`
  * Result: **45 passed / 45 total (100% GREEN)**.
  * Key test suites: `test_api.py`, `test_auth_cedar.py`, `test_config_router.py`, `test_iot_sensors.py`, `test_optimizer.py`, `test_phase1.py`, `test_risk_engine.py`, `test_satellite.py`.
* **Automated Specification Drift Check (`scripts/drift_check.py`)**:
  * Command: `python scripts/drift_check.py`
  * Result: **10/10 CHECKS PASSED (100% SPEC COMPLIANT)**.
* **Frontend Compilation (`frontend/`)**:
  * Command: `npm run build`
  * Result: TypeScript check + Vite bundle compiled to `frontend/dist/` in $3.6\text{s}$ with zero errors.

---

## 5. Live Demo & External Links

* **Live Cloud Deployment**: `https://flood-safe.onrender.com`
* **Interactive Wokwi Hardware Simulation**: `https://wokwi.com/projects/477569569661872129`
* **GitHub Repository**: `https://github.com/SumedhXy/Flood_safe`
* **Presentation Deck**: `FloodSafe.pdf` (12.5 MB, 9 slides generated in Felo)

---

## 6. Known Gotchas & Coding Rules for AI Agents

1. **Cedar Policy**: Never mock or bypass `@id("no-automatic-advisory")` in `policies/floodsafe.cedar`. The Cedar engine strictly forbids automated public alerts.
2. **Event Router Route**: The event router in `backend/app/routers/events.py` is prefixed with `/api/v1/flood-events`. Do NOT call `/api/v1/events` (returns 404).
3. **Frontend Styling**: Strictly use CSS variables from `frontend/src/index.css`. Do NOT install or add Tailwind CSS.
4. **Missing Sensor Imputation**: Always impute $0.5$ for missing values with a data quality penalty. Never impute zero.
