# FloodSafe — Post-Flood Water Safety Triage & Response System

> **FloodSafe doesn't replace water testing. It makes every test count.**

FloodSafe is a **post-flood water-source vulnerability triage and testing-allocation prototype**. It helps municipal health and water authorities decide which drinking-water sources to physically test first after a flood, using flood exposure, infrastructure vulnerability, and population served.

> **Project status:** Proposed prototype design. All data, scores, source IDs, and UI examples are **synthetic or illustrative** until implemented and measured. They are not verified municipal data or validated public-health predictions.

## What it does

1. Stores a flood event and a water-source inventory.
2. Computes a transparent, configurable **relative vulnerability priority** per source.
3. Explains every score (feature contributions, missing/stale inputs, config version).
4. Selects up to **K** test sites with a **greedy maximum-coverage** algorithm that avoids double-counting population.
5. Compares the plan to **1,000 random selections** (metrics measured, never hardcoded).
6. Accepts field feedback (simulated in the demo) and re-prioritizes.
7. Keeps an audit trail of data version, config, and selections.

## What it does NOT do

- Detect contamination remotely or from satellite imagery.
- Replace field sampling, lab analysis, or public-health authority.
- Issue boil-water / do-not-drink advisories or trigger shutoffs.
- Claim real-world accuracy or impact from synthetic data.

## Documentation map

| Document | Purpose |
| --- | --- |
| [docs/PROJECT_DESCRIPTION.md](docs/PROJECT_DESCRIPTION.md) | Problem, goals, users, journey, scope |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Components, workflow, module boundaries |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | PostGIS schema, provenance, CRS rules |
| [docs/RISK_ENGINE.md](docs/RISK_ENGINE.md) | Scoring formula, normalization, explainability |
| [docs/OPTIMIZATION.md](docs/OPTIMIZATION.md) | Greedy max-coverage, baseline, metrics |
| [docs/API_SPEC.md](docs/API_SPEC.md) | REST endpoints, schemas, errors |
| [docs/FRONTEND_DESIGN.md](docs/FRONTEND_DESIGN.md) | Screens, components, labelling rules |
| [docs/AWS_DEPLOYMENT.md](docs/AWS_DEPLOYMENT.md) | AWS open-source tooling (Cedar, SAM CLI, LocalStack), local-first plan |
| [docs/AUTHORIZATION_CEDAR.md](docs/AUTHORIZATION_CEDAR.md) | Cedar schema, policies, FastAPI integration, tests |
| [docs/ML_AND_AGENTS.md](docs/ML_AND_AGENTS.md) | Where ML/LLM fit (and don't) |
| [docs/VALIDATION.md](docs/VALIDATION.md) | Tests, evaluation, sensitivity, real-world pathway |
| [docs/SAFETY_AND_LIMITATIONS.md](docs/SAFETY_AND_LIMITATIONS.md) | Safety boundary, ethics, wording rules |
| [docs/IMPLEMENTATION_PHASES.md](docs/IMPLEMENTATION_PHASES.md) | Roadmap, 4-week plan, checklists |
| [docs/DEMO_AND_PITCH.md](docs/DEMO_AND_PITCH.md) | 3-minute demo script and pitch structure |

## Tech stack (proposed)

React + Vite + TypeScript + React-Leaflet · FastAPI + Pydantic · SQLAlchemy/GeoAlchemy2 · PostgreSQL + PostGIS · NumPy/Pandas/GeoPandas/Shapely · pytest · Docker Compose. AWS open-source tools: **Cedar** (authorization, core), SAM CLI + LocalStack (stretch). Built and run locally; AWS deployment is optional and out of scope for the hackathon submission.

## Quick start (target workflow)

```bash
git clone <repo> floodsafe && cd floodsafe
cp .env.example .env                      # no secrets committed
docker compose up -d db                   # PostGIS
cd backend && pip install -r requirements.txt
python ../scripts/generate_synthetic_assets.py --seed 42
python ../scripts/seed_db.py
uvicorn app.main:app --reload             # http://localhost:8000/docs
cd ../frontend && npm install && npm run dev
python ../scripts/evaluate_optimizer.py --k 15 --trials 1000 --seed 42
pytest backend/tests
```

## Repository layout

```text
floodsafe/
├── backend/app/{main,config,models,schemas}.py
├── backend/app/api/{sources,flood_events,testing_queue,field_tests}.py
├── backend/app/services/{risk_engine,coverage_optimizer,geo_utils,incident_brief}.py
├── backend/tests/
├── frontend/
├── data/{raw,processed,synthetic}/
├── scripts/{generate_synthetic_assets,compute_features,seed_db,evaluate_optimizer}.py
├── docs/
├── docker-compose.yml
├── .env.example
└── README.md
```

## Principles

- **Decision support, not diagnosis.** Use "relative vulnerability priority", never "contaminated".
- **Honest metrics.** Every reported number comes from program output with a seed and dataset version.
- **Visible uncertainty.** Synthetic, stale, and missing data are always labelled.
- **Human authority.** Authorized staff decide; the system recommends.
- **Local-first.** The core algorithm runs without any cloud service.

## Limitations

Weights, thresholds, and the radius coverage model are demonstration settings. Better modelled coverage is not proof of reduced disease. See [SAFETY_AND_LIMITATIONS.md](docs/SAFETY_AND_LIMITATIONS.md).
