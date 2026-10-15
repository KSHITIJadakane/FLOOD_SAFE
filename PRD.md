# 📋 Project Requirements Document (PRD) — FloodSafe

> **Project Name**: FloodSafe  
> **Tagline**: Post-Flood Drinking Water Vulnerability Triage & Resource Allocation System  
> **Event**: WeMakeDevs AWS Environmental Hacks (October 2026)  
> **Status**: Production-Ready Prototype & Verified Benchmark

---

## 1. Problem Statement & Background

### 1.1 The Real-World Crisis
Following severe seasonal flood events (monsoons in South Asia, hurricanes in the Americas), municipal and rural drinking-water infrastructure (shallow wells, tubewells, boreholes, public taps, and elevated storage points) suffers severe contamination:
* Receding floodwaters inundate latrines, septic tanks, and industrial drainage channels, flushing sewage and pathogens (*Vibrio cholerae*, *Salmonella enterica*, *E. coli*) into ground aquifers.
* Contaminated floodwater often appears visually clear to community members, leading to widespread ingestion and rapid transmission of waterborne epidemics.
* Historically, post-flood waterborne outbreaks claim more lives than physical drowning during the surge.

### 1.2 The Operational Bottleneck
Emergency response teams (UNICEF, Red Cross, NDRF, municipal health bodies) face an acute logistical asymmetry:
* **The Scale Disparity**: Over **500+ drinking water sources** across a flooded administrative block or district.
* **The Kit Budget Scarcity**: Field response trucks carry only a finite allocation of chemical/bacteriological test kits ($K = 15 \text{ to } 25$).
* **Current Industry Failure**:
  * *Convenience Bias*: Teams test sources nearest paved transport corridors, abandoning remote, submerged rural clusters.
  * *Naive Clustering Trap*: Teams pick the highest-risk single sites, causing all 15 kits to cluster redundantly around the exact same flooded hotspot, repeatedly testing the same 500m population pocket while ignoring adjacent vulnerable populations.

---

## 2. Target Users & Personas

| Persona | Role | Key Needs & JTBD (Jobs to be Done) |
| :--- | :--- | :--- |
| **Emergency Triage Lead** | Disaster Response Coordinator (UNICEF / NDRF / District Magistrate) | Needs high-level spatial risk overview, one-click optimal testing kit dispatch plans, and provable population protection metrics to justify aid resource usage. |
| **Field Health Operator** | Mobile Sampling Technician in Response Truck | Needs prioritized turn-by-turn testing queues, GPS coordinates, and rapid field test outcome logging with offline resilience. |
| **Chief Public Health Officer** | Statutory State Health Official | Needs verifiable audit trails, zero-trust policy enforcement, and guarantees that automated systems cannot accidentally broadcast public panic advisories without multi-sign-off verification. |
| **Public Observer / NGO Partner** | External Agency / Relief Monitor | Needs read-only transparency into regional vulnerability heatmaps and explainable risk factor breakdowns without mutation access. |

---

## 3. Product Goals & Success Metrics

### 3.1 Primary Goals
1. **Maximize Unique Human Lives Protected**: Given a budget of $K$ test kits, mathematically maximize the unique at-risk population covered within a radius $R$ ($500\text{m}$).
2. **Transparent, Explainable Triage Scoring**: Replace opaque black-box AI with deterministic Multi-Criteria Decision Analysis (MCDA), giving field officers an instant mathematical breakdown of every score.
3. **Multi-Modal Data Fusion**: Fuse Earth Observation space radar (Sentinel-1 SAR), terrain hydrology (DEM TWI), and physical edge IoT sensors (ESP32 ultrasonic nodes).
4. **Safety & Zero-Trust Governance**: Enforce strict default-deny authorization via AWS Cedar policy engine, with a hard invariant prohibiting automated panic broadcasts.

### 3.2 Key Performance Indicators (KPIs)
* **Optimization Lift vs. Naive Top-K**: $\ge +150\%$ unique population covered (Current measured: **+194.1%**).
* **Optimization Lift vs. Random Selection**: $\ge +180\%$ unique population covered (Current measured: **+205.3%**).
* **Algorithm Execution Latency**: $< 100\text{ms}$ for 500 sources and 500 population units (Current measured: **$24.6\text{ms}$**).
* **Code Reliability**: 100% test pass rate across unit, integration, and drift check suites (Current: **45/45 tests passed**, **10/10 drift checks passed**).

---

## 4. Key Functional Features

### 4.1 Real-Time Geospatial Risk Canvas (GIS)
* Interactive dark-matter Leaflet map rendering:
  * Flooded inundation polygon contours.
  * 500 candidate drinking-water sources color-coded by risk band (`Very High` [red], `High` [amber], `Moderate` [blue], `Low` [green]).
  * Spatial coverage buffer circles ($500\text{m}$) demonstrating non-overlapping submodular kit dispatch.
  * Live status pulses from 12 in-situ IoT hydrometric gauge stations.

### 4.2 Multi-Criteria Explainable Risk Engine
* Five-factor weighted linear formula:
  $$\text{Score} = w_1 \cdot \text{Flood} + w_2 \cdot \text{Drainage} + w_3 \cdot \text{History} + w_4 \cdot \text{SourceVuln} + w_5 \cdot \text{PopDensity}$$
  Default weights: $0.30, 0.25, 0.15, 0.15, 0.15$ ($\sum w_i = 1.0$).
* **No Silent Zeroes Policy**: Any missing field measurement is neutral-imputed at $0.5$ with an explicit data-quality penalty and UI badge.
* **Explainability Inspector**: Click any water source to inspect feature contributions, raw values, quality scores, and ethical disclaimers.

### 4.3 Submodular Maximum Coverage Optimizer
* Input: Scored sources, population units, budget $K$, coverage radius $R$.
* Algorithm: Greedy submodular optimization with marginal unique gain tracking.
* Baseline Comparison Engine: Automatically benchmarks against naive Top-K ranking and 1,000 Monte Carlo random trials.

### 4.4 Earth Observation & Satellite STAC Discovery
* Direct integration with Copernicus Sentinel-1 C-band Synthetic Aperture Radar (SAR).
* Water specular reflection detection ($\sigma^0 \le -16.5\text{ dB}$).
* Digital Elevation Model (DEM) Beven-Kirkby Topographic Wetness Index ($\text{TWI} = \ln(a / \tan\beta)$).
* Live STAC catalog discovery (`GET /api/v1/satellite/discover`) querying the open Copernicus Data Space Ecosystem STAC API for real SAR metadata.

### 4.5 AWS Cedar Zero-Trust Authorization & Audit
* Declarative Cedar policy specifications (`policies/floodsafe.cedar`) using `cedarpy`.
* Role-based permissions (`Viewer`, `Operator`, `FieldRecorder`, `Admin`).
* Non-negotiable safety invariant: `IssueAdvisory` is unconditionally `FORBIDDEN` across all roles.
* Persistent DynamoDB audit trail logging all authorization decisions.

### 4.6 Cyber-Physical IoT Ground Truth Simulation
* In-situ hydrometric station simulated in Wokwi (ESP32 + HC-SR04 ultrasonic transducer + SSD1306 OLED + alarm piezo).
* 1-Click browser simulation link: `wokwi.com/projects/477569569661872129`.
* RESTful telemetry ingestion (`PATCH /api/v1/iot-sensors/{node_id}/telemetry`).

---

## 5. Non-Functional Requirements

* **Determinism**: Identical random seeds and weight configurations must produce bit-for-bit identical allocation plans.
* **Portability**: Must run 100% self-contained locally via Docker Compose or native Python/Node with zero paid API keys required.
* **Security & Privacy**: Zero-trust default-deny on all mutation routes; all audit events logged immutably.
* **Performance**: Sub-50ms API response time for assessment runs and allocation plan generation.
