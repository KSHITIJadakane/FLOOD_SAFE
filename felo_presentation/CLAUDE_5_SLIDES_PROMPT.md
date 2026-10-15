# MASTER CLAUDE PROMPT: 5-SLIDE HACKATHON PITCH DECK FOR FLOODSAFE

You can copy and paste the prompt below directly into Claude (or Claude Code / Claude Artifacts) to generate a concise, clean, high-impact presentation.

```markdown
You are an expert technical presentation designer and hackathon pitch coach. 
Create a strictly 5-slide, high-impact, beautifully formatted slide deck for "FloodSafe" competing in the WeMakeDevs AWS Environmental Hacks 2026.

RULES & CONSTRAINTS:
1. Maximum length: Exactly 5 slides. Do NOT exceed 5 slides.
2. Structure must follow this exact sequence:
   - Slide 1: Problem Statement
   - Slide 2: Proposed AI Solution
   - Slide 3: Workflow / Architecture
   - Slide 4: Current Progress / Demo
   - Slide 5: Impact & Next Steps
3. Tone: Crisp, technically authoritative, data-backed, executive. No vague buzzwords or fluff.
4. Grounded Metrics: Use the exact benchmark numbers (+194.1% population coverage gain, 221,559 vs 75,341 citizens protected, 45/45 tests passing, 10/10 drift checks).
5. AWS Alignment: Highlight AWS Cedar Policy Engine (`cedarpy`), Amazon DynamoDB, and AWS Lambda serverless optimizer.

---

### SLIDE 1: Problem Statement
- **Headline**: The Post-Flood Water Testing Crisis: Finite Kits vs. Cascading Contamination
- **The Core Problem**: 
  - Following severe riverine floods, run-off contaminates rural drinking water sources (wells, boreholes, public taps), driving deadly outbreaks of cholera, typhoid, and acute diarrhea.
  - Disaster response agencies face a severe operational bottleneck: severely limited rapid water-testing kit budgets (Capacity K << total water points) and constrained field dispatch teams.
- **The Flaw of Traditional Allocation**: 
  - Naive priority systems rank sites purely by individual risk score. This causes catastrophic redundancy: all K testing kits cluster in the single most flooded neighborhood, leaving adjacent high-density wards completely blind.
- **Who Is Affected**: 
  - Rural and peri-urban flood-affected communities, marginalized settlements, and disaster emergency response authorities (NDMA/SDMA, district public health officers) who must decide where to send testing teams within the critical 48-hour post-flood window.

---

### SLIDE 2: Proposed AI Solution
- **Headline**: Explainable Vulnerability Scoring Meets Submodular Maximum-Coverage Optimization
- **How It Works**:
  1. **Dual-Layer Risk Engine (AI/ML)**:
     - Linear, bounded vulnerability scoring [0, 1] combining 5 physical risk dimensions: flood inundation depth, drainage proximity, historical contamination baselines, source vulnerability, and population density.
     - **Robust Missing Data Imputation**: Neutral 0.5 imputation with an explicit data-quality penalty prevents false negatives when sensors go offline.
  2. **Greedy Submodular Maximum-Coverage Optimizer**:
     - Mathematically balances individual source vulnerability with marginal unique population coverage within a 500m service radius.
     - Enforces a strict no-double-counting constraint: once a 500m population cluster is covered by a kit, subsequent kits receive zero marginal gain for that cluster and are forced outward to protect adjacent unserved communities.
  3. **Multi-Source Environmental Intelligence**:
     - Fuses physical ground truth from solar ESP32 IoT water depth nodes (via Wokwi simulation) with real-time Copernicus Sentinel-1 C-band SAR satellite radar (STAC API discovery) to penetrate cloud cover.

---

### SLIDE 3: System Workflow & Architecture
- **Headline**: Cyber-Physical Sensing, Serverless AWS Optimizer, and Zero-Trust Cedar Governance
- **Architecture Flow (4-Tier Pipeline)**:
  1. **Telemetry & Earth Observation Ingestion**:
     - Physical Tier: ESP32 IoT ultrasonic water depth & rise-rate sensors (minute-by-minute ground truth).
     - Satellite Tier: European Copernicus Data Space STAC API (`catalogue.dataspace.copernicus.eu`) fetching calibrated Sentinel-1 SAR passes (penetrates monsoon cloud cover).
  2. **Core Compute & Optimization (AWS Lambda + FastAPI)**:
     - NumPy/Shapely geodesic distance & vulnerability engine running inside FastAPI.
     - Standalone, containerized AWS Lambda Greedy Optimizer (packaged via AWS SAM / CloudFormation).
  3. **Security, Governance & Storage (AWS Cedar + Amazon DynamoDB)**:
     - **AWS Cedar Policy Engine (`cedarpy`)**: Strict default-deny role-based authorization.
     - **Statutory Human-in-the-Loop Guardrail**: A hardcoded, mathematically verified Cedar policy rule `@id("no-automatic-advisory") forbid(...)` prevents the AI engine from ever issuing unilateral public health advisories—reserving final authority strictly for accredited human public health officers.
     - **Amazon DynamoDB**: Real-time storage of scored water points, testing plans, and cryptographically timestamped Cedar decision audit logs.
  4. **Command & Dispatch GIS Canvas**:
     - High-contrast, dark-mode React 18 + Leaflet command interface with transparent "WHY?" mathematical explainability drawers, What-If weight tuning, and 1-click field dispatch manifest exports.

---

### SLIDE 4: Current Progress & Live Demo
- **Headline**: Fully Implemented, Mathematically Proven, and Production-Deployed
- **Key Deliverables & Live Links**:
  - **Live Web App**: Production-deployed and running live at `https://flood-safe.onrender.com`.
  - **Interactive Wokwi IoT Simulation**: Hardware-in-the-loop simulation running live at `https://wokwi.com/projects/477569569661872129` (ESP32 + ultrasonic sensor + OLED + piezo alarm + REST telemetry).
  - **Cedar Policy Studio**: Live DynamoDB audit trail streaming real-time role evaluations, permissions, and policy refusals in the web UI.
  - **Copernicus SAR Explorer**: Live STAC satellite discovery browser for C-band radar scenes across flood basins.
- **Empirical Optimizer Benchmark Results ($K=15$ kits, $R=500\text{m}$, 500 sources, 500 population blocks)**:
  - **FloodSafe Greedy Optimizer**: **221,559 unique citizens protected** (14,770.6 people/kit, 0 double-counted).
  - **Naive Top-K by Risk Score**: **75,341 citizens protected** (kits clustered in redundant overlaps).
  - **FloodSafe Empirical Lift**: **+194.1% increase in protected population** (+146,218 additional citizens shielded).
  - **Random Allocation Baseline (1,000 Monte Carlo runs)**: 72,575 citizens (**+205.3% lift**).
- **Engineering Rigor**:
  - **45/45 Pytest unit & integration tests passing (100%)**.
  - **10/10 automated specification drift checks passing**.

---

### SLIDE 5: Impact & Next Steps
- **Headline**: Scalable Environmental Health Resilience with Verifiable AI Safety
- **Expected Real-World Impact**:
  - **Triples the protective reach of scarce disaster response kits** during the critical first 72 hours of flood relief without requiring additional budget.
  - **Eliminates Testing Blindspots**: Guarantees equitable geographic distribution of water quality assessments across marginalized informal settlements.
  - **Trustworthy & Auditable**: Every recommendation is backed by a linear mathematical proof and an immutable AWS DynamoDB Cedar audit trail.
- **Hackathon Uniqueness**:
  - The only project combining cyber-physical IoT telemetry, orbital SAR satellite radar, submodular mathematical optimization, and formal AWS Cedar security boundaries.
- **Roadmap & Next Steps**:
  1. **Edge Deployment on AWS Greengrass**: Run the Cedar policy engine and risk evaluation directly on local emergency response vehicles with zero internet connectivity.
  2. **Multi-Basin Scaling**: Expand STAC satellite ingestion pipelines across Brahmaputra, Godavari, and Ganga flood plains.
  3. **Bi-directional Water Quality Ingestion**: Ingest real-time rapid field colorimetric strip test results from volunteer mobile web apps to dynamically re-optimize remaining testing routes.
- **Links**:
  - GitHub: `https://github.com/KSHITIJadakane/FLOOD_SAFE`
  - Live App: `https://flood-safe.onrender.com`
```
