"""Unit tests for Phase 3 — Greedy Maximum Coverage Optimizer and Baseline Evaluator."""
from __future__ import annotations
import pytest
from backend.app.optimizer import (
    greedy_max_coverage,
    precompute_coverage,
    calculate_coverage_for_set,
    evaluate_baselines,
    generate_testing_plan,
)
from backend.app.models import PopulationUnit, SourceType, WaterSource
from backend.app.risk_engine import score_all_sources
from backend.app.config import load_risk_config
from backend.app.data_generator import generate_synthetic_dataset


def test_greedy_never_exceeds_k():
    coverage = {
        "S1": {"U1", "U2"},
        "S2": {"U3", "U4"},
        "S3": {"U5", "U6"},
        "S4": {"U7"},
    }
    unit_pop = {f"U{i}": 100 for i in range(1, 8)}

    for k in [1, 2, 3, 5, 10]:
        selected, covered, total, steps = greedy_max_coverage(coverage, unit_pop, k=k)
        assert len(selected) <= k
        assert len(selected) == min(k, len(coverage))
        assert total == sum(unit_pop[u] for u in covered)


def test_identical_units_gain_only_on_first_pick():
    """If all sources cover the exact same population, subsequent picks give 0 marginal gain."""
    coverage = {
        "S1": {"U1", "U2"},
        "S2": {"U1", "U2"},
        "S3": {"U1", "U2"},
    }
    unit_pop = {"U1": 500, "U2": 300}

    selected, covered, total, steps = greedy_max_coverage(coverage, unit_pop, k=3)
    # Only 1 site should be chosen because others have 0 marginal gain
    assert len(selected) == 1
    assert total == 800
    assert len(steps) == 1
    assert steps[0]["marginal_coverage"] == 800


def test_disjoint_coverage_matches_top_by_population():
    """With completely disjoint units, greedy must select in descending order of site population."""
    coverage = {
        "S1": {"U1"},  # pop: 100
        "S2": {"U2"},  # pop: 500
        "S3": {"U3"},  # pop: 300
    }
    unit_pop = {"U1": 100, "U2": 500, "U3": 300}

    selected, covered, total, steps = greedy_max_coverage(coverage, unit_pop, k=2)
    assert selected == ["S2", "S3"]
    assert total == 800


def test_strict_no_double_counting_with_overlap():
    """Overlapping units must only be counted ONCE in total coverage."""
    coverage = {
        "S1": {"U1", "U2"},        # U1=400, U2=600 -> total 1000
        "S2": {"U2", "U3"},        # U2=600, U3=500 -> total 1100
        "S3": {"U1", "U2", "U3"},  # total 1500
    }
    unit_pop = {"U1": 400, "U2": 600, "U3": 500}

    # Step 1: S3 selected (gain=1500, covered={U1,U2,U3})
    # Step 2: S1 and S2 have remaining gain=0 -> stops at 1
    selected, covered, total, steps = greedy_max_coverage(coverage, unit_pop, k=3)
    assert selected == ["S3"]
    assert total == 1500
    assert len(covered) == 3


def test_edge_cases_k_zero_and_empty_population():
    # K = 0
    sel_0, cov_0, tot_0, _ = greedy_max_coverage({"S1": {"U1"}}, {"U1": 100}, k=0)
    assert sel_0 == []
    assert tot_0 == 0

    # Empty coverage
    sel_empty, cov_empty, tot_empty, _ = greedy_max_coverage({}, {}, k=5)
    assert sel_empty == []
    assert tot_empty == 0


def test_deterministic_tie_breaking():
    """Tie-breaking order: gain -> risk_score -> source_code (alphabetical)."""
    coverage = {
        "S_B": {"U1"},
        "S_A": {"U2"},
    }
    unit_pop = {"U1": 200, "U2": 200}
    scores = {"S_B": 0.80, "S_A": 0.90}
    source_codes = {"S_B": "SYN-002", "S_A": "SYN-001"}

    # S_A should win because score 0.90 > 0.80
    selected, _, _, _ = greedy_max_coverage(coverage, unit_pop, k=1, scores=scores, source_codes=source_codes)
    assert selected == ["S_A"]

    # When scores are identical, alphabetical source_code decides
    scores_equal = {"S_B": 0.80, "S_A": 0.80}
    selected_alpha, _, _, _ = greedy_max_coverage(coverage, unit_pop, k=1, scores=scores_equal, source_codes=source_codes)
    assert selected_alpha == ["S_A"]


def test_plan_generation_and_baseline_evaluation():
    """Verify full end-to-end plan generation and baseline reproducibility."""
    event, sources, pop_units = generate_synthetic_dataset(seed=42, num_sources=100, num_pop_units=100)
    cfg = load_risk_config()
    scored = score_all_sources(sources, cfg)

    plan = generate_testing_plan(
        event_id=event.id,
        assessment_run_id="test-run",
        scored_sources=scored,
        pop_units=pop_units,
        capacity_k=10,
        coverage_radius_m=500.0,
        seed=42,
        include_baseline=True,
        baseline_trials=100,
    )

    assert plan.capacity_k == 10
    assert len(plan.selected) <= 10
    assert plan.metrics.unique_population_covered > 0
    assert plan.metrics.pct_high_risk_covered > 0.0
    assert plan.is_synthetic is True

    # Baseline stats
    assert plan.baseline is not None
    assert plan.baseline.trials == 100
    assert plan.baseline.seed == 42
    assert plan.baseline.optimizer >= plan.baseline.mean
    assert plan.baseline.optimizer >= plan.baseline.top_k_score
