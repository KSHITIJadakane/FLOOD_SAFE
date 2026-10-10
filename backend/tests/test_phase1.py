"""Unit tests for Phase 1 — Foundation: schemas, synthetic generator, health endpoint."""
from __future__ import annotations
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.data_generator import generate_synthetic_dataset, create_synthetic_flood_geometry
from backend.app.geo_utils import haversine_distance_m, point_in_polygon
from backend.app.models import SourceType


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_health_endpoints(client):
    r1 = client.get("/health")
    assert r1.status_code == 200
    data1 = r1.json()
    assert data1["status"] == "healthy"
    assert data1["is_synthetic"] is True

    r2 = client.get("/api/v1/health")
    assert r2.status_code == 200
    data2 = r2.json()
    assert data2["status"] == "healthy"


def test_synthetic_data_generation_reproducibility():
    """Verify that fixing the seed produces identical deterministic output."""
    event1, sources1, pop1 = generate_synthetic_dataset(seed=42, num_sources=100, num_pop_units=100)
    event2, sources2, pop2 = generate_synthetic_dataset(seed=42, num_sources=100, num_pop_units=100)

    assert len(sources1) == 100
    assert len(pop1) == 100
    assert sources1[0].source_code == sources2[0].source_code
    assert sources1[0].latitude == sources2[0].latitude
    assert sources1[0].longitude == sources2[0].longitude
    assert sources1[0].population_served == sources2[0].population_served
    assert pop1[0].population == pop2[0].population


def test_synthetic_data_constraints():
    """Verify synthetic dataset properties match data model and seed decisions."""
    event, sources, pop_units = generate_synthetic_dataset(seed=42, num_sources=500, num_pop_units=500)

    assert len(sources) == 500
    assert len(pop_units) == 500
    assert event.is_synthetic is True

    valid_types = {SourceType.WELL, SourceType.PUBLIC_TAP, SourceType.STORAGE_POINT}

    for s in sources:
        assert s.is_synthetic is True
        assert s.source_type in valid_types
        assert s.source_code.startswith("SYN-")
        assert 12.5 <= s.latitude <= 13.5
        assert 80.0 <= s.longitude <= 80.5
        if s.flood_exposure is not None:
            assert 0.0 <= s.flood_exposure <= 1.0
        if s.historical_risk is not None:
            assert 0.0 <= s.historical_risk <= 1.0
        if s.source_vulnerability is not None:
            assert 0.0 <= s.source_vulnerability <= 1.0

    for p in pop_units:
        assert p.is_synthetic is True
        assert p.population > 0
        assert p.unit_code.startswith("POP-")


def test_geo_utils_haversine():
    """Verify metric distance computation for known coordinate delta."""
    # 1 degree latitude is approximately 111.139 km
    dist = haversine_distance_m(13.0, 80.0, 13.01, 80.0)
    assert 1100.0 < dist < 1120.0

    # Zero distance
    assert haversine_distance_m(13.0, 80.0, 13.0, 80.0) == 0.0


def test_flood_geometry_containment():
    flood_geom = create_synthetic_flood_geometry()
    assert flood_geom["type"] == "MultiPolygon"
    assert len(flood_geom["coordinates"]) >= 1

    # Center is well within river floodplain
    inside = point_in_polygon(13.0450, 80.2250, flood_geom)
    assert inside is True

    # Far coordinate outside basin
    outside = point_in_polygon(14.5000, 81.5000, flood_geom)
    assert outside is False
