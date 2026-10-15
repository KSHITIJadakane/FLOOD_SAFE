# FloodSafe — Hackathon Submission & Judging Dossier
**WeMakeDevs AWS Environmental Hacks (Oct 8–11, 2026)**

---

## 01 | Idea and Impact (Environmental & Public Health)

### The Real Problem
Following severe flood events, municipal drinking-water sources (wells, public taps, boreholes, storage points) face high vulnerability to run-off contamination. Disaster response teams operate under severe kit and manpower constraints ($K$ testing kits available vs. hundreds of at-risk sources). 

Without intelligent decision support, response teams either:
1. Test unsystematically, missing isolated high-vulnerability populations.
2. Naively pick the top-risk sites, causing testing kits to cluster redundantly around the exact same flooded hotspot (wasting kits on overlapping coverage areas).

### The Measurable Impact
* **Vulnerability Triage Without Overclaiming**: Calculates relative vulnerability priority for triage, strictly avoiding premature medical contamination claims.
* **Maximized Population Protection**: Optimizes allocation across 500 candidate sources to protect the maximum number of unique vulnerable individuals under a fixed budget $K$.
* **Measurable Lift**: Covers **218,383 unique high-risk residents** with 15 test kits—delivering a **+177.8% gain over standard Top-K ranking** and **+198.4% over random selection**.

---

## 02 | Built on AWS (Open-Source Tools & Architecture)

### 1. AWS Cedar Policy Language & Authorization (`cedarpy`)
FloodSafe embeds AWS’s open-source **Cedar Policy Engine** (`policies/floodsafe.cedar`) for zero-trust RBAC and safety guardrails:
* **Default-Deny Policy Structure**: Unauthorized roles or unknown users receive an immediate `403 FORBIDDEN`.
* **Automated Safety Invariant**: `IssueAdvisory` is unconditionally `FORBIDDEN` across all roles (including Admin) to prevent unvalidated public panics.
* **Role-Gated Operational Actions**: Plan creation and parameter tuning are restricted to `TriageLead` and `Admin`. Simulated field tests are open to `FieldOperator`, but verified lab overrides require `Admin`.

### 3. Cyber-Physical IoT Telemetry & Wokwi Hardware Simulation
To bridge the gap between orbital satellite latency and physical ground truth, FloodSafe integrates in-situ hydrometric IoT stations with an interactive **Wokwi microcontroller simulation** (`hardware/wokwi/`):
* **Simulated Hardware Node**: ESP32 DevKit + HC-SR04 ultrasonic water depth sensor + SSD1306 OLED (I2C) + 3 status LEDs + piezo overtopping alarm.
* **Multi-Source Sensor Fusion**: Combines Copernicus Sentinel-1 SAR orbital backscatter ($55\%$) with real-time ground water level depth ($45\%$).
* **Live Telemetry Interface**: Emits RESTful JSON telemetry updates (`PATCH /api/v1/iot-sensors/{node_id}/telemetry`) with "No Silent Zeroes" neutral ($0.5$) fallback for offline nodes.
* **1-Click Live Simulation**: 👉 [wokwi.com/projects/477569569661872129](https://wokwi.com/projects/477569569661872129) or in VS Code with the Wokwi extension.

---

## 03 | Design and Usability

### User-Centric Decision Workflow
Designed for emergency coordinators, field responders, and public-health officers who need rapid clarity under crisis conditions:
* **Real-Time GIS Risk Canvas**: Dark-matter cartographic map visualizing flood inundation contours, 500 water sources color-coded by vulnerability score, 12 in-situ IoT hydrometric stations with live telemetry pulses, and 500m spatial coverage buffers.
* **Transparent "WHY?" Explainability Panel**: Clicking any water source breaks down the exact mathematical formula components:
  $$\text{Score} = 0.30\times\text{Flood} + 0.25\times\text{Drainage} + 0.15\times\text{History} + 0.15\times\text{Source Vuln} + 0.15\times\text{Pop Density}$$
  Missing data uses documented **neutral imputation ($0.5$)** with visible data quality badges (no silent zeroes).
* **Live Cedar Policy Studio**: Interactive UI role-switcher (`Admin`, `TriageLead`, `FieldOperator`, `Viewer`) displaying real-time allow/deny evaluation and Cedar policy definitions.
* **One-Click Export**: Testing queue generates standardized CSV and GeoJSON allocations for field deployment.

---

## 04 | The Execution (Empirical Evidence & Code Quality)

### 1. Fully Working Test Suite (44/44 Pytest Passed)
```text
backend/tests/test_api.py .......... [8 passed]
backend/tests/test_auth_cedar.py ... [8 passed]
backend/tests/test_config_router.py  [2 passed]
backend/tests/test_iot_sensors.py .. [4 passed]
backend/tests/test_optimizer.py .... [7 passed]
backend/tests/test_phase1.py ....... [5 passed]
backend/tests/test_risk_engine.py .. [7 passed]
backend/tests/test_satellite.py .... [3 passed]
==================== 44 passed in 2.78s ====================
```

### 2. Specification Drift & Integrity Verification (10/10 Passed)
* Automated validation confirms `is_synthetic=True` tagging, neutral $0.5$ imputation, non-contamination disclaimers, Cedar default-deny, and zero double-counting.

### 3. Empirical Optimizer Benchmark (500 Sources, $K=15$, $R=500\text{m}$)
| Allocation Strategy | Unique Vulnerable Pop Covered | Pop / Kit | Lift Over Baseline |
| :--- | :---: | :---: | :---: |
| **FloodSafe Greedy Max-Coverage** | **218,383** | **14,558.9** | **Selected Optimal Strategy** |
| **Top-$K$ by Risk Score** (Naive Ranking) | 78,609 | 5,240.6 | **+177.8% gain** by eliminating overlaps |
| **Random Baseline** ($1,000$ Monte Carlo Trials) | 73,174.8 | 4,878.3 | **+198.4% gain** over random mean |

---

## 05 | The Demo Video (3-Minute Structure)

| Timestamp | Screen / View | Action & Narrative |
| :--- | :--- | :--- |
| **0:00 – 0:35** | Hero / Map Overview | **Problem Hook**: Limited water testing kits after a flood disaster. Why naive triage fails. |
| **0:35 – 1:15** | Map + "WHY?" Modal + Wokwi IoT Sim | **Explainable AI & Ground Reality**: Transparent mathematical weights, neutral 0.5 imputation, and live ESP32 ultrasonic water-depth simulation in Wokwi fusing with Sentinel-1 SAR. |
| **1:15 – 2:05** | Testing Queue + Benchmark Lab | **Greedy Optimization**: +177.8% more people protected vs. naive ranking by eliminating spatial overlaps. |
| **2:05 – 2:40** | Cedar Policy Studio | **AWS Cedar Security**: Default-deny in action, 403 blocks for Viewer role, and forbid on public advisories. |
| **2:40 – 3:00** | Field Feedback & Export | **Closed-Loop Action**: Field tests update spatial risk; export GeoJSON dispatch list. |

---

## 06 | Verification & Limitations Disclosure

1. **Synthetic Demonstration Data**: All source locations and flood polygons are procedurally generated for demonstration and benchmarking purposes (`is_synthetic: true`).
2. **Decision Support, Not Clinical Diagnosis**: Vulnerability scores represent relative prioritization for testing resource deployment, not medical laboratory confirmation of pathogen contamination.
