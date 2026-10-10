# FloodSafe — Standing Rules & Non-Negotiables

## Source of Truth
- The master specification is in `docs/` (`docs/PROJECT_DESCRIPTION.md`, `docs/IMPLEMENTATION_PHASES.md`, `docs/RISK_ENGINE.md`, `docs/OPTIMIZATION.md`, `docs/API_SPEC.md`, `docs/FRONTEND_DESIGN.md`, `docs/AUTHORIZATION_CEDAR.md`, `docs/DATA_MODEL.md`, `docs/VALIDATION.md`, `docs/ARCHITECTURE.md`).
- Re-read relevant sections before starting any phase or task.

## Non-Negotiables
1. **Never claim contamination**: The risk engine calculates *relative vulnerability priority* for triage, never medical risk or proven contamination.
2. **Transparent explainability**: Every scored source exposes exact component contributions that sum to the total score.
3. **No silent zeroes**: Missing feature values use documented neutral imputation ($0.5$) with visible quality penalty indicators.
4. **Greedy Max Coverage**: Never double-count population across overlapping radii ($R=500\text{m}$). The optimizer must be evaluated against top-K ranking and a 1,000-trial random baseline.
5. **Cedar Authorization**: Strict default-deny. `IssueAdvisory` is forbidden across all roles. Simulated field results are restricted, and verified results are admin-only.
6. **Synthetic Demo Labeling**: Prominently display `"SYNTHETIC DEMO DATA"` banner on all UI views, API responses (`is_synthetic: true`), and exports.
7. **No Cut-List Creep**: Do not build LLM incident briefs, AWS cloud deployment, or S3 ingestion pipelines until Phases 1–7 are complete and verified.
