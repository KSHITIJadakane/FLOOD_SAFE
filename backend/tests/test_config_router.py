"""Tests for Risk Engine Configuration and Real-Time What-If Sensitivity Tuning."""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_get_risk_config():
    headers = {"X-Demo-User": "operator-01", "X-Demo-Role": "operator"}
    response = client.get("/api/v1/config/risk", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "weights" in data
    assert "flood_exposure" in data["weights"]
    assert "drain_proximity_risk" in data["weights"]


def test_update_risk_weights():
    headers = {"X-Demo-User": "operator-01", "X-Demo-Role": "operator"}
    payload = {
        "flood_exposure": 0.50,
        "drain_proximity_risk": 0.20,
        "historical_risk": 0.10,
        "source_vulnerability": 0.10,
        "population_exposure": 0.10,
    }
    response = client.put("/api/v1/config/risk", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["is_custom_tuned"] is True
    assert data["weights"]["flood_exposure"] == 0.50

    # Reset
    reset_resp = client.post("/api/v1/config/risk/reset", headers=headers)
    assert reset_resp.status_code == 200
    assert reset_resp.json()["is_custom_tuned"] is False
