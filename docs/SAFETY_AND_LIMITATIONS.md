# Safety, Ethics, and Limitations

## 1. No remote contamination diagnosis
FloodSafe estimates relative vulnerability from available indicators. Only field sampling and validated testing can establish the status of a sample.

## 2. Human authority
The system supports authorized personnel. It must not automatically issue public advisories, declare water safe, shut off sources, or trigger treatment.

## 3. Uncertainty visibility
Flood, drainage, population, and infrastructure layers can be incomplete, stale, coarse, or wrong. Show timestamps, missing fields, and uncertainty. Remote sensing cannot establish contamination at an individual tap or well; flood depth, flow paths, and underground infrastructure may be unknown.

## 4. Equity and population estimates
Population data may under-represent informal settlements or temporary populations. Assess whether the objective under-serves vulnerable communities. A low population estimate is not a reason to ignore a potentially unsafe source.

## 5. Privacy and security
Use only necessary data. Apply access control, retention rules, secure transfer/storage. Do not publish sensitive source details or field-worker data without authorization. Never commit secrets or confidential municipal data.

## 6. Wording
**Prefer:** "Higher relative vulnerability priority", "Prioritize for field verification", "Modelled population coverage", "Simulated result", "Data incomplete / confidence limited".
**Avoid:** "The AI detected contaminated water" (without validated test); "This source is safe" (from a low score); "The model prevents disease"; "X% better" unless computed and method disclosed.

## 7. Known limitations
- Weights, thresholds, radius coverage are demo settings.
- Synthetic data cannot validate real-world behavior.
- Min-max normalization is dataset-dependent.
- Greedy is an approximation, not an exact optimum.
- Field-result propagation rules are assumptions.

## 8. Risk register
| Risk | Mitigation |
| --- | --- |
| Synthetic data mistaken for real | persistent labels in UI/API/exports |
| Weak or missing inventory | show missingness and provenance |
| Unvalidated weights | configurable; sensitivity; expert review |
| Double-counted population | unique unit set + tests |
| Poor geographic assumptions | proper CRS, geometry tests |
| Overstated AI capability | "decision support" wording; no remote diagnosis |
| Scope creep | LLM/ML/IoT/cloud optional |
| Cloud cost/failure | local-first; budgets; fallback |
| Unauthorized operational use | human approval; access control; disclaimers |
