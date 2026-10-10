"""Satellite Earth Observation & Radar Telemetry API Router."""
from __future__ import annotations
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from backend.app.storage import storage
from backend.app.satellite_pipeline import analyze_geospatial_telemetry

router = APIRouter(prefix="/api/v1/satellite", tags=["Satellite & Earth Observation"])


@router.get("/telemetry/{source_id}")
def get_source_satellite_telemetry(source_id: str) -> Dict[str, Any]:
    """Retrieves calibrated Copernicus Sentinel-1 SAR and DEM hydrology analysis for a source."""
    source = storage.get_source_by_id(source_id)
    if not source:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Source {source_id} not found."}
        )

    return analyze_geospatial_telemetry(
        latitude=source.latitude,
        longitude=source.longitude,
        elevation_m=source.elevation_m,
        sar_backscatter_db=source.sar_backscatter_db,
        distance_to_drain_m=source.drain_distance_m,
    )


@router.get("/summary")
def get_satellite_summary(event_id: Optional[str] = None) -> Dict[str, Any]:
    """Provides high-level satellite Earth Observation statistics across all monitored sites."""
    sources = storage.get_sources()
    total = len(sources)
    if total == 0:
        return {"total_monitored_sources": 0}

    low_sar_count = sum(1 for s in sources if (s.sar_backscatter_db or 0) <= -16.0)
    high_twi_count = sum(1 for s in sources if (s.topographic_wetness_index or 0) >= 0.70)
    avg_elevation = round(sum(s.elevation_m or 20.0 for s in sources) / total, 1)

    return {
        "satellite_constellation": "Copernicus Sentinel-1 (C-band SAR) & SRTM DEM",
        "total_monitored_sources": total,
        "active_flood_water_reflections": low_sar_count,
        "high_topographic_wetness_sources": high_twi_count,
        "mean_elevation_m": avg_elevation,
        "calibration_standard": "Sigma-0 (dB) gamma-calibrated",
        "is_synthetic": True,
    }
