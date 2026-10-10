"""Geographic and spatial calculation utilities for FloodSafe.

Provides optimized geodesic calculations, spatial containment checks,
and hydrological propagation modeling for post-flood decision support.
"""
from __future__ import annotations
import math
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
from shapely.geometry import Point, shape, Polygon, MultiPolygon

EARTH_RADIUS_M: float = 6371000.0


def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes the great-circle distance in meters between two coordinates using Haversine formula.

    Args:
        lat1 (float): Latitude of origin in decimal degrees.
        lon1 (float): Longitude of origin in decimal degrees.
        lat2 (float): Latitude of destination in decimal degrees.
        lon2 (float): Longitude of destination in decimal degrees.

    Returns:
        float: Geodesic distance in meters.

    Time Complexity:
        O(1)
    Space Complexity:
        O(1)
    """
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


def haversine_distance_matrix_vectorized(
    lats_sources: np.ndarray,
    lons_sources: np.ndarray,
    lats_targets: np.ndarray,
    lons_targets: np.ndarray,
) -> np.ndarray:
    """Vectorized pairwise geodesic distance matrix calculation using NumPy broadcasting.

    Computes an (N x M) distance matrix between N water sources and M population units
    in a single vectorized BLAS-accelerated pass.

    Args:
        lats_sources (np.ndarray): 1D array of shape (N,) containing source latitudes.
        lons_sources (np.ndarray): 1D array of shape (N,) containing source longitudes.
        lats_targets (np.ndarray): 1D array of shape (M,) containing target latitudes.
        lons_targets (np.ndarray): 1D array of shape (M,) containing target longitudes.

    Returns:
        np.ndarray: 2D array of shape (N, M) with distances in meters.

    Time Complexity:
        O(N * M) SIMD vectorized execution.
    Space Complexity:
        O(N * M)
    """
    phi1 = np.radians(lats_sources)[:, np.newaxis]  # (N, 1)
    phi2 = np.radians(lats_targets)[np.newaxis, :]  # (1, M)
    dphi = np.radians(lats_targets[np.newaxis, :] - lats_sources[:, np.newaxis])
    dlambda = np.radians(lons_targets[np.newaxis, :] - lons_sources[:, np.newaxis])

    a = (
        np.sin(dphi / 2.0) ** 2
        + np.cos(phi1) * np.cos(phi2) * (np.sin(dlambda / 2.0) ** 2)
    )
    c = 2.0 * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a))
    return EARTH_RADIUS_M * c


def point_in_polygon(lat: float, lon: float, geojson_geom: Dict[str, Any]) -> bool:
    """Evaluates whether a geographical point falls within a GeoJSON polygon boundary.

    Args:
        lat (float): Point latitude.
        lon (float): Point longitude.
        geojson_geom (Dict[str, Any]): GeoJSON geometry dictionary.

    Returns:
        bool: True if point is contained or intersects polygon, False otherwise.
    """
    try:
        geom = shape(geojson_geom)
        pt = Point(lon, lat)  # shapely uses (x=longitude, y=latitude)
        return bool(geom.contains(pt) or geom.intersects(pt))
    except Exception:
        return False


def compute_drain_proximity_risk(
    distance_m: Optional[float], max_distance_m: float = 1000.0
) -> Optional[float]:
    """Transforms geodesic distance to drainage channel into a bounded normalized risk indicator.

    Closer to drainage corridor -> higher vulnerability.
    Formula: 1.0 - clip(d / max_distance, 0.0, 1.0)

    Args:
        distance_m (Optional[float]): Distance to drainage in meters.
        max_distance_m (float): Distance threshold where risk drops to zero.

    Returns:
        Optional[float]: Normalized risk score in range [0.0, 1.0], or None if missing.
    """
    if distance_m is None:
        return None
    clipped = min(max(distance_m / max_distance_m, 0.0), 1.0)
    return 1.0 - clipped


def compute_spatial_contamination_propagation(
    target_lat: float,
    target_lon: float,
    target_drain_dist_m: Optional[float],
    abnormal_sources: List[Dict[str, Any]],
    max_distance_m: float = 1200.0,
    sigma_m: float = 400.0,
    base_uplift: float = 0.15,
) -> Tuple[float, List[Dict[str, Any]]]:
    """Computes graph-aware hydrological risk propagation from abnormal field test sites.

    Propagates risk via exponential distance decay, hydrological gradient direction,
    and multi-source compound superposition:
    1. Distance decay: U_i = base_uplift * exp(-d / sigma_m)
    2. Hydrological gradient: 1.35x downstream, 0.85x upstream
    3. Multi-source superposition: U_total = 1 - product(1 - U_i)

    Args:
        target_lat (float): Latitude of target water source.
        target_lon (float): Longitude of target water source.
        target_drain_dist_m (Optional[float]): Drainage proximity distance of target.
        abnormal_sources (List[Dict[str, Any]]): List of recorded abnormal test sites.
        max_distance_m (float): Spatial propagation cutoff horizon.
        sigma_m (float): Gaussian dispersion decay parameter.
        base_uplift (float): Initial baseline uplift constant.

    Returns:
        Tuple[float, List[Dict[str, Any]]]: Bounded total uplift [0.0, 0.35] and source contributions.
    """
    if not abnormal_sources:
        return 0.0, []

    contributions: List[Dict[str, Any]] = []
    retention_product = 1.0

    for ab in abnormal_sources:
        ab_id = ab.get("id") or ab.get("source_id")
        ab_code = ab.get("source_code", "UNKNOWN")
        ab_lat = float(ab.get("latitude", 0.0))
        ab_lon = float(ab.get("longitude", 0.0))
        ab_drain_dist = ab.get("drain_distance_m")

        dist = haversine_distance_m(target_lat, target_lon, ab_lat, ab_lon)
        if dist > max_distance_m:
            continue

        # Gaussian distance decay
        decay_factor = math.exp(-dist / sigma_m)
        uplift_i = base_uplift * decay_factor

        # Directional hydrological gradient multiplier
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
    # Enforce safe upper bound on neighbor propagation
    total_uplift = min(total_uplift, 0.35)

    return total_uplift, contributions


def compute_source_vulnerability_score(
    source_type: str,
    protection_level: str = "standard"
) -> float:
    """Computes rule-based baseline vulnerability from physical source infrastructure.

    Args:
        source_type (str): Type of water source (e.g. well, public_tap, storage_point).
        protection_level (str): Enclosure quality ('good', 'standard', 'poor').

    Returns:
        float: Bounded baseline vulnerability score in [0.0, 1.0].
    """
    base_scores: Dict[str, float] = {
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
