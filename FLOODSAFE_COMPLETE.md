# FloodSafe — Master Specification & Technical Reference

## 1. Executive Summary
FloodSafe is a post-flood water-source vulnerability triage and testing-allocation system. It combines flood exposure, source characteristics, drainage proximity, historical indicators, and population served into a transparent relative-priority score, then selects a limited set of sites to test so that as much high-risk population as possible is covered under a fixed capacity budget $K$.

## 2. Standing Rules & Non-Negotiables
1. **Never claim contamination**: The risk engine calculates relative vulnerability priority for triage, never medical risk or proven contamination.
2. **Transparent explainability**: Every scored source exposes exact component contributions that sum to the total score.
3. **No silent zeroes**: Missing feature values use documented neutral imputation ($0.5$) with visible quality penalty indicators.
4. **Greedy Max Coverage**: Never double-count population across overlapping radii ($R=500\text{m}$). The optimizer is evaluated against top-K ranking and a 1,000-trial random baseline.
5. **Cedar Authorization**: Strict default-deny. `IssueAdvisory` is forbidden across all roles. Simulated field results are restricted, and verified results are admin-only.
6. **Synthetic Demo Labeling**: Prominently display `"SYNTHETIC DEMO DATA"` banner on all UI views, API responses (`is_synthetic: true`), and exports.
7. **No Cut-List Creep**: Exclude LLM incident briefs, AWS cloud deployment, or S3 ingestion pipelines until core phases are complete.

## 3. Architecture & Data Flow
- **Data Generator**: Deterministic generation of 500 clustered water sources, flood inundation corridor, and 500 population units.
- **Risk Engine** (`backend/app/risk_engine.py`): Pure weighted scoring formula ($0.30\times\text{flood} + 0.25\times\text{drain} + 0.15\times\text{history} + 0.15\times\text{vuln} + 0.15\times\text{pop}$) with neutral $0.5$ imputation.
- **Optimizer** (`backend/app/optimizer.py`): Greedy Maximum Unique Coverage under $K$ sites with deterministic tie-breaking and baseline comparison.
- **API** (`backend/app/main.py`): FastAPI REST service with OpenAPI documentation at `/docs`.
- **Frontend** (`frontend/`): React, Vite, TypeScript, Leaflet map with CartoDB dark theme, Testing Queue, and Source WHY? explainability drawer.
- **Cedar Authorization** (`policies/floodsafe.cedar`): Declarative policy language evaluated via `cedarpy`.

## 4. Quick Start & Execution Guide

### Backend & API
```bash
# Run test suite
python -m pytest backend/tests/ -v

# Run optimizer benchmark
python scripts/evaluate_optimizer.py

# Run drift & integrity verification
python scripts/drift_check.py

# Start FastAPI server
uvicorn backend.app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

## 5. 3-Minute Demo Pitch Structure
1. **0:00 - 0:30**: Problem Statement (limited testing kits post-flood, risk of redundant testing).
2. **0:30 - 1:15**: Vulnerability Scoring & WHY? Panel (transparent contributions, missing-data handling).
3. **1:15 - 2:00**: Greedy Max-Coverage Optimizer vs Top-K Ranking (+177% gain by avoiding redundant overlaps).
4. **2:00 - 2:40**: AWS Cedar Demo 403 Moment (Viewer blocked on CreatePlan, Forbid on IssueAdvisory).
5. **2:40 - 3:00**: Simulated Field Feedback loop with bounded neighbor uplift.
