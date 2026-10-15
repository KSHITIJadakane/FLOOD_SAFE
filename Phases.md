# 🗺️ Implementation Phases & Roadmap — FloodSafe

> **Project Lifecycle**: Structured breakdown of the engineering progression that took FloodSafe from concept to an empirical, production-verified system.

---

## Phase Overview

```
Phase 1: Domain Modeling & Geospatial Foundations  [COMPLETED]
   ↓
Phase 2: Risk Engine & MCDA Imputation             [COMPLETED]
   ↓
Phase 3: Submodular Coverage Optimizer             [COMPLETED]
   ↓
Phase 4: AWS Cedar Zero-Trust Engine               [COMPLETED]
   ↓
Phase 5: Full-Stack React & Leaflet GIS Client     [COMPLETED]
   ↓
Phase 6: Cyber-Physical Wokwi IoT Integration      [COMPLETED]
   ↓
Phase 7: Real Cloud Infrastructure (DynamoDB/SAM)  [COMPLETED]
   ↓
Phase 8: Real Copernicus STAC Earth Observation    [COMPLETED]
   ↓
Phase 9: Future Scale & Municipal Rollout          [ROADMAP]
```

---

## Phase Breakdown

### Phase 1: Domain Modeling & Geospatial Foundations ✅
* **Objective**: Establish domain entities, geodesic spatial mathematics, and reproducible test data.
* **Deliverables**:
  * Pydantic schemas (`FloodEvent`, `WaterSource`, `PopulationUnit`, `AssessmentRun`, `TestingPlan`).
  * High-performance geodesic calculations: Haversine distance, vectorized pairwise distance matrices (`haversine_distance_matrix_vectorized`).
  * Procedural synthetic data generator calibrated to the Guwahati, Assam floodplain (500 clustered sources, 500 population units).

### Phase 2: Risk Engine & Transparent MCDA Scoring ✅
* **Objective**: Build an explainable multi-criteria scoring algorithm avoiding black-box diagnosis.
* **Deliverables**:
  * Linear weighting algorithm across 5 physical indicators: Flood exposure, Drainage proximity, Historical contamination, Source vulnerability, and Population density.
  * "No Silent Zeroes" neutral ($0.5$) imputation policy with explicit confidence penalty badges.
  * Mathematical explainability breakdown per source (weights $\times$ values = contributions).

### Phase 3: Submodular Maximum Coverage Optimizer ✅
* **Objective**: Mathematically solve the testing kit allocation paradox ($K=15$ kits vs. 500 sources).
* **Deliverables**:
  * Greedy forward selection algorithm optimizing marginal unique population coverage.
  * Spatial overlap suppression within $500\text{m}$ radius buffers.
  * Monte Carlo benchmarking harness (1,000 trials + naive Top-K comparison) demonstrating **+194.1% coverage lift**.

### Phase 4: AWS Cedar Zero-Trust Authorization ✅
* **Objective**: Enforce strict security boundaries, RBAC, and statutory ethical invariants.
* **Deliverables**:
  * Declarative Cedar policy specifications (`policies/floodsafe.cedar`) executed via `cedarpy`.
  * Role separation: `Viewer` (read-only), `Operator` (plans/assessments), `FieldRecorder` (simulated tests), `Admin` (verified lab entries).
  * Non-negotiable safety invariant: `IssueAdvisory` unconditionally forbidden across all roles.

### Phase 5: High-Performance React + Leaflet GIS Dashboard ✅
* **Objective**: Create a mission-control command canvas for emergency coordinators.
* **Deliverables**:
  * Dark-matter Leaflet interactive cartography rendering flood zones, sources, and $500\text{m}$ buffers.
  * Dynamic identity role-switcher (`Header.tsx`) for live Cedar allow/deny demonstrations.
  * "WHY?" explainability inspector modal (`WhyModal.tsx`).
  * What-If MCDA sensitivity tuning drawer (`WeightTuningDrawer.tsx`).
  * One-click PDF field dispatch dossier generator (`pdfReport.ts`).

### Phase 6: Cyber-Physical Wokwi ESP32 IoT Integration ✅
* **Objective**: Bridge the 6-to-12 day satellite orbit latency gap with physical ground truth.
* **Deliverables**:
  * Virtual hydrometric edge station in Wokwi (ESP32 + HC-SR04 ultrasonic transducer + SSD1306 OLED + alarm piezo).
  * 1-Click interactive browser simulation at `wokwi.com/projects/477569569661872129`.
  * RESTful telemetry ingestion (`PATCH /api/v1/iot-sensors/{node_id}/telemetry`) with dynamic directional contamination propagation.

### Phase 7: Genuine AWS Serverless & Persistence Layer ✅
* **Objective**: Upgrade from in-memory prototyping to real AWS cloud infrastructure.
* **Deliverables**:
  * Amazon DynamoDB persistent storage backend (`backend/app/dynamodb_storage.py`) for `WaterSources`, `TestingPlans`, and `AuditLog`.
  * Standalone, deployable AWS Lambda optimizer handler (`aws/lambda_optimizer/handler.py`).
  * Production AWS SAM CloudFormation template (`aws/template.yaml`) with IAM policies and HTTP API triggers.

### Phase 8: Real Copernicus STAC Earth Observation Discovery ✅
* **Objective**: Connect the satellite pipeline to real Sentinel-1 SAR constellation acquisitions.
* **Deliverables**:
  * Asynchronous STAC catalog client (`backend/app/stac_discovery.py`) querying Copernicus Data Space Ecosystem.
  * Live endpoint (`GET /api/v1/satellite/discover`) returning actual Sentinel-1 SAR scenes, orbits, and polarizations for flood coordinates.
  * Resilient offline caching fallback for zero-downtime demos.

---

## Phase 9: Future Production Roadmap (Post-Hackathon) 🚀

* **Phase 9.1**: Real-Time Automated SAR Raster Ingestion
  * Automatic download of Sentinel-1 GRD GeoTIFFs from AWS Open Data Registry S3 bucket (`s3://sentinel-s1-l1c`).
* **Phase 9.2**: Offline-First PWA Field Companion
  * Progressive Web App with IndexedDB local caching for field technicians in low-connectivity disaster zones.
* **Phase 9.3**: Municipal Jal Jeevan Mission API Integration
  * Secure webhook integration with India's national rural drinking water database for real-time wellhead telemetry ingestion.
