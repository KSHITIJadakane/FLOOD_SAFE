# 🏛️ Architecture & System Blueprint — FloodSafe

> **System Overview**: FloodSafe is a distributed full-stack geospatial decision-support system featuring a FastAPI asynchronous backend, a high-performance React + TypeScript SPA, AWS serverless and Cedar policy governance, and cyber-physical IoT edge integration.

---

## 1. System Architecture Diagram

```
                               ┌────────────────────────────────────────────────────────┐
                               │                 DATA INGESTION & FUSION                │
                               │                                                        │
                               │  🛰️ Copernicus Sentinel-1   ⛰️ SRTM DEM Hydrology      │
                               │     SAR Radar (C-Band)          Topographic Wetness    │
                               │                                                        │
                               │  📡 Physical IoT Nodes      👥 WorldPop Clustered      │
                               │     (ESP32 + Ultrasonic)        Population Units       │
                               └───────────────────────────┬────────────────────────────┘
                                                           │
                                                           ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                                   FLOODSAFE BACKEND                                   │
│                                                                                       │
│   ┌────────────────────────┐    ┌────────────────────────┐    ┌───────────────────┐   │
│   │   REST API Layer       │    │  Zero-Trust Security   │    │  Risk Assessment  │   │
│   │   FastAPI (Async)      │◄──►│  AWS Cedar Engine      │◄──►│  Deterministic    │   │
│   │   OpenAPI / Swagger    │    │  (cedarpy / RBAC)      │    │  MCDA Weighting   │   │
│   └───────────┬────────────┘    └────────────────────────┘    └─────────┬─────────┘   │
│               │                                                         │             │
│               │                 ┌────────────────────────┐              │             │
│               │                 │ Submodular Optimizer   │◄─────────────┘             │
│               └────────────────►│ Greedy Max-Coverage    │                            │
│                                 │ (O(K·N·M) vectorized)  │                            │
│                                 └───────────┬────────────┘                            │
│                                             │                                         │
│   ┌─────────────────────────────────────────▼─────────────────────────────────────┐   │
│   │                            STORAGE & PERSISTENCE                              │   │
│   │   • In-Memory Thread-Safe Repository (Local & Container Demo)                 │   │
│   │   • Amazon DynamoDB (WaterSources, TestingPlans, AuditLog)                    │   │
│   └───────────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────┬────────────────────────────────────────────┘
                                           │  JSON / GeoJSON (Gzip Compressed)
                                           ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                                 FRONTEND WEB CLIENT                                   │
│                                                                                       │
│   React 18 + TypeScript + Vite + Leaflet Cartography                                  │
│   ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌─────────────┐   │
│   │ Real-Time GIS Map │ │ Testing Queue     │ │ Cedar Auth Studio │ │ Benchmark   │   │
│   │ Dark-Matter Tiles │ │ Dynamic Dispatch  │ │ Live Policy Test  │ │ Lab (+194%) │   │
│   └───────────────────┘ └───────────────────┘ └───────────────────┘ └─────────────┘   │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Backend Services
* **Language & Runtime**: Python 3.11 / 3.12
* **Web Framework**: FastAPI $\ge 0.110.0$ (Asynchronous, ASGI-driven)
* **Server**: Uvicorn $\ge 0.28.0$ with Gzip compression middleware
* **Data Validation & Schemas**: Pydantic v2 (`BaseModel`, field validators, serialization)
* **Spatial & Numerical Processing**:
  * `numpy` (vectorized haversine distance matrices & submodular marginal gains)
  * `shapely` (computational geometry, polygon intersection & ray casting)
  * `pandas` (benchmarking statistics, quantiles, and data structures)
* **Security & Authorization**: AWS Cedar Policy Engine via `cedarpy` $\ge 4.12.0$
* **AWS SDK**: `boto3` $\ge 1.34.0$ (Amazon DynamoDB persistence & batch writers)
* **HTTP & External APIs**: `httpx` $\ge 0.27.0$ (Asynchronous Copernicus STAC catalog client)
* **Testing**: `pytest` $\ge 8.0.0$, `pytest-asyncio`

### 2.2 Frontend Client
* **Framework**: React 18.3 (`StrictMode`, hooks, functional architecture)
* **Language**: TypeScript 5.7 (strict typing across models, API responses, and events)
* **Build System**: Vite 6.1 (ESM native, sub-second HMR, optimized roll-up chunking)
* **Cartography & GIS**: Leaflet 1.9 + `react-leaflet` 4.2
* **Icons**: `lucide-react`
* **Styling**: Vanilla Modern CSS Design System (Custom tokens, dark/light themes, zero Tailwind bloat)
* **HTTP Client**: Axios with request/response interceptors for dynamic demo identity headers

### 2.3 Cloud & Infrastructure
* **AWS Serverless Application Model (SAM)**: `aws/template.yaml` defining:
  * Amazon S3 (`SatelliteIngestBucket`)
  * Amazon DynamoDB (`FloodSafe_WaterSources`, `FloodSafe_TestingPlans`, `FloodSafe_AuditLog`)
  * AWS Lambda (`OptimizerFunction` with Python 3.11 runtime and HTTP API trigger)
  * AWS App Runner (`FloodSafeAppRunnerService` containerized full-stack deployment)
* **Containerization**: Multi-stage `Dockerfile` (Node build + Python runtime) & `docker-compose.yml`

### 2.4 Cyber-Physical Edge IoT
* **Microcontroller**: ESP32 DevKit v1 (32-bit dual-core Xtensa LX6)
* **Sensors & Actuators**: HC-SR04 ultrasonic transducer, SSD1306 OLED (I2C), status LEDs, piezo alarm
* **Simulation Environment**: Wokwi Virtual Microcontroller (`hardware/wokwi/`)

---

## 3. Directory & File Structure

```
d:/codeverse/hackathons/AI WATER HACKATHON/
├── aws/
│   ├── lambda_optimizer/
│   │   └── handler.py          # Standalone AWS Lambda handler for greedy coverage optimizer
│   ├── cdk_stack.py            # Infrastructure construct blueprint for AWS deployment
│   └── template.yaml           # AWS SAM CloudFormation infrastructure template
│
├── backend/
│   ├── app/
│   │   ├── auth.py             # AWS Cedar policy evaluation & default-deny engine
│   │   ├── config.py           # Application settings & risk weight configuration loader
│   │   ├── data_generator.py   # Procedural synthetic cluster generator (Assam/Guwahati flood)
│   │   ├── dynamodb_storage.py # Real AWS DynamoDB persistence layer (tables & audit logs)
│   │   ├── geo_utils.py        # Geodesic Haversine math, ray-casting, and drain proximity
│   │   ├── main.py             # FastAPI entrypoint, middleware, and SPA static hosting
│   │   ├── models.py           # Domain Pydantic models (Sources, Plans, Runs, IoT, Tests)
│   │   ├── optimizer.py        # Submodular Greedy Maximum-Coverage optimization algorithm
│   │   ├── risk_engine.py      # Deterministic 5-factor MCDA relative vulnerability scorer
│   │   ├── satellite_pipeline.py# Sentinel-1 radar backscatter calibration & DEM TWI modeling
│   │   ├── stac_discovery.py   # Copernicus Data Space STAC client for real Sentinel-1 scenes
│   │   ├── storage.py          # Unified repository interface (Memory fallback + DynamoDB)
│   │   └── routers/            # Modular REST API endpoints
│   │       ├── assessments.py  # Risk assessment runs (/risk-assessments)
│   │       ├── audit.py        # Execution & Cedar audit log endpoints (/audit)
│   │       ├── config_router.py# MCDA sensitivity tuning (/config/risk)
│   │       ├── events.py       # Flood incident registry (/flood-events)
│   │       ├── field_tests.py  # Mobile rapid/lab test logging (/field-tests)
│   │       ├── iot_sensors.py  # Hydrometric gauge telemetry (/iot-sensors)
│   │       ├── plans.py        # Testing allocation plans (/testing-plans)
│   │       ├── risk_map.py     # GeoJSON risk layer generator (/risk-map)
│   │       ├── satellite.py    # Satellite telemetry & STAC discovery (/satellite)
│   │       └── sources.py      # Water point catalog & detail (/sources)
│   ├── tests/                  # 45 Pytest unit & integration test files
│   ├── Dockerfile              # Backend container definition
│   └── requirements.txt        # Pinned Python package dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Modular UI views & canvas widgets
│   │   │   ├── BenchmarkLab.tsx# Live optimizer empirical benchmark comparisons
│   │   │   ├── CedarStudio.tsx # Interactive Zero-Trust policy & identity studio
│   │   │   ├── Header.tsx      # WeMakeDevs x AWS header with role switcher
│   │   │   ├── KpiCards.tsx    # Live top-line operational metrics
│   │   │   ├── RiskMap.tsx     # Leaflet dark-matter geospatial interactive map
│   │   │   ├── TestingQueue.tsx# Turn-by-turn testing kit dispatch queue
│   │   │   ├── WeightTuningDrawer.tsx # What-if MCDA weight sensitivity drawer
│   │   │   └── WhyModal.tsx    # Mathematical score explainability inspector
│   │   ├── services/
│   │   │   ├── api.ts          # Axios API client with dynamic role headers
│   │   │   └── pdfReport.ts    # One-click client-side dispatch dossier generator
│   │   ├── types/              # TypeScript interface definitions
│   │   ├── App.tsx             # Root dashboard controller & tab state
│   │   └── index.css           # Vanilla CSS design tokens and theme engine
│   ├── package.json
│   └── vite.config.ts
│
├── hardware/
│   └── wokwi/                  # ESP32 hydrometric gauge station simulation
│       ├── sketch.ino          # Firmware for ultrasonic depth telemetry & alerts
│       ├── diagram.json        # Interactive circuit wiring diagram
│       └── README.md           # 1-click Wokwi simulation guide
│
├── policies/
│   └── floodsafe.cedar         # Declarative AWS Cedar policy definition rules
│
├── scripts/
│   ├── evaluate_optimizer.py   # Standalone benchmark vs. Top-K and 1,000 Monte Carlo trials
│   └── drift_check.py          # 10/10 automated specification verifier
│
├── docker-compose.yml          # Local multi-container orchestration (Frontend + Backend)
├── PRD.md                      # Project Requirements Document
├── Architecture.md             # This document
├── Rules.md                    # AI agent & coding constraints
├── Phases.md                   # Development roadmap & lifecycle
├── Design.md                   # UI visual design system & tokens
├── Memory.md                   # Agent state & codebase memory
├── README.md                   # Main GitHub project documentation
└── SUBMISSION.md               # WeMakeDevs judging dossier
```

---

## 4. End-to-End Data Flow

### 4.1 Triage Assessment Pipeline
```
1. Trigger: Disaster Coordinator requests triage for FloodEvent (Guwahati Block)
2. Ingestion:
   - Sources fetched with radar backscatter (dB), DEM elevation (m), and drain distance (m).
   - IoT sensors query real-time stream; offline nodes imputed at 0.5 with penalty.
3. Scoring:
   - risk_engine.py calculates deterministic weighted score [0.0, 1.0].
   - Assigns Risk Band: LOW (<0.3), MODERATE (0.3-0.5), HIGH (0.5-0.7), VERY_HIGH (>=0.7).
4. Spatial Propagation:
   - Any confirmed contaminated field test propagates downstream risk uplift (1.35x downstream, 0.85x upstream).
5. Persistence:
   - Results saved to memory and batch-written to Amazon DynamoDB (FloodSafe_WaterSources).
```

### 4.2 Allocation Optimization Pipeline
```
1. Input: Assessment Run ID, budget K (e.g. 15 kits), coverage radius R (500m).
2. Spatial Indexing:
   - Pairwise distance matrix computed between all candidate sources and population units.
3. Greedy Forward Selection:
   - At each step k ∈ [1..K]:
     Marginal Gain = (Unique Population Covered) × (Source Vulnerability Score)
   - Selects source with maximum marginal gain; adds covered units to global covered set.
4. Baseline Comparison:
   - Computes naive Top-K ranking (picks 15 highest scores directly).
   - Runs 1,000 Monte Carlo random trials to compute mean, median, p5, and p95 coverage.
5. Delivery:
   - Returns selected sites, marginal gains, cumulative coverage, and empirical lift stats.
   - Saves plan to Amazon DynamoDB (FloodSafe_TestingPlans).
```
