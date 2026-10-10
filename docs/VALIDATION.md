# Validation & Evaluation Plan

## 1. Software correctness
Test deterministic behavior, normalization, missing values, geometry operations, source-to-event association, budget limits, unique coverage accounting, API serialization.

## 2. Optimizer evaluation
Freeze synthetic dataset and config. Compare greedy vs random **and vs top-K by score** using identical candidate pool, K, coverage rule. Record seed, trials (≥1,000), dataset version, and actual metrics.
Include tests: (a) all candidates cover the same population; (b) coverage areas do not overlap.

## 3. Sensitivity analysis
Vary risk weights (e.g., ±20%) and K. Report rank stability (top-K overlap, Spearman). If small weight changes radically reorder the queue, label the result unstable and say so.

## 4. Geographic plausibility
Check synthetic clusters follow plausible settlement patterns; distances in proper units; edge cases near flood boundary and drainage. Distinguish illustrative geography from verified local geography.

## 5. Test matrix
| Area | Tests |
| --- | --- |
| Risk engine | weights sum to 1; bounds [0,1]; determinism; monotonicity; missing flagged; contributions sum to score |
| Normalization | clipping; constant feature (zero range); outliers; params persisted |
| Geo | CRS transform; known-distance fixtures; polygon-edge points |
| Optimizer | ≤K; no double count; ties; K=0; K>N; empty units |
| Baseline | same coverage fn; seed reproducibility |
| API | schema validation; error codes; synthetic flag; verification_status enum |
| UI | labels visible; simulated ≠ verified; no "contaminated" wording |

## 6. Real-world validation pathway
1. Obtain authorized inventory and event data.
2. Agree feature definitions with water/public-health experts.
3. Compare priorities with historical inspections and lab results where ethically/legally permitted.
4. Evaluate false-priority and missed-priority patterns, data gaps, uncertainty.
5. Calibrate features and weights with domain expertise.
6. Run a limited supervised pilot with human review.
7. Establish maintenance, monitoring, security, governance.

A synthetic hackathon result **cannot** establish predictive validity or public-health effectiveness.

## 7. Evaluation script outputs
`scripts/evaluate_optimizer.py` prints and saves JSON:
```json
{ "dataset_version": "synthetic-v1", "seed": 42, "k": 15, "radius_m": 500,
  "trials": 1000, "optimizer_unique_pop": null, "random_mean": null,
  "random_median": null, "topk_by_score_unique_pop": null, "random_p5": null, "random_p95": null,
  "covered_per_test": null }
```
Values are filled by execution — never typed by hand.
