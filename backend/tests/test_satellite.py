"""Tests for Satellite Earth Observation & Radar Processing."""
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.satellite_pipeline import Sentinel1SARProcessor, DEMHydrologyProcessor

client = TestClient(app)


def test_sar_backscatter_calibration_and_probability():
    # Low dB (specular water reflection) -> high flood probability
    water_prob = Sentinel1SARProcessor.estimate_flood_water_probability(-21.0)
    assert water_prob > 0.85

    # High dB (dry land) -> low flood probability
    dry_prob = Sentinel1SARProcessor.estimate_flood_water_probability(-9.0)
    assert dry_prob < 0.15


def test_dem_twi_computation():
    # Flat floodplain -> high TWI
    flat_twi = DEMHydrologyProcessor.compute_twi(elevation_m=12.0, slope_degrees=1.0)
    assert flat_twi > 0.50

    # Steep ridge -> low TWI
    steep_twi = DEMHydrologyProcessor.compute_twi(elevation_m=45.0, slope_degrees=18.0)
    assert steep_twi < flat_twi


def test_satellite_api_endpoints():
    res = client.get("/api/v1/satellite/summary")
    assert res.status_code == 200
    data = res.json()
    assert "Copernicus Sentinel-1" in data["satellite_constellation"]
    assert data["total_monitored_sources"] > 0
