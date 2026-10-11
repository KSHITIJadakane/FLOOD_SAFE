"""Unit tests for IoT Ground Sensors & Ground Reality Telemetry Fusion."""
from __future__ import annotations
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.models import IoTSensorStatus, SourceType, WaterSource
from backend.app.config import load_risk_config
from backend.app.risk_engine import score_single_source, normalize_features


from backend.app.storage import storage


@pytest.fixture
def client():
    if not storage.get_iot_nodes():
        storage.seed_default_data(seed=42)
    with TestClient(app) as c:
        yield c


def test_list_and_get_iot_sensors(client):
    res = client.get("/api/v1/iot-sensors")
    assert res.status_code == 200
    sensors = res.json()
    assert len(sensors) >= 12
    # Verify synthetic demo label
    assert all(s["is_synthetic"] is True for s in sensors)

    first_node = sensors[0]
    detail = client.get(f"/api/v1/iot-sensors/{first_node['id']}")
    assert detail.status_code == 200
    assert detail.json()["node_code"] == first_node["node_code"]


def test_update_iot_telemetry(client):
    res = client.get("/api/v1/iot-sensors")
    sensor = res.json()[0]

    # Update telemetry with a flood-level reading
    update_res = client.patch(
        f"/api/v1/iot-sensors/{sensor['id']}/telemetry",
        json={"current_water_level_m": 1.45, "rate_of_rise_m_per_hr": 0.60},
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["current_water_level_m"] == 1.45
    assert updated["status"] == "flooded"


def test_iot_telemetry_fusion_in_risk_engine():
    cfg = load_risk_config()

    # Source with normal flood exposure and ground IoT reading
    src_active_iot = WaterSource(
        source_code="SYN-IOT-TEST",
        latitude=13.045,
        longitude=80.225,
        source_type=SourceType.WELL,
        ward_id="Ward-2-CentralBasin",
        population_served=1500,
        drain_distance_m=150.0,
        flood_exposure=0.60,
        historical_risk=0.50,
        source_vulnerability=0.60,
        iot_water_level_m=1.20,
        iot_status="flooded",
    )

    scored = score_single_source(src_active_iot, cfg)
    assert scored.relative_vulnerability_score > 0.0
    assert scored.iot_water_level_m == 1.20
    assert scored.iot_status == "flooded"
    # Transparent explanation mentions ground IoT station
    assert "ground IoT station" in scored.explanation


def test_offline_iot_sensor_imputation_and_penalty():
    cfg = load_risk_config()

    src_offline_iot = WaterSource(
        source_code="SYN-IOT-OFFLINE",
        latitude=13.045,
        longitude=80.225,
        source_type=SourceType.WELL,
        ward_id="Ward-3-EastLowlands",
        population_served=1500,
        drain_distance_m=150.0,
        flood_exposure=None,  # Missing satellite exposure as well
        historical_risk=0.50,
        source_vulnerability=0.60,
        iot_water_level_m=None,
        iot_status="offline",
    )

    scored = score_single_source(src_offline_iot, cfg)
    # Never silent zero: flood_exposure must be flagged as missing
    assert "flood_exposure" in scored.missing_features
    # Imputed at neutral 0.5 * weight
    assert scored.feature_contributions["flood_exposure"] == round(cfg.weights["flood_exposure"] * 0.5, 4)
    assert "Ground IoT telemetry offline" in scored.explanation or "Inputs missing" in scored.explanation
