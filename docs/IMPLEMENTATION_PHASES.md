# Implementation Phases (AWS open-source, local-first)

Scoring is on **working execution**: one feature that runs beats five that almost do. Build in this order and stop adding scope when time is short. Check the event page for the submission deadline.

## Priority order
| # | Deliverable | Must / Cut? |
| --- | --- | --- |
| 1 | Synthetic dataset (~500 sources, flood polygon, population units), seeded, labelled | Must |
| 2 | Risk engine: score + contributions + missing flags + tests | Must |
| 3 | Greedy optimizer + tests (≤K, no double count) | Must |
| 4 | Evaluation script: optimizer vs **top-K by score** vs 1,000 random | Must |
| 5 | API: sources, queue, plans, risk-map | Must |
| 6 | UI: map, queue, WHY panel, K control, synthetic banner | Must |
| 7 | **Cedar authorization** + tests + demo 403 moment | Must (the AWS tool) |
| 8 | Plan export (CSV) | Should |
| 9 | Field-feedback simulation + reassessment | Should |
| 10 | LocalStack S3 + SAM local ingestion | Stretch |
| 11 | LLM brief (Strands/Bedrock) | Cut unless everything else is done |
| 12 | Deployment on AWS | Cut |

## Phase 1 — Foundation
Repo, Docker Compose (PostGIS), FastAPI `/health`, schema, synthetic generator with seed.
**Done when:** `docker compose up` + seed gives a labelled dataset.

## Phase 2 — Risk engine
Config-driven weighted score, contributions, missing-data policy, tests.
**Done when:** every source has a score and explanation that sums to the score.

## Phase 3 — Optimizer and evaluation
Unique-coverage greedy, tie-breaks, baselines (random **and** top-K by score), metrics from script output.
**Done when:** the script prints measured numbers for a fixed seed and the map shows the difference between top-K and optimized picks.

## Phase 4 — API and UI
Endpoints, map, queue, WHY panel, K slider, band legend, mobile-friendly queue.
**Done when:** the whole demo path runs without touching the database by hand.

## Phase 5 — Cedar
Schema, policies, `authorize()` dependency, role switcher in the demo UI, tests.
**Done when:** a viewer gets a 403 on `CreatePlan` and the response names the policy.

## Phase 6 — Polish and video
Freeze features. Record the 3-minute video (script in [DEMO_AND_PITCH.md](DEMO_AND_PITCH.md)), including the AWS/Cedar slide. Retake as needed; there is no live demo.

## Acceptance checklist
- [ ] Fresh checkout runs from documented steps
- [ ] Synthetic records labelled in UI, API, exports
- [ ] Scores reproducible for fixed data and config
- [ ] Missing features handled and visible
- [ ] Explanation matches components
- [ ] Optimizer never exceeds K; no double counting
- [ ] Baselines use the same coverage function; metrics from the script
- [ ] Cedar default-deny works; `IssueAdvisory` denied for all roles
- [ ] Simulated test never shown as verified
- [ ] No screen claims contamination from the model alone
- [ ] No credentials or private data committed
- [ ] Video shows what it does, who it's for, where AWS fits

## Open decisions
Resolve in code and docs:
1. Supported source types in MVP?
2. How is flood exposure assigned to a point or service area?
3. Which drainage features count; proximity transform?
4. Missing-data policy per feature?
5. Display thresholds for bands?
6. Population unit: grid cell, cluster, ward segment, service area?
7. Coverage definition: radius, service area, other?
8. Objective: unique coverage only, or risk-weighted? (freeze one)
9. Effect of a verified result on nearby sources, if any?
10. Role set and who may record field results (Cedar policies)
11. Which Cedar Python package works in your environment?
12. License/attribution for every external layer?

## Suggested seed decisions (editable)
| # | Default |
| --- | --- |
| 1 | well, public_tap, storage_point |
| 4 | neutral 0.5 + confidence penalty |
| 6 | clustered population points |
| 7 | 500 m radius in projected CRS |
| 8 | unique high-risk population coverage |
| 10 | viewer / operator / field_recorder / admin |
