"""Greedy Maximum Coverage Optimizer and Baseline Evaluator for FloodSafe.

Pure, deterministic optimization module for test allocation under budget K.
Zero DB sessions, zero request objects.
"""
from __future__ import annotations
import time
from typing import Any, Dict, List, Optional, Set, Tuple
import numpy as np
from backend.app.geo_utils import haversine_distance_m
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
    """
    Precomputes the set of covered population unit IDs for each source within radius_m.
    Returns:
        coverage: source_id -> Set[unit_id]
        unit_pop: unit_id -> population_count
    """
    # Filter units if requested
    units = [u for u in pop_units if (not only_high_risk or u.is_high_risk)]
    unit_pop = {u.id: u.population for u in units}

    coverage: Dict[str, Set[str]] = {}

    for s in sources:
        s_id = getattr(s, "source_id", None) or getattr(s, "id", "")
        s_lat = s.latitude
        s_lon = s.longitude
        covered_set: Set[str] = set()

        for u in units:
            dist = haversine_distance_m(s_lat, s_lon, u.latitude, u.longitude)
            if dist <= radius_m:
                covered_set.add(u.id)

        coverage[s_id] = covered_set

    return coverage, unit_pop


def greedy_max_coverage(
    coverage: Dict[str, Set[str]],
    unit_pop: Dict[str, int],
    k: int,
    scores: Dict[str, float] | None = None,
    source_codes: Dict[str, str] | None = None,
) -> Tuple[List[str], Set[str], int, List[Dict[str, Any]]]:
    """
    Executes greedy maximum unique coverage.

    Tie-breaking hierarchy:
    1. Marginal unique population gain (descending)
    2. Vulnerability risk score (descending)
    3. Source code string (ascending)
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

        # Deterministic candidate traversal
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

        if best_id is None or best_gain <= 0:
            # No further positive marginal gains available
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
    selected_ids: List[str] | Set[str],
    coverage: Dict[str, Set[str]],
    unit_pop: Dict[str, int],
) -> int:
    """Calculates total unique population covered by a given set of source IDs."""
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
    """
    Benchmarks optimizer against:
    1. 1,000-trial Monte Carlo random K-selection
    2. Top-K by score ranking
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
    """End-to-end plan generation with timing metrics and baseline benchmarks."""
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

    # Baseline comparison
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

    # Build selected site models
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
