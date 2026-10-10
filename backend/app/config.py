"""Configuration loader for FloodSafe."""
from __future__ import annotations
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Tuple
import yaml


@dataclass(frozen=True)
class RiskConfig:
    version: str
    weights: Dict[str, float]
    neutral_value: float = 0.5
    bands: Dict[str, Tuple[float, float]] = field(default_factory=lambda: {
        "low": (0.00, 0.25),
        "moderate": (0.25, 0.50),
        "high": (0.50, 0.75),
        "very_high": (0.75, 1.00),
    })
    optimizer: Dict[str, Any] = field(default_factory=lambda: {
        "coverage_radius_m": 500.0,
        "objective": "max_unique_high_risk_population",
        "baseline_trials": 1000,
    })
    feedback: Dict[str, Any] = field(default_factory=lambda: {
        "neighbor_radius_m": 300.0,
        "abnormal_uplift": 0.10,
    })


def get_project_root() -> Path:
    # Look for config either relative to cwd or backend parent
    candidates = [
        Path.cwd(),
        Path.cwd().parent,
        Path(__file__).resolve().parent.parent.parent,
    ]
    for p in candidates:
        if (p / "config" / "risk_config_v1.yaml").exists():
            return p
    return Path(__file__).resolve().parent.parent.parent


_active_config: RiskConfig | None = None


def set_active_risk_config(cfg: RiskConfig) -> None:
    global _active_config
    _active_config = cfg


def load_risk_config(config_path: Path | str | None = None) -> RiskConfig:
    global _active_config
    if _active_config is not None and config_path is None:
        return _active_config

    if config_path is None:
        root = get_project_root()
        config_path = root / "config" / "risk_config_v1.yaml"
    else:
        config_path = Path(config_path)

    if not config_path.exists():
        # Fallback default configuration
        cfg = RiskConfig(
            version="risk-v1",
            weights={
                "flood_exposure": 0.30,
                "drain_proximity_risk": 0.25,
                "historical_risk": 0.15,
                "source_vulnerability": 0.15,
                "population_exposure": 0.15,
            },
            neutral_value=0.5,
        )
        _active_config = cfg
        return cfg

    with open(config_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}

    version = data.get("config_version", "risk-v1")
    weights = data.get("weights", {
        "flood_exposure": 0.30,
        "drain_proximity_risk": 0.25,
        "historical_risk": 0.15,
        "source_vulnerability": 0.15,
        "population_exposure": 0.15,
    })
    missing_policy = data.get("missing_policy", {})
    neutral_val = float(missing_policy.get("neutral_value", 0.5))

    bands_raw = data.get("bands", {})
    bands = {}
    for b_name, b_range in bands_raw.items():
        if isinstance(b_range, (list, tuple)) and len(b_range) == 2:
            bands[b_name] = (float(b_range[0]), float(b_range[1]))
    if not bands:
        bands = {
            "low": (0.00, 0.25),
            "moderate": (0.25, 0.50),
            "high": (0.50, 0.75),
            "very_high": (0.75, 1.00),
        }

    optimizer = data.get("optimizer", {
        "coverage_radius_m": 500.0,
        "objective": "max_unique_high_risk_population",
        "baseline_trials": 1000,
    })
    feedback = data.get("feedback", {
        "neighbor_radius_m": 300.0,
        "abnormal_uplift": 0.15,
    })

    cfg = RiskConfig(
        version=version,
        weights=weights,
        neutral_value=neutral_val,
        bands=bands,
        optimizer=optimizer,
        feedback=feedback,
    )
    if _active_config is None:
        _active_config = cfg
    return cfg
