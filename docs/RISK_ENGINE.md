# Risk Engine

## 1. Purpose
Estimates **relative vulnerability for prioritizing verification**. It is **not** a probability of contamination, a medical risk score, or a substitute for a water-quality test.

## 2. Formula (initial, configurable)
```text
risk_score =
    0.30 * flood_exposure_norm
  + 0.25 * drain_proximity_risk_norm
  + 0.15 * historical_risk_norm
  + 0.15 * source_vulnerability_norm
  + 0.15 * population_exposure_norm
```
All inputs are normalized to a documented 0–1 scale. **Weights are demonstration settings, not scientifically validated constants.** They live in a versioned config file.

```yaml
# config/risk_config_v1.yaml
config_version: risk-v1
weights:
  flood_exposure: 0.30
  drain_proximity_risk: 0.25
  historical_risk: 0.15
  source_vulnerability: 0.15
  population_exposure: 0.15
missing_policy:
  default: neutral_with_confidence_penalty   # documented, never silent zero
  neutral_value: 0.5
bands:                    # display only, not validated thresholds
  low: [0.00, 0.25]
  moderate: [0.25, 0.50]
  high: [0.50, 0.75]
  very_high: [0.75, 1.00]
```

## 3. Feature definitions
| Feature | Definition | Direction |
| --- | --- | --- |
| flood_exposure | overlap/association with flood layer; record layer, timestamp, resolution, method | higher → higher score |
| drain_proximity_risk | documented transform of distance to drain, e.g. `1 - clip(d / d_max, 0, 1)` | closer → higher |
| historical_risk | from authorized documented incidents; missing if none | higher → higher |
| source_vulnerability | rule-based from source type and protection attributes | higher → higher |
| population_exposure | normalized population served | higher → higher (consequence, not unsafety) |

Distance alone does not prove contamination; the doc and UI must say so.

## 4. Normalization and missing data
For each feature document: raw field & units · transform · valid range & clipping · missing-value policy · timestamp & resolution · direction.

- **Never silently replace missing with zero** (zero reads as "no observed risk").
- Use a documented neutral imputation **and** lower the confidence/quality flag, or exclude the feature and renormalize remaining weights (document which).
- Min-max is outlier-sensitive and dataset-dependent: **store normalization parameters** per run. Do not compare scores across incidents/datasets unless the process supports it.

## 5. Risk bands
Low / Moderate / High / Very High for UI grouping only. Always labelled **"relative vulnerability priority"**, never "contamination status".

## 6. Explainability
Per source expose: total score · each normalized value · each weighted contribution · missing/stale inputs · plain-language explanation · config & data versions.

Explanation text must be generated from the stored contribution values (template-based), so it always matches the score.

> *Example only:* "Source SYN-047 — relative vulnerability score 0.91. Ranked highly because the modeled flood-exposure indicator is high, mapped drainage distance is short, and ~5,820 people are associated with it. This is a reason to prioritize verification, not evidence the water is contaminated."

## 7. Reference implementation sketch
```python
from dataclasses import dataclass

@dataclass(frozen=True)
class RiskConfig:
    version: str
    weights: dict[str, float]
    neutral_value: float = 0.5

def score_source(features: dict[str, float | None], cfg: RiskConfig) -> dict:
    contributions, missing = {}, []
    for name, w in cfg.weights.items():
        v = features.get(name)
        if v is None:
            missing.append(name)
            v = cfg.neutral_value            # documented policy
        contributions[name] = w * min(max(v, 0.0), 1.0)
    score = sum(contributions.values())
    quality = 1.0 - len(missing) / len(cfg.weights)
    return {"risk_score": score, "contributions": contributions,
            "missing_features": missing, "quality": quality,
            "config_version": cfg.version}
```

## 8. Tests
- Weights sum to 1; scores in [0, 1]
- Deterministic for fixed data + config
- Missing features flagged, never silently zero
- Monotonicity: increasing flood exposure never lowers score
- Explanation components sum to total score
- Sensitivity: perturb weights ±20% and report rank stability (Spearman / top-K overlap)
