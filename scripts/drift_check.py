#!/usr/bin/env python3
"""Automated Spec Drift & Integrity Verification Script for FloodSafe."""
import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from backend.app.data_generator import generate_synthetic_dataset
from backend.app.risk_engine import score_all_sources
from backend.app.optimizer import generate_testing_plan
from backend.app.config import load_risk_config
from backend.app.auth import authorize
from fastapi import HTTPException


def run_drift_check():
    print("=" * 70)
    print(" FloodSafe — Automated Spec Drift & Integrity Verification")
    print("=" * 70)

    checks_passed = 0
    total_checks = 10

    # 1. Check Non-Negotiable: Synthetic demo data labels
    print("\n[Check 1/10] Verifying synthetic labelling across all generated entities...")
    event, sources, pop_units = generate_synthetic_dataset(seed=42, num_sources=100, num_pop_units=100)
    assert event.is_synthetic is True
    assert all(s.is_synthetic for s in sources)
    assert all(p.is_synthetic for p in pop_units)
    print("  [PASS] All entities prominently tagged with is_synthetic=True.")
    checks_passed += 1

    # 2. Check Non-Negotiable: No silent zeroes (neutral imputation 0.5)
    print("\n[Check 2/10] Verifying missing data neutral imputation (0.5) and quality penalty...")
    cfg = load_risk_config()
    scored = score_all_sources(sources, cfg)
    missing_items = [s for s in scored.values() if len(s.missing_features) > 0]
    assert len(missing_items) > 0
    for m in missing_items:
        assert m.quality_score < 1.0
        for feat in m.missing_features:
            assert m.feature_contributions[feat] == round(cfg.weights[feat] * 0.5, 4)
    print(f"  [PASS] {len(missing_items)} sources with missing data correctly imputed at 0.5 with quality penalty.")
    checks_passed += 1

    # 3. Check Non-Negotiable: Contribution sums strictly equal total score
    print("\n[Check 3/10] Verifying exact contribution sum equality across all scored sources...")
    for s in scored.values():
        contrib_sum = round(sum(s.feature_contributions.values()), 4)
        assert abs(contrib_sum - s.relative_vulnerability_score) < 1e-4
    print(f"  [PASS] 100% of {len(scored)} sources have contributions matching total score exactly.")
    checks_passed += 1

    # 4. Check Non-Negotiable: Never claim contamination in explanations
    print("\n[Check 4/10] Verifying safety disclaimers and absence of contamination claims...")
    for s in scored.values():
        assert "not evidence of water contamination" in s.explanation
        assert "not a contamination diagnosis" in s.disclaimer
    print("  [PASS] All plain-language explanations contain statutory non-contamination disclaimers.")
    checks_passed += 1

    # 5. Check Non-Negotiable: Optimizer never exceeds K
    print("\n[Check 5/10] Verifying optimizer strictly respects testing capacity K...")
    plan = generate_testing_plan(event.id, "drift-run", scored, pop_units, capacity_k=12, seed=42)
    assert len(plan.selected) <= 12
    print(f"  [PASS] Optimizer selected exactly {len(plan.selected)} sites (<= 12).")
    checks_passed += 1

    # 6. Check Non-Negotiable: Strict no double-counting
    print("\n[Check 6/10] Verifying strict unique population tracking without double counting...")
    all_units_set = set()
    for s in plan.selected:
        all_units_set.update(s.covered_unit_ids)
    sum_marginal = sum(s.marginal_coverage for s in plan.selected)
    assert sum_marginal == plan.metrics.unique_population_covered
    print(f"  [PASS] Sum of marginal gains ({sum_marginal:,}) matches total unique covered pop exactly.")
    checks_passed += 1

    # 7. Check Non-Negotiable: Dual baseline comparison
    print("\n[Check 7/10] Verifying baseline benchmarking against Top-K score ranking and 1,000 random trials...")
    assert plan.baseline is not None
    assert plan.baseline.trials == 1000
    assert plan.baseline.optimizer >= plan.baseline.mean
    assert plan.baseline.optimizer >= plan.baseline.top_k_score
    print(f"  [PASS] Optimizer outperforms Random Mean (+{plan.baseline.gain_over_random_mean:.1f}%) and Top-K (+{plan.baseline.gain_over_top_k:.1f}%).")
    checks_passed += 1

    # 8. Check Non-Negotiable: Cedar default-deny
    print("\n[Check 8/10] Verifying Cedar default-deny authorization...")
    try:
        authorize("unknown-user", ["anonymous"], "ViewQueue", 'FloodSafe::FloodEvent::"default"')
        assert False, "Should have been denied"
    except HTTPException as e:
        assert e.status_code == 403
    print("  [PASS] Unauthenticated/unrecognized roles rejected with 403 FORBIDDEN.")
    checks_passed += 1

    # 9. Check Non-Negotiable: Cedar Forbid Rule (IssueAdvisory)
    print("\n[Check 9/10] Verifying Cedar IssueAdvisory forbid boundary across all roles...")
    for r in ["viewer", "operator", "field_recorder", "admin"]:
        try:
            authorize(f"demo-{r}", [r], "IssueAdvisory", 'FloodSafe::FloodEvent::"default"')
            assert False, f"IssueAdvisory should have been denied for {r}"
        except HTTPException as e:
            assert e.status_code == 403
    print("  [PASS] IssueAdvisory strictly forbidden for all roles including admin.")
    checks_passed += 1

    # 10. Check Non-Negotiable: Verified field tests restricted to Admin
    print("\n[Check 10/10] Verifying Cedar verified-admin-only forbid boundary...")
    try:
        authorize("demo-field", ["field_recorder"], "RecordFieldTest", 'FloodSafe::Source::"SYN-001"', {"verification_status": "verified"})
        assert False, "Verified result should be denied for field_recorder"
    except HTTPException as e:
        assert e.status_code == 403

    # Admin should succeed
    authorize("demo-admin", ["admin"], "RecordFieldTest", 'FloodSafe::Source::"SYN-001"', {"verification_status": "verified"})
    print("  [PASS] Verified field test allowed for admin, denied for field_recorder.")
    checks_passed += 1

    print("\n" + "=" * 70)
    print(f" DRIFT CHECK SUMMARY: {checks_passed}/{total_checks} CHECKS PASSED (100% SPEC COMPLIANT)")
    print("=" * 70)


if __name__ == "__main__":
    run_drift_check()
