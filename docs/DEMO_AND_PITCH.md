# Demo Script & Pitch

## 3-minute demo
| Time | Step | Say / show |
| --- | --- | --- |
| 0:00–0:20 | Decision gap | "After a flood, teams may have hundreds of water sources to check but limited tests. FloodSafe helps decide which to verify first." |
| 0:20–0:50 | Map | Simulated flood layer, synthetic sources, relative priorities; state clearly it's synthetic |
| 0:50–1:30 | Constrained allocation | Set K (e.g., 15), run optimizer, show selected sites and unique modelled coverage; show **actual** random-baseline output |
| 1:30–2:00 | Explain one source | Open WHY panel: real components, input quality; "guides verification, doesn't diagnose contamination" |
| 2:00–2:30 | Field feedback | Record **simulated** abnormal result; re-run; show queue change per documented rule |
| 2:30–3:00 | AWS + pathway | Switch to the viewer role, show the Cedar 403 and denying policy; one slide: Cedar (AWS open-source) for authorization, SAM CLI/LocalStack if built; validation path with authorized teams |

**Closing line:** "FloodSafe doesn't replace water testing. It makes every test count."

## Pitch balance
- 30% problem and operational constraint
- 50% working demonstration
- 20% architecture and real-world pathway

Do not claim reduced illness, confirmed contamination, or proven field impact. The prototype proves the workflow and algorithm can be demonstrated.

## Pre-demo checklist
- [ ] Frozen dataset + seed; evaluation script run beforehand
- [ ] Synthetic banner visible on every screen
- [ ] Fallback screenshots / recording ready
- [ ] No hardcoded percentages anywhere
- [ ] Local stack starts in one command
- [ ] Offline basemap fallback or cached tiles

## Likely judge questions
| Question | Answer |
| --- | --- |
| Is it real data? | No — synthetic; real validation pathway is documented |
| Why not ML? | No labelled data; transparent weights are auditable and configurable |
| Why greedy? | Explainable, testable, (1−1/e) guarantee for max coverage |
| Does it detect contamination? | No — it prioritizes where to test |
| What if weights are wrong? | Configurable; sensitivity analysis reported; expert calibration required |
| Who decides? | Authorized public-health staff; the system recommends |
