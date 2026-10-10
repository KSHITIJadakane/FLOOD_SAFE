# ML, LLM, and Agents

## 1. Position
The MVP is **deterministic and rule/weight-based**. There is no labelled field data to train a supervised model, and an unvalidated model would be less trustworthy than a transparent formula. No multi-agent system is built "to advertise agentic AI".

## 2. What is not ML in the MVP
- Risk score: weighted sum of normalized features
- Selection: greedy maximum coverage
- Explanations: template text generated from stored contributions

## 3. Optional LLM: incident brief
**Allowed:** summarize already-computed structured values into a short brief (top priorities, plan coverage, data gaps, limitations).
**Forbidden:** inventing source facts, setting/modifying scores, declaring contamination or safety, issuing advisories.

Guardrails:
- Input is a **validated JSON object** of computed fields only
- Output is **schema-validated**, length-bounded, labelled "Generated assistance"
- Post-check: reject outputs containing forbidden claims ("contaminated", "safe to drink") or numbers not in the input
- Timeouts + fallback to template text; the app is fully usable without the LLM

```json
{
  "event": "Synthetic Flood 2026-A",
  "k": 15,
  "selected": ["SYN-047", "SYN-112"],
  "coverage": {"unique_population": 0, "pct_high_risk": 0.0},
  "baseline": {"mean": 0, "p95": 0},
  "top_drivers": ["flood_exposure", "drain_proximity_risk"],
  "data_gaps": ["historical_risk missing for 31 sources"],
  "is_synthetic": true
}
```

System prompt sketch:
> You write a 100-word operational brief from the JSON provided. Use only values in the JSON. Do not state or imply any source is contaminated or safe. Say this is a prioritization aid for field verification. If `is_synthetic` is true, say so first.

## 4. Future ML (only with real labelled data)
| Idea | Precondition |
| --- | --- |
| Calibrate weights via logistic regression / gradient boosting on field-test outcomes | authorized historical inspections + lab results, ethics/legal review |
| Uncertainty estimates (calibration curves, conformal intervals) | enough labelled samples per region |
| Learning-to-rank for queue | validated outcomes, fairness analysis |
| Adaptive re-prioritization from new results | defined update rule; spatial leakage handled |

Requirements before use: leakage-free spatial/temporal cross-validation, calibration, sensitivity analysis, expert review, supervised pilot. ML output would **replace nothing** until validated and remain explainable.

## 5. Possible agentic tooling (non-core)
Narrow, human-approved assistants only, e.g.: data-quality checker that flags missing fields; report drafter. Each tool has typed inputs/outputs, no write access to scores or advisories, and an audit log.
