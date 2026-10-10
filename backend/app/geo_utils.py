"""Geographic and spatial calculation utilities for FloodSafe."""
from __future__ import annotations
import math
from typing import Any, Dict, List, Tuple
from shapely.geometry import Point, shape, Polygon, MultiPolygon


EARTH_RADIUS_M = 6371000.0


def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes the great circle distance in meters between two coordinates."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_M * c


def point_in_polygon(lat: float, lon: float, geojson_geom: Dict[str, Any]) -> bool:
    """Checks whether a lat/lon point intersects a GeoJSON geometry."""
    try:
        geom = shape(geojson_geom)
        pt = Point(lon, lat)  # shapely uses (x=lon, y=lat)
        return bool(geom.contains(pt) or geom.intersects(pt))
    except Exception:
        return False


def compute_drain_proximity_risk(distance_m: float | None, max_distance_m: float = 1000.0) -> float | None:
    """
    Transforms distance to drainage into a normalized risk indicator.
    Closer to drain -> higher risk.
    Formula: 1.0 - clip(d / max_distance, 0.0, 1.0)
    """
    if distance_m is None:
        return None
    clipped = min(max(distance_m / max_distance_m, 0.0), 1.0)
    return 1.0 - clipped


def compute_spatial_contamination_propagation(
    target_lat: float,
    target_lon: float,
    target_drain_dist_m: float | None,
    abnormal_sources: List[Dict[str, Any]],
    max_distance_m: float = 1200.0,
    sigma_m: float = 400.0,
    base_uplift: float = 0.15,
) -> Tuple[float, List[Dict[str, Any]]]:
    """
    Computes graph-aware hydrological contamination propagation from abnormal field test sites.
    
    Model:
    1. Distance decay: U_i = base_uplift * exp(-d / sigma_m)
    2. Hydrological gradient: If target is closer to drainage corridor than origin, multiplier = 1.35x
    3. Multi-source compound superposition: U_total = 1 - product(1 - U_i)
    """
    if not abnormal_sources:
        return 0.0, []

    contributions: List[Dict[str, Any]] = []
    retention_product = 1.0

    for ab in abnormal_sources:
        ab_id = ab.get("id") or ab.get("source_id")
        ab_code = ab.get("source_code", "UNKNOWN")
        ab_lat = ab.get("latitude", 0.0)
        ab_lon = ab.get("longitude", 0.0)
        ab_drain_dist = ab.get("drain_distance_m")

        dist = haversine_distance_m(target_lat, target_lon, ab_lat, ab_lon)
        if dist > max_distance_m:
            continue

        # Distance decay
        decay_factor = math.exp(-dist / sigma_m)
        uplift_i = base_uplift * decay_factor

        # Directional hydrological gradient multiplier (downstream drainage vector)
        gradient_multiplier = 1.0
        if target_drain_dist_m is not None and ab_drain_dist is not None:
            if target_drain_dist_m <= ab_drain_dist:
                gradient_multiplier = 1.35  # Downstream toward drainage channel
            else:
                gradient_multiplier = 0.85  # Upstream away from drainage

        effective_uplift = min(uplift_i * gradient_multiplier, 0.25)
        retention_product *= (1.0 - effective_uplift)

        contributions.append({
            "source_id": ab_id,
            "source_code": ab_code,
            "uplift_contribution": round(effective_uplift, 4),
        })

    total_uplift = round(1.0 - retention_product, 4)
    # Cap total maximum spatial uplift at 0.35
    total_uplift = min(total_uplift, 0.35)

    return total_uplift, contributions


def compute_source_vulnerability_score(
    source_type: str,
    protection_level: str = "standard"
) -> float:
    """
    Rule-based baseline vulnerability from source type:
    - well (unprotected / shallow): 0.70
    - public_tap (piped distribution exposed): 0.50
    - storage_point (enclosed tank/reservoir): 0.30
    """
    base_scores = {
        "well": 0.70,
        "public_tap": 0.50,
        "storage_point": 0.30,
        "borewell": 0.50,
        "handpump": 0.65,
        "water_tanker": 0.40,
        "piped_supply": 0.30,
        "sump": 0.55,
    }
    score = base_scores.get(source_type, 0.50)
    if protection_level == "poor":
        score = min(score + 0.15, 1.0)
    elif protection_level == "good":
        score = max(score - 0.15, 0.0)
    return score

