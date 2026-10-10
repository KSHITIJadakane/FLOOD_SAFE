#!/usr/bin/env python3
"""CLI script to generate, inspect, and export synthetic dataset for FloodSafe."""
import json
import sys
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from backend.app.data_generator import generate_synthetic_dataset


def main():
    seed = 42
    print(f"[FloodSafe] Generating synthetic dataset with seed={seed}...")
    event, sources, pop_units = generate_synthetic_dataset(seed=seed, num_sources=500, num_pop_units=500)

    print(f"[+] Created Flood Event: {event.name} (id={event.id})")
    print(f"[+] Generated {len(sources)} water sources")
    print(f"[+] Generated {len(pop_units)} population units")

    # Sample statistics
    type_counts = {}
    for s in sources:
        type_counts[s.source_type.value] = type_counts.get(s.source_type.value, 0) + 1
    print("  Source type breakdown:", type_counts)

    missing_history = sum(1 for s in sources if s.historical_risk is None)
    missing_drain = sum(1 for s in sources if s.drain_distance_m is None)
    print(f"  Missing historical risk: {missing_history}/{len(sources)} ({missing_history/len(sources)*100:.1f}%)")
    print(f"  Missing drain distance: {missing_drain}/{len(sources)} ({missing_drain/len(sources)*100:.1f}%)")

    high_risk_pop = sum(p.population for p in pop_units if p.is_high_risk)
    total_pop = sum(p.population for p in pop_units)
    print(f"  Total population modelled: {total_pop:,} | High-risk subset: {high_risk_pop:,} ({high_risk_pop/total_pop*100:.1f}%)")

    out_dir = root_dir / "data" / "synthetic"
    out_dir.mkdir(parents=True, exist_ok=True)

    with open(out_dir / "flood_event.json", "w", encoding="utf-8") as f:
        json.dump(event.model_dump(mode="json"), f, indent=2)
    with open(out_dir / "water_sources.json", "w", encoding="utf-8") as f:
        json.dump([s.model_dump(mode="json") for s in sources], f, indent=2)
    with open(out_dir / "population_units.json", "w", encoding="utf-8") as f:
        json.dump([p.model_dump(mode="json") for p in pop_units], f, indent=2)

    print(f"[+] Exported dataset to {out_dir}")


if __name__ == "__main__":
    main()
