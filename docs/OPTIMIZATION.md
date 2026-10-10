# Testing Allocation & Coverage Optimization

## 1. Why ranking alone is insufficient
Top-K by score can pick neighbouring sites that cover the same people. A good plan accounts for **both vulnerability and additional uncovered high-risk population**.

## 2. Algorithm: Greedy Maximum Coverage
**Inputs:** candidate sources + scores · modelled high-risk population units · capacity `K` · coverage radius `R` (or other explicit relation) · rule for when a unit is covered.

**Procedure**
1. Start with no selected sites; covered set = ∅.
2. For each unselected candidate, compute marginal gain = population of **not-yet-covered** high-risk units within the coverage relation.
3. Apply the documented objective (basic: marginal unique population; risk-weighted variants must be defined first).
4. Select the best candidate (deterministic tie-break, e.g. higher score then lower source_code).
5. Add its units to the covered set.
6. Repeat until K sites chosen or max marginal gain is 0.

Greedy gives a (1 − 1/e) ≈ 63% worst-case guarantee for monotone submodular maximum coverage and is easy to explain and test.

## 3. Objective (freeze before evaluation)
```text
maximize   total unique high-risk population covered
subject to |selected| <= K
```
A risk-weighted objective is allowed later only if the exact combination of vulnerability and population is defined up front. **Do not change the objective mid-evaluation to improve displayed results.**

## 4. No double counting
Maintain an explicit set of covered unit IDs. A unit inside several selected radii counts once.

## 5. Reference implementation
```python
def greedy_max_coverage(coverage: dict[str, set[int]],
                        unit_pop: dict[int, int],
                        k: int,
                        tiebreak: dict[str, float] | None = None):
    """coverage: source_id -> set of covered unit ids (precomputed, same CRS rules)."""
    selected, covered, steps = [], set(), []
    candidates = set(coverage)
    for _ in range(k):
        best, best_gain, best_new = None, 0, set()
        for s in sorted(candidates):                       # deterministic order
            new = coverage[s] - covered
            gain = sum(unit_pop[u] for u in new)
            key = (gain, (tiebreak or {}).get(s, 0.0))
            if best is None or key > (best_gain, (tiebreak or {}).get(best, 0.0)):
                best, best_gain, best_new = s, gain, new
        if best is None or best_gain == 0:
            break
        selected.append(best); covered |= best_new; candidates.remove(best)
        steps.append({"source_id": best, "marginal_coverage": best_gain,
                      "units": sorted(best_new)})
    total = sum(unit_pop[u] for u in covered)
    return selected, covered, total, steps
```
Precompute `coverage` once with a spatial index (PostGIS `ST_DWithin` on projected geometry or an STRtree).

## 6. Coverage model caveats
A simple radius is a prototype approximation. Real deployments may need road access, team travel time, source service areas, ward boundaries, test turnaround, and sampleability.

## 7. Baseline comparison
Same candidate pool, same K, same coverage function, same population model.
1. Freeze dataset and config.
2. Run optimizer.
3. Run **≥1,000 random K-site selections** with a recorded seed.
4. Compute coverage with the identical function.
5. Report random mean, median, 5th–95th percentile, optimizer value, and dataset version.
6. Report the **measured** difference; never hardcode a percentage.

```python
rng = np.random.default_rng(seed)
random_totals = [
    covered_pop(rng.choice(ids, size=k, replace=False)) for _ in range(trials)
]
```

### Second baseline: top-K by score
Also compare against simply taking the K highest-scoring sources (same K, same coverage function). Random is an easy bar; top-K shows whether the optimizer adds value beyond ranking.

## 8. Metrics (define each in output)
| Metric | Definition |
| --- | --- |
| Primary: covered per test | unique high-risk population covered / selected tests |
| Total unique covered | sum of unique unit populations |
| % of high-risk population covered | covered / total high-risk population |
| Overlap | sum of per-site coverage − unique covered |
| Runtime | wall-clock for selection |

## 9. Required tests
- Never more than K sites
- All candidates cover identical units → gain only on first pick
- Disjoint coverage → plan equals top-K by unit population
- Overlap not double-counted
- K > candidates, K = 0, empty population
- Deterministic tie-breaking
- Baseline uses same coverage function and seed reproduces output

## 10. Limitation
Output quality depends on the population model, inventory, features, and coverage assumptions. Higher modelled coverage ≠ reduced disease. That needs field validation.

## 11. Field-feedback update rule
Document explicitly how a verified/simulated abnormal result changes nearby priorities (for example a bounded, documented uplift on neighbours within a stated hydrological relation). **Do not assume contamination spreads uniformly by distance**, and do not display neighbours as contaminated.
