"""Greedy Maximum Coverage Optimizer and Baseline Evaluator for FloodSafe.

Pure, deterministic optimization module for test allocation under budget K.
Optimized using vectorized NumPy distance matrices and greedy marginal gain indexing.

Algorithmic Design:
    - Precomputation: Vectorized O(N * M) Haversine distance matrix.
    - Optimization: Greedy forward selection O(K * N) with deterministic tie-breaking.
    - Baseline: Monte Carlo simulation O(T * K) across 1,000 randomized trials.
"""
from __future__ import annotations
import time
from typing import Any, Dict, List, Optional, Set, Tuple, Union
import numpy as np
from backend.app.geo_utils import (
    haversine_distance_m,
    haversine_distance_matrix_vectorized,
)
from backend.app.models import (
    BaselineStats,
    PlanMetrics,
    PopulationUnit,
    RiskBand,
    ScoredSource,
    SelectedSite,
    TestingPlan,
    WaterSource,
)


def precompute_coverage(
    sources: List[WaterSource] | List[ScoredSource],
    pop_units: List[PopulationUnit],
    radius_m: float = 500.0,
    only_high_risk: bool = True,
) -> Tuple[Dict[str, Set[str]], Dict[str, int]]:
    """Precomputes the set of covered population unit IDs for each source within radius_m.

    Uses vectorized NumPy distance matrix broadcasting for fast O(N * M) computation.

    Args:
        sources: List of water source instances (either WaterSource or ScoredSource).
        pop_units: List of all population units in the disaster zone.
        radius_m: Spatial radius threshold in meters (default 500.0m).
        only_high_risk: If True, restricts coverage tracking to units tagged is_high_risk.

    Returns:
        Tuple containing:
            - coverage: Map of source_id -> Set of covered population unit IDs.
            - unit_pop: Map of unit_id -> population count.

    Time Complexity:
        O(N * M) vectorized across SIMD arrays.
    Space Complexity:
        O(N * M)
    """
    # Filter population units if restricted to high-risk
    units = [u for u in pop_units if (not only_high_risk or u.is_high_risk)]
    unit_pop: Dict[str, int] = {u.id: u.population for u in units}

    if not sources or not units:
        return {getattr(s, "source_id", None) or getattr(s, "id", ""): set() for s in sources}, unit_pop

    source_ids = [getattr(s, "source_id", None) or getattr(s, "id", "") for s in sources]
    s_lats = np.array([s.latitude for s in sources], dtype=np.float64)
    s_lons = np.array([s.longitude for s in sources], dtype=np.float64)
    u_lats = np.array([u.latitude for u in units], dtype=np.float64)
    u_lons = np.array([u.longitude for u in units], dtype=np.float64)

    # Compute (N, M) distance matrix in a single vectorized NumPy operation
    dist_matrix = haversine_distance_matrix_vectorized(s_lats, s_lons, u_lats, u_lons)
    within_radius_mask = dist_matrix <= radius_m  # Boolean (N, M) matrix

    unit_ids_array = np.array([u.id for u in units])
    coverage: Dict[str, Set[str]] = {}

    for i, s_id in enumerate(source_ids):
        covered_indices = within_radius_mask[i]
        coverage[s_id] = set(unit_ids_array[covered_indices].tolist())

    return coverage, unit_pop


def greedy_max_coverage(
    coverage: Dict[str, Set[str]],
    unit_pop: Dict[str, int],
    k: int,
    scores: Optional[Dict[str, float]] = None,
    source_codes: Optional[Dict[str, str]] = None,
) -> Tuple[List[str], Set[str], int, List[Dict[str, Any]]]:
    """Executes Greedy Maximum Unique Coverage under capacity constraint K.

    Guarantees strict (1 - 1/e) ~ 63.2% approximation ratio to NP-hard optimal coverage.

    Deterministic Tie-breaking Hierarchy:
        1. Marginal unique population gain (descending)
        2. Relative vulnerability score (descending)
        3. Source code string (ascending alphanumeric)

    Args:
        coverage: Map of source_id -> Set of covered population unit IDs.
        unit_pop: Map of unit_id -> population count.
        k: Maximum test allocation budget (capacity K).
        scores: Optional map of source_id -> relative vulnerability score.
        source_codes: Optional map of source_id -> human-readable source code.

    Returns:
        Tuple containing:
            - selected: List of chosen source IDs in selection sequence.
            - covered_units: Set of all unique population unit IDs covered.
            - total_covered_pop: Total unique population covered without double-counting.
            - steps: Chronological list of allocation steps with marginal gains.

    Time Complexity:
        O(K * N) where N is number of candidate sources.
    Space Complexity:
        O(N + M)
    """
    if k <= 0 or not coverage or not unit_pop:
        return [], set(), 0, []

    scores = scores or {}
    source_codes = source_codes or {}

    selected: List[str] = []
    covered_units: Set[str] = set()
    steps: List[Dict[str, Any]] = []
    candidates = set(coverage.keys())

    for order in range(1, k + 1):
        best_id: Optional[str] = None
        best_gain: int = -1
        best_new_units: Set[str] = set()
        best_score: float = -1.0
        best_code: str = "ZZZZ"

        # Deterministic candidate evaluation
        for s_id in sorted(candidates):
            new_units = coverage[s_id] - covered_units
            gain = sum(unit_pop.get(u, 0) for u in new_units)
            src_score = scores.get(s_id, 0.0)
            src_code = source_codes.get(s_id, s_id)

            is_better = False
            if gain > best_gain:
                is_better = True
            elif gain == best_gain:
                if src_score > best_score:
                    is_better = True
                elif src_score == best_score:
                    if src_code < best_code:
                        is_better = True

            if is_better:
                best_id = s_id
                best_gain = gain
                best_new_units = new_units
                best_score = src_score
                best_code = src_code

        # If no remaining candidate offers marginal coverage gain, terminate early
        if best_id is None or best_gain <= 0:
            break

        selected.append(best_id)
        covered_units.update(best_new_units)
        candidates.remove(best_id)

        steps.append({
            "order": order,
            "source_id": best_id,
            "source_code": best_code,
            "marginal_coverage": best_gain,
            "cumulative_coverage": sum(unit_pop.get(u, 0) for u in covered_units),
            "new_units": sorted(best_new_units),
        })

    total_covered_pop = sum(unit_pop.get(u, 0) for u in covered_units)
    return selected, covered_units, total_covered_pop, steps


def calculate_coverage_for_set(
    selected_ids: Union[List[str], Set[str]],
    coverage: Dict[str, Set[str]],
    unit_pop: Dict[str, int],
) -> int:
    """Calculates total unique population covered by an arbitrary set of source IDs.

    Args:
        selected_ids: Collection of source IDs to evaluate.
        coverage: Map of source_id -> Set of covered unit IDs.
        unit_pop: Map of unit_id -> population count.

    Returns:
        int: Unique non-overlapping population covered.
    """
    covered: Set[str] = set()
    for s_id in selected_ids:
        if s_id in coverage:
            covered.update(coverage[s_id])
    return sum(unit_pop.get(u, 0) for u in covered)


def evaluate_baselines(
    coverage: Dict[str, Set[str]],
    unit_pop: Dict[str, int],
    k: int,
    optimizer_pop: int,
    scores: Dict[str, float],
    source_codes: Dict[str, str],
    trials: int = 1000,
    seed: int = 42,
) -> BaselineStats:
    """Evaluates optimizer against Monte Carlo random baseline and naive score ranking.

    Args:
        coverage: Map of source_id -> Set of covered unit IDs.
        unit_pop: Map of unit_id -> population count.
        k: Testing budget capacity.
        optimizer_pop: Population achieved by greedy optimizer.
        scores: Map of source_id -> vulnerability score.
        source_codes: Map of source_id -> code.
        trials: Number of Monte Carlo iterations (default 1,000).
        seed: Random seed for exact reproducibility.

    Returns:
        BaselineStats: Comprehensive statistical comparison.
    """
    all_candidate_ids = np.array(sorted(coverage.keys()))
    n_candidates = len(all_candidate_ids)
    actual_k = min(k, n_candidates)

    rng = np.random.default_rng(seed)
    random_totals = np.zeros(trials, dtype=np.int64)

    for i in range(trials):
        choice = rng.choice(all_candidate_ids, size=actual_k, replace=False)
        random_totals[i] = calculate_coverage_for_set(choice, coverage, unit_pop)

    # Top-K by score baseline
    sorted_by_score = sorted(
        coverage.keys(),
        key=lambda s_id: (scores.get(s_id, 0.0), -1.0 if source_codes.get(s_id, "") == "" else 0.0),
        reverse=True,
    )
    top_k_ids = sorted_by_score[:actual_k]
    top_k_pop = calculate_coverage_for_set(top_k_ids, coverage, unit_pop)

    mean_rand = float(np.mean(random_totals))
    median_rand = float(np.median(random_totals))
    p5_rand = float(np.percentile(random_totals, 5))
    p95_rand = float(np.percentile(random_totals, 95))

    gain_over_random = (
        ((optimizer_pop - mean_rand) / mean_rand * 100.0) if mean_rand > 0 else 0.0
    )
    gain_over_top_k = (
        ((optimizer_pop - top_k_pop) / top_k_pop * 100.0) if top_k_pop > 0 else 0.0
    )

    return BaselineStats(
        trials=trials,
        seed=seed,
        mean=round(mean_rand, 1),
        median=round(median_rand, 1),
        p5=round(p5_rand, 1),
        p95=round(p95_rand, 1),
        optimizer=optimizer_pop,
        top_k_score=top_k_pop,
        gain_over_random_mean=round(gain_over_random, 2),
        gain_over_top_k=round(gain_over_top_k, 2),
    )


def generate_testing_plan(
    event_id: str,
    assessment_run_id: str,
    scored_sources: Dict[str, ScoredSource],
    pop_units: List[PopulationUnit],
    capacity_k: int = 15,
    coverage_radius_m: float = 500.0,
    objective: str = "max_unique_high_risk_population",
    seed: int = 42,
    include_baseline: bool = True,
    baseline_trials: int = 1000,
) -> TestingPlan:
    """Generates an end-to-end testing plan with execution metrics and baseline evaluation.

    Args:
        event_id: Unique identifier for flood event.
        assessment_run_id: Unique identifier for vulnerability scoring assessment.
        scored_sources: Map of source_id -> ScoredSource models.
        pop_units: List of PopulationUnit models.
        capacity_k: Testing kit budget capacity (default 15).
        coverage_radius_m: Spatial coverage buffer in meters (default 500.0m).
        objective: Optimization objective function description.
        seed: Random seed for baseline evaluation.
        include_baseline: If True, computes Monte Carlo and Top-K comparisons.
        baseline_trials: Number of Monte Carlo iterations.

    Returns:
        TestingPlan: Complete validated allocation plan with metrics and baseline stats.
    """
    t0 = time.perf_counter()

    sources_list = list(scored_sources.values())
    coverage, unit_pop = precompute_coverage(
        sources=sources_list,
        pop_units=pop_units,
        radius_m=coverage_radius_m,
        only_high_risk=True,
    )

    scores = {s.source_id: s.relative_vulnerability_score for s in sources_list}
    source_codes = {s.source_id: s.source_code for s in sources_list}

    selected_ids, covered_units, total_pop, steps = greedy_max_coverage(
        coverage=coverage,
        unit_pop=unit_pop,
        k=capacity_k,
        scores=scores,
        source_codes=source_codes,
    )

    t1 = time.perf_counter()
    runtime_ms = round((t1 - t0) * 1000.0, 2)

    total_high_risk_pop = sum(unit_pop.values())
    pct_covered = (
        round((total_pop / total_high_risk_pop) * 100.0, 2)
        if total_high_risk_pop > 0
        else 0.0
    )
    covered_per_test = (
        round(total_pop / len(selected_ids), 1) if selected_ids else 0.0
    )

    sum_individual_coverage = sum(
        sum(unit_pop.get(u, 0) for u in coverage[s_id]) for s_id in selected_ids
    )
    overlap = max(0, sum_individual_coverage - total_pop)

    metrics = PlanMetrics(
        unique_population_covered=total_pop,
        total_high_risk_population=total_high_risk_pop,
        pct_high_risk_covered=pct_covered,
        covered_per_test=covered_per_test,
        overlap=overlap,
        runtime_ms=runtime_ms,
    )

    baseline_stats = None
    if include_baseline and selected_ids:
        baseline_stats = evaluate_baselines(
            coverage=coverage,
            unit_pop=unit_pop,
            k=capacity_k,
            optimizer_pop=total_pop,
            scores=scores,
            source_codes=source_codes,
            trials=baseline_trials,
            seed=seed,
        )

    selected_sites: List[SelectedSite] = []
    for step in steps:
        s_id = step["source_id"]
        scored_src = scored_sources[s_id]
        selected_sites.append(
            SelectedSite(
                order=step["order"],
                source_id=s_id,
                source_code=scored_src.source_code,
                source_type=scored_src.source_type,
                latitude=scored_src.latitude,
                longitude=scored_src.longitude,
                marginal_coverage=step["marginal_coverage"],
                cumulative_coverage=step["cumulative_coverage"],
                relative_vulnerability_score=scored_src.relative_vulnerability_score,
                band=scored_src.band,
                covered_unit_ids=step["new_units"],
            )
        )

    return TestingPlan(
        event_id=event_id,
        assessment_run_id=assessment_run_id,
        capacity_k=capacity_k,
        coverage_definition={"type": "radius", "radius_m": coverage_radius_m},
        objective=objective,
        algorithm_version="greedy-v1",
        data_version="synthetic-v1",
        random_seed=seed,
        selected=selected_sites,
        metrics=metrics,
        baseline=baseline_stats,
        is_synthetic=True,
    )
