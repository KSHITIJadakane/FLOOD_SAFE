# 🌊 FloodSafe

> **Post-Flood Drinking Water Vulnerability Triage & Resource Allocation System**  
> *Built with AWS Cedar Policy Engine, FastAPI, and React + Leaflet for the **WeMakeDevs AWS Environmental Hacks 2026**.*

---

[![AWS Cedar](https://img.shields.io/badge/AWS-Cedar_Policy_Engine-FF9900?logo=amazon-aws&logoColor=white)](https://www.cedarpolicy.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Tests](https://img.shields.io/badge/Pytest-37%2F37%20Passed-brightgreen)](file:///backend/tests)
[![Spec Drift Check](https://img.shields.io/badge/Integrity-10%2F10%20Verified-brightgreen)](file:///scripts/drift_check.py)
[![Optimizer Gain](https://img.shields.io/badge/Optimizer_Gain-+177.8%25_vs_Top--K-blueviolet)](file:///scripts/evaluate_optimizer.py)

---

## 📌 Executive Summary

Following severe flood events, rural drinking-water sources (wells, public taps, boreholes, storage points) face high vulnerability to run-off contamination. Disaster response teams operate under strict testing kit budgets ($K$) and manpower constraints.

**FloodSafe** solves the post-flood water testing crisis by combining:
1. **Explainable Relative Vulnerability Scoring**: Transparent, linear risk weighting with neutral imputation ($0.5$) for missing sensor data.
2. **Greedy Maximum-Coverage Optimizer**: Mathematically eliminates redundant overlapping tests within a $500\text{m}$ radius to cover the maximum number of unique at-risk individuals.
3. **AWS Cedar Policy Authorization**: Strict default-deny role-based access control, real-time audit logging, and a hard safety invariant forbidding automated public advisories.

---

## 🏆 WeMakeDevs Judging Alignment

| Hackathon Criterion | FloodSafe Implementation |
| :--- | :--- |
| **01. Idea & Impact** | Concrete environmental public health solution: allocates scarce water-testing kits to protect the maximum number of vulnerable citizens. |
| **02. Built on AWS** | Employs AWS's open-source **Cedar Policy Engine** (`cedarpy`) for security and safety guardrails. Fully containerized with `Dockerfile` and `docker-compose.yml` for AWS App Runner/EC2. |
| **03. Design & Usability** | Intuitive dark-mode GIS canvas, visual "WHY?" breakdown drawers, interactive Cedar Policy Studio, and one-click field dispatch export. |
| **04. Execution** | **37/37 Pytest tests passing**, **10/10 automated integrity checks**, reproducible benchmark script with empirical gains. |
| **05. 3-Min Demo Video** | Clear 180-second walkthrough covering the environmental challenge, transparent scoring, optimizer lift, and AWS Cedar safety moment. |

---

## 📊 Empirical Optimizer Benchmark ($K=15, R=500\text{m}$)

Evaluated across 500 clustered water sources and 500 population units via [`scripts/evaluate_optimizer.py`](scripts/evaluate_optimizer.py):

| Allocation Strategy | Unique Vulnerable Pop Covered | Pop / Test Kit | Performance vs. Baselines |
| :--- | :---: | :---: | :--- |
| **FloodSafe Greedy Max-Coverage** | **218,383** | **14,558.9** | **Selected Optimal Allocation** |
| **Top-$K$ by Risk Score** (Naive Ranking) | 78,609 | 5,240.6 | **+177.8% gain** (disperses kits, avoids overlaps) |
| **Random Baseline** ($1,000$ Monte Carlo Trials) | 73,174.8 | 4,878.3 | **+198.4% gain** over random mean |

```
Why does Greedy Max-Coverage beat Top-K by +177.8%?
Naive Top-K ranking selects the highest individual risk scores, which causes all testing kits 
to cluster densely around the exact same flooded hotspot (redundant tests covering the same 500m radius). 
The Greedy Optimizer balances high vulnerability with marginal unique coverage, dispersing kits 
across distinct population clusters.
```

---

## 🛡️ AWS Cedar Policy Authorization (`policies/floodsafe.cedar`)

FloodSafe utilizes AWS's open-source Cedar language to enforce zero-trust policies:

```cedar
// 1. Strict Default-Deny Architecture
permit (
    principal in Role::"Admin",
    action,
    resource
);

// 2. Triage Lead Permissions
permit (
    principal in Role::"TriageLead",
    action in [
        Action::"RunAssessment",
        Action::"CreatePlan",
        Action::"ReadRiskMap",
        Action::"UpdateWeights"
    ],
    resource
);

// 3. Mandatory Safety Guardrail: No role may issue public panic advisories
forbid (
    principal,
    action == Action::"IssueAdvisory",
    resource
);
```

---

## 🚀 Quick Start & Local Execution

FloodSafe is **100% self-contained** and runs locally with zero external API key requirements.

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Run full test suite
python -m pytest backend/tests/ -v

# Run optimizer benchmark
python scripts/evaluate_optimizer.py

# Start FastAPI server (Swagger at http://localhost:8000/docs)
uvicorn backend.app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🏗️ Project Architecture

```
floodsafe/
├── backend/
│   ├── app/
│   │   ├── auth.py             # AWS Cedar policy evaluation & RBAC
│   │   ├── risk_engine.py      # Transparent linear vulnerability weighting
│   │   ├── optimizer.py        # Greedy Maximum Unique Coverage algorithm
│   │   ├── data_generator.py   # Deterministic synthetic cluster generator
│   │   ├── geo_utils.py        # Haversine geodesics & spatial containment
│   │   ├── main.py             # FastAPI entrypoint
│   │   └── routers/            # REST API endpoints (Assessments, Plans, Sources)
│   ├── tests/                  # 37 Pytest unit & integration tests
│   └── Dockerfile              # Container definition for AWS App Runner/EC2
├── frontend/
│   ├── src/
│   │   ├── components/         # RiskMap, WhyModal, CedarStudio, BenchmarkLab
│   │   ├── App.tsx             # Main operational dashboard
│   │   └── index.css           # Modern dark-mode styling
│   └── package.json
├── policies/
│   └── floodsafe.cedar         # AWS Cedar policy definition file
├── scripts/
│   ├── evaluate_optimizer.py   # Benchmark vs. Top-K & 1,000 random trials
│   └── drift_check.py          # 10/10 automated specification verifier
├── docker-compose.yml
├── SUBMISSION.md               # WeMakeDevs hackathon submission dossier
└── README.md
```

---

## ⚖️ Safety & Ethical Disclaimers

1. **Synthetic Demo Labeling**: All map sources and flood geometries in this demo repository are procedurally generated for validation and benchmarking (`is_synthetic: true`).
2. **Decision-Support vs. Medical Claims**: FloodSafe calculates *relative vulnerability priority* for emergency testing kit dispatch. It never claims laboratory-confirmed bacterial contamination or provides clinical medical advice.
3. **No Silent Zeroes**: Missing field data uses neutral imputation ($0.5$) with explicit data quality indicators in the UI.

---

## 📜 License
MIT License. Built for the WeMakeDevs AWS Environmental Hacks (October 2026).
