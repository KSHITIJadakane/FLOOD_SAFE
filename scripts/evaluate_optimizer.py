#!/usr/bin/env python3
"""Standalone CLI benchmark script for FloodSafe Coverage Optimizer.

Runs Greedy Maximum Coverage vs Top-K by Score vs 1,000 Random Trials
and prints measured numbers for a fixed seed.
"""
import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from backend.app.data_generator import generate_synthetic_dataset
from backend.app.risk_engine import score_all_sources
from backend.app.optimizer import generate_testing_plan
from backend.app.config import load_risk_config


def run_benchmark(k: int = 15, seed: int = 42, trials: int = 1000):
    print("=" * 70)
    print(f" FloodSafe Testing-Allocation Optimizer Benchmark (K={k}, Seed={seed})")
    print("=" * 70)

    print("\n1. Generating synthetic dataset...")
    event, sources, pop_units = generate_synthetic_dataset(seed=seed, num_sources=500, num_pop_units=500)
    print(f"   [+] {len(sources)} sources, {len(pop_units)} population units loaded.")

    print("\n2. Scoring candidate vulnerability...")
    cfg = load_risk_config()
    scored = score_all_sources(sources, cfg)
    print(f"   [+] Scored {len(scored)} sources using config {cfg.version}.")

    print(f"\n3. Running Greedy Maximum Coverage optimizer (K={k}, R=500m)...")
    plan = generate_testing_plan(
        event_id=event.id,
        assessment_run_id="bench-run-01",
        scored_sources=scored,
        pop_units=pop_units,
        capacity_k=k,
        coverage_radius_m=500.0,
        seed=seed,
        include_baseline=True,
        baseline_trials=trials,
    )

    print("\n" + "-" * 70)
    print(" OPTIMIZER RESULTS & METRICS")
    print("-" * 70)
    m = plan.metrics
    b = plan.baseline

    print(f" Selected Sites (K={len(plan.selected)}):")
    for s in plan.selected:
        print(f"   #{s.order:02d} | Source: {s.source_code:<8} | Type: {s.source_type.value:<12} | Score: {s.relative_vulnerability_score:.2f} ({s.band.value:<9}) | Marginal Pop Gain: +{s.marginal_coverage:,}")

    print(f"\n Primary Performance Metrics:")
    print(f"   - Unique High-Risk Population Covered: {m.unique_population_covered:,} / {m.total_high_risk_population:,} ({m.pct_high_risk_covered:.1f}%)")
    print(f"   - Covered Population Per Test:         {m.covered_per_test:,.1f} people/test")
    print(f"   - Overlap Avoided (Double Count Diff):  {m.overlap:,} people")
    print(f"   - Algorithm Runtime:                   {m.runtime_ms:.2f} ms")

    print("\n" + "-" * 70)
    print(f" BASELINE COMPARISON ({trials:,} Random Trials + Top-K by Score)")
    print("-" * 70)
    if b:
        print(f" 1. Random Selection Baseline (Trials={b.trials:,}, Seed={b.seed}):")
        print(f"    - Mean Unique Covered:      {b.mean:,.1f}")
        print(f"    - Median:                   {b.median:,.1f}")
        print(f"    - 5th - 95th Percentile:    [{b.p5:,.1f} - {b.p95:,.1f}]")
        print(f"    - Optimizer Advantage:      +{b.gain_over_random_mean:.1f}% higher coverage than random mean")

        print(f"\n 2. Top-K by Risk Score Ranking Baseline:")
        print(f"    - Top-K Unique Covered:     {b.top_k_score:,}")
        print(f"    - Optimizer Advantage:      +{b.gain_over_top_k:.1f}% higher unique coverage than naive ranking")
        print(f"      (Why? Naive ranking clusters overlapping high-risk neighbours; optimizer disperses coverage)")
    print("=" * 70)


if __name__ == "__main__":
    run_benchmark(k=15, seed=42, trials=1000)
