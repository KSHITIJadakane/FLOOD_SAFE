# FloodSafe: Post-Flood Drinking Water Vulnerability Triage & Resource Allocation System

> **Competition**: WeMakeDevs AWS Environmental Hacks 2026  
> **Topic**: Post-Flood Drinking Water Emergency Resource Allocation  
> **Format**: Executive Pitch Deck (8 Slides)

---

## Slide 1: Cover Slide

### Title
# FloodSafe
### Subtitle
**Post-Flood Drinking Water Vulnerability Triage & Resource Allocation System**

### Hackathon Metadata
* **Event**: WeMakeDevs AWS Environmental Hacks (October 2026)
* **Track**: Environmental & Public Health / AWS Open-Source AI

### Core Technology Stack
* 🛰️ **Copernicus Sentinel-1 SAR** (C-Band Microwave Radar)
* ⛰️ **DEM Hydrology** (Topographic Wetness Index & Catchment Flow)
* 🎯 **Greedy Submodular Optimizer** (Maximum Unique Coverage)
* 🛡️ **AWS Cedar Engine** (Zero-Trust Declarative Policy Guardrails)
* ⚡ **AWS Serverless Stack** (DynamoDB Tables + Lambda + API Gateway)
* 📡 **Cyber-Physical Edge** (ESP32 Hydrometric Stations in Wokwi)

---

## Slide 2: The Real-World Crisis

### Header
**THE REAL-WORLD CRISIS**
### Main Title
## The Hidden Killer After Severe Floods

### Key Realities
* **Invisible Contamination Surge**: When floodwaters engulf villages and municipalities, sewers, latrines, and industrial runoff overflow directly into community wells and tubewells.
* **The Deceptive Water Trap**: Contaminated well water frequently looks crystal clear. Families drink what appears to be clean water, introducing virulent pathogens (*Vibrio cholerae*, *Salmonella enterica*, *E. coli*).
* **Deadlier Than Drowning**: Historically, waterborne epidemic outbreaks in the weeks following a flood claim significantly more casualties than the initial flood surge itself.
* **The High-Risk Clock**: Relief agencies have a narrow 48-to-72 hour window to identify and triage compromised water points before widespread community transmission begins.

---

## Slide 3: The Operational Bottleneck

### Header
**THE OPERATIONAL BOTTLENECK**
### Main Title
## 500 Drinking Wells vs. 15 Testing Kits

### The Resource Scarcity Challenge
* **Severe Kit Budget Constraints ($K$)**: Field disaster response teams arrive with only 15 to 25 chemical testing kits in their trucks to assess an entire district with 500+ candidate sources.
* **Zero Ground Visibility**: Responders on the ground lack real-time visibility into which wells were submerged, which sit downhill from broken latrines, or where high-risk camps are sourcing water.
* **The Naive Testing Trap (Current Industry Failure)**:
  * **Testing by Road Convenience**: Teams sample wells closest to the paved highway, abandoning isolated rural settlements.
  * **Naive Score Ranking**: Teams pick the top-scoring sites, which naturally cluster together in the same 500m puddle, wasting precious kits on overlapping coverage.

---

## Slide 4: The FloodSafe Breakthrough

### Header
**THE BREAKTHROUGH SOLUTION**
### Main Title
## From Guesswork to Precision Public-Health Triage

### Three Integrated Pillars

#### 1. Space & Terrain Physics
* **Sentinel-1 SAR Radar**: C-band active microwave radar penetrates heavy monsoon cloud cover to measure specular surface water reflection ($\sigma^0 \le -16.5\text{ dB}$).
* **DEM Hydrologic Gradient**: Calculates Beven-Kirkby Topographic Wetness Index ($\text{TWI} = \ln(a / \tan\beta)$) to identify downhill pooling near open drains.
* **Real Sentinel-1 STAC Integration**: Live metadata discovery querying the open Copernicus Data Space STAC catalog for actual SAR acquisitions.

#### 2. Explainable Multi-Criteria Scoring
* **Transparent Linear MCDA Formula**:
  $$\text{Vulnerability} = 0.30\times\text{Flood} + 0.25\times\text{Drainage} + 0.15\times\text{History} + 0.15\times\text{Source} + 0.15\times\text{Population}$$
* **No Silent Zeroes**: Missing sensor features use neutral imputation ($0.5$) with explicit data quality penalty badges.
* **Ethical Boundary**: Decision-support prioritization signal; strictly avoids false laboratory diagnosis.

#### 3. Submodular Kit Optimizer
* **Greedy Maximum Coverage Algorithm**: Dispatches testing kits to maximize unique human lives protected while mathematically eliminating redundant 500m overlapping buffers.

---

## Slide 5: Proven Mathematical Lift

### Header
**PROVEN MATHEMATICAL LIFT**
### Main Title
## Submodular Optimization: +194.1% Greater Population Coverage

### Empirical Benchmark Summary ($K=15$ Test Kits, $R=500\text{m}$ Radius, 500 Sources, 500 Population Units)

| Allocation Strategy | Unique High-Risk Pop Covered | Pop Covered / Kit | Performance Lift vs. Baseline |
| :--- | :---: | :---: | :--- |
| **FloodSafe Greedy Max-Coverage** | **221,559** | **14,770.6** | **Optimal Selected Strategy (Runtime: 24.6 ms)** |
| **Top-$K$ by Risk Score** (Naive Ranking) | 75,341 | 5,022.7 | **+194.1% FloodSafe Lift** (Naive clusters redundantly) |
| **Random Selection** ($1,000$ Monte Carlo Trials) | 72,575 | 4,838.3 | **+205.3% FloodSafe Lift** over random mean |

### Why Naive Ranking Fails
> Naive Top-K ranking picks the 15 sources with highest individual risk scores. Because flooding is continuous, all 15 top wells cluster inside the same flooded neighborhood, testing the same 500m population over and over. FloodSafe's Greedy Optimizer evaluates **marginal unique gain**, dispersing test kits across distinct vulnerable communities.

---

## Slide 6: AWS Cloud & Zero-Trust Safety

### Header
**AWS ARCHITECTURE & SECURITY**
### Main Title
## AWS Serverless Stack & Cedar Zero-Trust Guardrails

### Genuine AWS Serverless Blueprint (SAM Deployable)
* **Amazon DynamoDB (Pay-Per-Request)**:
  * `FloodSafe_WaterSources`: Scored water sources with geospatial coordinates and vulnerability metadata.
  * `FloodSafe_TestingPlans`: Optimized testing plans with coverage metrics.
  * `FloodSafe_AuditLog`: Immutable, timestamped audit trail of all policy authorization decisions.
* **AWS Lambda Optimizer Function**: Standalone Python 3.11 Lambda handler (1024MB, 60s timeout) running the greedy submodular algorithm on demand via Amazon API Gateway (`POST /optimize`).
* **AWS App Runner**: Production container service hosting the full-stack engine with Gzip compression.

### AWS Cedar Policy Engine (`cedarpy`)
* **Strict Default-Deny Semantics**: Any role or action without explicit permit is denied with HTTP 403.
* **Role Separation**:
  * `Operator`: Can run assessments and generate testing allocation plans.
  * `FieldRecorder`: Can submit rapid simulated field tests.
  * `Admin`: Exclusive authority to record verified statutory laboratory tests.
* **The Non-Negotiable Safety Invariant**:
  ```cedar
  // The software engine is strictly FORBIDDEN from issuing public panic advisories
  forbid (principal, action == FloodSafe::Action::"IssueAdvisory", resource);
  ```

---

## Slide 7: Cyber-Physical Ground Truth (Wokwi ESP32 IoT)

### Header
**CYBER-PHYSICAL HARDWARE INTEGRATION**
### Main Title
## Real-Time Hydrometric Edge Stations & Interactive Simulation

### Embedded Edge Node Architecture
* **Microcontroller**: ESP32 DevKit v1 with dual-core processing, FreeRTOS, and WiFi connectivity.
* **Acoustic Depth Sensor**: HC-SR04 ultrasonic transducer measuring water level and rate of rise (m/hr).
* **Local Field Display**: SSD1306 0.96" I2C OLED display showing real-time water depth and alert state.
* **Physical Alarm Indicators**: 3 status LEDs (Green = Normal, Yellow = Warning, Red = Flood Overtopping) + Piezo Buzzer.
* **Field Revisit Bridge**: Bridges the 6-to-12 day satellite orbit latency with minute-by-minute physical ground truth.

### 1-Click Interactive Web Simulation
* **Live Wokwi URL**: 👉 **[wokwi.com/projects/477569569661872129](https://wokwi.com/projects/477569569661872129)**
* **Hands-On Judging Demo**: Adjust the simulated water depth slider to watch the OLED update in real-time, trigger overtopping alarms, and stream JSON telemetry into the FloodSafe REST API.

---

## Slide 8: Judging Summary & Verification

### Header
**JUDGING SUMMARY & PRODUCTION READINESS**
### Main Title
## Complete, Verified & Defensible Environmental Impact

### Hackathon Judging Alignment Scorecard

| Criterion | Implementation & Evidence |
| :--- | :--- |
| **01. Idea & Impact** | Tackles the #1 post-flood killer (waterborne epidemics) by scientifically optimizing scarce test kits to cover **+194.1% more citizens**. |
| **02. Built on AWS** | AWS Cedar zero-trust engine (`cedarpy`), Amazon DynamoDB persistent tables, AWS Lambda greedy optimizer, and SAM template. |
| **03. Design & Usability** | Dark-matter Leaflet GIS canvas, transparent "WHY?" mathematical formula breakdown, interactive Cedar Studio, and What-If weight tuning. |
| **04. Engineering Health** | **45/45 Pytest unit & integration tests passing (100%)**, **10/10 automated spec integrity checks passing**, open Copernicus STAC API integration. |

### Closing Call to Action
* **Live Web App**: [https://flood-safe.onrender.com](https://flood-safe.onrender.com)
* **Wokwi IoT Hardware Simulation**: [https://wokwi.com/projects/477569569661872129](https://wokwi.com/projects/477569569661872129)
* **GitHub Repository**: [https://github.com/SumedhXy/Flood_safe](https://github.com/SumedhXy/Flood_safe)
