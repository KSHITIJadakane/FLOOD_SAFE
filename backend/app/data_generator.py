"""Deterministic synthetic dataset generator for FloodSafe.

Generates ~500 clustered water sources, flood inundation zones, and high-risk
population units with fixed reproducible random seeds.
"""
from __future__ import annotations
import math
import random
from typing import Any, Dict, List, Tuple
from backend.app.models import (
    FloodEvent,
    WaterSource,
    PopulationUnit,
    SourceType,
    IoTSensorNode,
    IoTSensorType,
    IoTSensorStatus,
)
from backend.app.geo_utils import point_in_polygon, compute_source_vulnerability_score


# Reference center coordinates (Demo River Basin / Urban Flood Zone)
CENTER_LAT = 13.0450
CENTER_LON = 80.2250


def create_synthetic_flood_geometry(center_lat: float = CENTER_LAT, center_lon: float = CENTER_LON) -> Dict[str, Any]:
    """Generates a realistic flood inundation MultiPolygon along a simulated river corridor."""
    # Poly 1: Main river corridor floodplain
    poly1 = [
        [center_lon - 0.05, center_lat - 0.04],
        [center_lon - 0.02, center_lat - 0.02],
        [center_lon + 0.01, center_lat + 0.01],
        [center_lon + 0.04, center_lat + 0.03],
        [center_lon + 0.06, center_lat + 0.05],
        [center_lon + 0.05, center_lat + 0.06],
        [center_lon + 0.02, center_lat + 0.03],
        [center_lon - 0.01, center_lat + 0.01],
        [center_lon - 0.04, center_lat - 0.01],
        [center_lon - 0.06, center_lat - 0.03],
        [center_lon - 0.05, center_lat - 0.04],
    ]

    # Poly 2: Low-lying eastern overflow basin
    poly2 = [
        [center_lon + 0.02, center_lat - 0.02],
        [center_lon + 0.05, center_lat - 0.01],
        [center_lon + 0.06, center_lat - 0.03],
        [center_lon + 0.03, center_lat - 0.04],
        [center_lon + 0.02, center_lat - 0.02],
    ]

    return {
        "type": "MultiPolygon",
        "coordinates": [[poly1], [poly2]],
    }


def generate_synthetic_iot_nodes(
    seed: int = 42,
    center_lat: float = CENTER_LAT,
    center_lon: float = CENTER_LON,
) -> List[IoTSensorNode]:
    """Generates synthetic in-situ IoT telemetry sensor stations across municipal wards."""
    ward_configs = [
        {
            "ward_id": "Ward-1-NorthReach",
            "name": "North Reach River Station",
            "lat": center_lat + 0.032,
            "lon": center_lon + 0.021,
            "sensor_type": IoTSensorType.WATER_LEVEL_ULTRASONIC,
            "level": 0.65,
            "alert_thresh": 0.35,
            "flood_thresh": 0.80,
            "rise": 0.18,
            "status": IoTSensorStatus.ALERT,
        },
        {
            "ward_id": "Ward-1-NorthReach",
            "name": "North Canal Spillway Gauge",
            "lat": center_lat + 0.028,
            "lon": center_lon + 0.018,
            "sensor_type": IoTSensorType.DRAIN_OVERFLOW_GAUGE,
            "level": 0.42,
            "alert_thresh": 0.30,
            "flood_thresh": 0.70,
            "rise": 0.12,
            "status": IoTSensorStatus.ALERT,
        },
        {
            "ward_id": "Ward-2-CentralBasin",
            "name": "Central Basin Primary Hydrometric",
            "lat": center_lat + 0.002,
            "lon": center_lon + 0.001,
            "sensor_type": IoTSensorType.WATER_LEVEL_ULTRASONIC,
            "level": 1.28,
            "alert_thresh": 0.35,
            "flood_thresh": 0.80,
            "rise": 0.45,
            "status": IoTSensorStatus.FLOODED,
        },
        {
            "ward_id": "Ward-2-CentralBasin",
            "name": "Central Storm Drain Outfall Node",
            "lat": center_lat - 0.005,
            "lon": center_lon - 0.004,
            "sensor_type": IoTSensorType.DRAIN_OVERFLOW_GAUGE,
            "level": 1.15,
            "alert_thresh": 0.30,
            "flood_thresh": 0.70,
            "rise": 0.38,
            "status": IoTSensorStatus.FLOODED,
        },
        {
            "ward_id": "Ward-3-EastLowlands",
            "name": "East Lowlands Overflow Basin Gauge",
            "lat": center_lat - 0.018,
            "lon": center_lon + 0.037,
            "sensor_type": IoTSensorType.WATER_LEVEL_ULTRASONIC,
            "level": 0.96,
            "alert_thresh": 0.35,
            "flood_thresh": 0.80,
            "rise": 0.32,
            "status": IoTSensorStatus.FLOODED,
        },
        {
            "ward_id": "Ward-3-EastLowlands",
            "name": "East Retention Basin Submersible",
            "lat": center_lat - 0.024,
            "lon": center_lon + 0.032,
            "sensor_type": IoTSensorType.SUBMERSIBLE_PRESSURE,
            "level": 0.0,
            "alert_thresh": 0.35,
            "flood_thresh": 0.80,
            "rise": 0.0,
            "status": IoTSensorStatus.OFFLINE,  # Offline node to test neutral imputation
        },
        {
            "ward_id": "Ward-4-SouthDelta",
            "name": "South Delta Confluence Telemetry",
            "lat": center_lat - 0.034,
            "lon": center_lon - 0.012,
            "sensor_type": IoTSensorType.WATER_LEVEL_ULTRASONIC,
            "level": 0.58,
            "alert_thresh": 0.35,
            "flood_thresh": 0.80,
            "rise": 0.15,
            "status": IoTSensorStatus.ALERT,
        },
        {
            "ward_id": "Ward-4-SouthDelta",
            "name": "South Marsh Sluice Monitor",
            "lat": center_lat - 0.038,
            "lon": center_lon - 0.008,
            "sensor_type": IoTSensorType.DRAIN_OVERFLOW_GAUGE,
            "level": 0.48,
            "alert_thresh": 0.30,
            "flood_thresh": 0.70,
            "rise": 0.14,
            "status": IoTSensorStatus.ALERT,
        },
        {
            "ward_id": "Ward-5-WestHighland",
            "name": "West Highland Ridge Station",
            "lat": center_lat + 0.012,
            "lon": center_lon - 0.039,
            "sensor_type": IoTSensorType.WATER_LEVEL_ULTRASONIC,
            "level": 0.09,
            "alert_thresh": 0.35,
            "flood_thresh": 0.80,
            "rise": 0.0,
            "status": IoTSensorStatus.NORMAL,
        },
        {
            "ward_id": "Ward-5-WestHighland",
            "name": "West Terrace Culvert Sensor",
            "lat": center_lat + 0.008,
            "lon": center_lon - 0.042,
            "sensor_type": IoTSensorType.DRAIN_OVERFLOW_GAUGE,
            "level": 0.12,
            "alert_thresh": 0.30,
            "flood_thresh": 0.70,
            "rise": 0.0,
            "status": IoTSensorStatus.NORMAL,
        },
        {
            "ward_id": "Ward-6-RiverCorridor",
            "name": "River Corridor Urban Gauge A",
            "lat": center_lat + 0.014,
            "lon": center_lon + 0.016,
            "sensor_type": IoTSensorType.WATER_LEVEL_ULTRASONIC,
            "level": 1.42,
            "alert_thresh": 0.35,
            "flood_thresh": 0.80,
            "rise": 0.52,
            "status": IoTSensorStatus.FLOODED,
        },
        {
            "ward_id": "Ward-6-RiverCorridor",
            "name": "River Corridor Bridge Telemetry B",
            "lat": center_lat + 0.018,
            "lon": center_lon + 0.013,
            "sensor_type": IoTSensorType.SUBMERSIBLE_PRESSURE,
            "level": 1.35,
            "alert_thresh": 0.35,
            "flood_thresh": 0.80,
            "rise": 0.48,
            "status": IoTSensorStatus.FLOODED,
        },
    ]

    nodes: List[IoTSensorNode] = []
    for idx, cfg in enumerate(ward_configs):
        code = f"IOT-SENS-{idx+1:02d}"
        battery = 98 - (idx % 4) * 5 if cfg["status"] != IoTSensorStatus.OFFLINE else 12
        nodes.append(
            IoTSensorNode(
                node_code=code,
                ward_id=cfg["ward_id"],
                name=cfg["name"],
                latitude=round(cfg["lat"], 6),
                longitude=round(cfg["lon"], 6),
                sensor_type=cfg["sensor_type"],
                current_water_level_m=round(cfg["level"], 2),
                alert_threshold_m=round(cfg["alert_thresh"], 2),
                flood_threshold_m=round(cfg["flood_thresh"], 2),
                rate_of_rise_m_per_hr=round(cfg["rise"], 2),
                status=cfg["status"],
                battery_pct=battery,
                is_synthetic=True,
            )
        )
    return nodes


def generate_synthetic_dataset(
    seed: int = 42,
    num_sources: int = 500,
    num_pop_units: int = 500,
    center_lat: float = CENTER_LAT,
    center_lon: float = CENTER_LON,
) -> Tuple[FloodEvent, List[WaterSource], List[PopulationUnit]]:
    """
    Generates a complete reproducible synthetic dataset:
    - 1 FloodEvent with GeoJSON MultiPolygon
    - ~500 WaterSources with clustered locations, source types, and feature indicators
    - ~500 PopulationUnits with coordinates and population counts
    """
    rng = random.Random(seed)

    flood_geom = create_synthetic_flood_geometry(center_lat, center_lon)
    event = FloodEvent(
        name="Synthetic Flood Scenario Alpha-2026",
        geometry=flood_geom,
        data_version=f"synthetic-seed-{seed}",
        is_synthetic=True,
    )

    # Define 6 geographic neighborhood clusters (Wards 1 through 6)
    clusters = [
        {"ward": "Ward-1-NorthReach", "lat_offset": 0.03, "lon_offset": 0.02, "spread": 0.015},
        {"ward": "Ward-2-CentralBasin", "lat_offset": 0.00, "lon_offset": 0.00, "spread": 0.018},
        {"ward": "Ward-3-EastLowlands", "lat_offset": -0.02, "lon_offset": 0.035, "spread": 0.014},
        {"ward": "Ward-4-SouthDelta", "lat_offset": -0.035, "lon_offset": -0.01, "spread": 0.016},
        {"ward": "Ward-5-WestHighland", "lat_offset": 0.01, "lon_offset": -0.04, "spread": 0.012},
        {"ward": "Ward-6-RiverCorridor", "lat_offset": 0.015, "lon_offset": 0.015, "spread": 0.020},
    ]

    source_types = [
        SourceType.WELL,
        SourceType.PUBLIC_TAP,
        SourceType.STORAGE_POINT,
    ]
    source_weights = [0.45, 0.40, 0.15]

    sources: List[WaterSource] = []

    iot_nodes = generate_synthetic_iot_nodes(seed=seed, center_lat=center_lat, center_lon=center_lon)

    for i in range(num_sources):
        cluster = rng.choice(clusters)
        # Cluster Gaussian distribution with bounds
        lat = center_lat + cluster["lat_offset"] + rng.gauss(0, cluster["spread"])
        lon = center_lon + cluster["lon_offset"] + rng.gauss(0, cluster["spread"])

        stype = rng.choices(source_types, weights=source_weights, k=1)[0]
        code = f"SYN-{i+1:03d}"

        # Evaluate spatial flood exposure
        in_flood = point_in_polygon(lat, lon, flood_geom)
        if in_flood:
            flood_exp = round(rng.uniform(0.65, 1.0), 3)
        else:
            # Distance decay exposure
            dist_center = math.hypot(lat - center_lat, lon - center_lon)
            flood_exp = round(max(0.0, 0.60 - dist_center * 8.0) + rng.uniform(0.0, 0.15), 3)
            flood_exp = min(max(flood_exp, 0.0), 1.0)

        # Drainage distance (meters): sites in river/basin wards are closer to drains
        if "River" in cluster["ward"] or "Basin" in cluster["ward"] or "East" in cluster["ward"]:
            drain_dist = round(rng.uniform(15.0, 350.0), 1)
        else:
            drain_dist = round(rng.uniform(200.0, 1200.0), 1)

        # Population served (estimate)
        if stype == SourceType.PUBLIC_TAP:
            pop_served = int(rng.triangular(300, 4500, 1800))
        elif stype == SourceType.WELL:
            pop_served = int(rng.triangular(100, 2500, 800))
        else:
            pop_served = int(rng.triangular(500, 7000, 2500))

        # Source vulnerability
        prot = rng.choice(["standard", "poor", "good"])
        src_vuln = compute_source_vulnerability_score(stype.value, prot)

        # Historical risk (some missing to test missing-data policy)
        has_history = rng.random() > 0.25  # 25% missing
        hist_risk = round(rng.uniform(0.1, 0.95), 3) if has_history else None

        # Data quality tag
        has_drain = rng.random() > 0.10  # 10% missing drain distance
        actual_drain_dist = drain_dist if has_drain else None

        # Link in-situ IoT telemetry sensor for ground reality
        ward_nodes = [node for node in iot_nodes if node.ward_id == cluster["ward"]]
        if not ward_nodes:
            ward_nodes = iot_nodes
        nearest_node = min(ward_nodes, key=lambda n: math.hypot(lat - n.latitude, lon - n.longitude))
        iot_id = nearest_node.id
        iot_lvl = nearest_node.current_water_level_m if nearest_node.status != IoTSensorStatus.OFFLINE else None
        iot_st = nearest_node.status.value

        if not has_history or not has_drain or iot_lvl is None:
            quality_status = "partial"
        else:
            quality_status = "complete"

        # Physical DEM Elevation & Topographic Wetness Index (TWI)
        elevation_base = 28.0 - (lat - center_lat) * 120.0 + (lon - center_lon) * 80.0
        elevation = round(max(8.0, min(55.0, elevation_base + rng.gauss(0, 3.5))), 1)
        twi_value = round(max(0.05, min(0.98, 1.0 - (elevation - 8.0) / 47.0 + rng.uniform(-0.1, 0.1))), 3)

        # Copernicus Sentinel-1 SAR Radar Backscatter (dB): Water causes specular reflection -> low dB (-22 to -16)
        if in_flood or flood_exp > 0.6:
            sar_db = round(rng.uniform(-23.5, -16.0), 1)
        else:
            sar_db = round(rng.uniform(-15.5, -8.0), 1)

        sources.append(
            WaterSource(
                source_code=code,
                latitude=round(lat, 6),
                longitude=round(lon, 6),
                source_type=stype,
                ward_id=cluster["ward"],
                population_served=pop_served,
                population_provenance="synthetic-cluster-estimate",
                drain_distance_m=actual_drain_dist,
                flood_exposure=flood_exp,
                historical_risk=hist_risk,
                source_vulnerability=round(src_vuln, 3),
                elevation_m=elevation,
                topographic_wetness_index=twi_value,
                sar_backscatter_db=sar_db,
                nearest_iot_node_id=iot_id,
                iot_water_level_m=iot_lvl,
                iot_status=iot_st,
                data_quality_status=quality_status,
                is_synthetic=True,
            )
        )

    # Generate Population Units
    pop_units: List[PopulationUnit] = []
    for j in range(num_pop_units):
        cluster = rng.choice(clusters)
        lat = center_lat + cluster["lat_offset"] + rng.gauss(0, cluster["spread"] * 1.1)
        lon = center_lon + cluster["lon_offset"] + rng.gauss(0, cluster["spread"] * 1.1)
        pop_count = int(rng.triangular(150, 4000, 950))
        in_flood = point_in_polygon(lat, lon, flood_geom)
        # Population in flood zone or high density is flagged high risk
        is_high_risk = in_flood or (pop_count > 1200) or (rng.random() > 0.3)

        pop_units.append(
            PopulationUnit(
                event_id=event.id,
                unit_code=f"POP-{j+1:03d}",
                latitude=round(lat, 6),
                longitude=round(lon, 6),
                population=pop_count,
                is_high_risk=is_high_risk,
                is_synthetic=True,
            )
        )

    return event, sources, pop_units
