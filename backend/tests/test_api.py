"""Unit tests for Phase 4 — REST API Endpoints."""
from __future__ import annotations
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.storage import storage


@pytest.fixture
def client():
    # Ensure dataset is seeded
    if not storage.list_events():
        storage.seed_default_data(seed=42)
    with TestClient(app) as c:
        yield c


def test_list_and_get_events(client):
    r = client.get("/api/v1/flood-events")
    assert r.status_code == 200
    events = r.json()
    assert len(events) >= 1
    event_id = events[0]["id"]

    r_single = client.get(f"/api/v1/flood-events/{event_id}")
    assert r_single.status_code == 200
    assert r_single.json()["id"] == event_id


def test_list_sources_and_filters(client):
    r = client.get("/api/v1/sources?limit=10")
    assert r.status_code == 200
    sources = r.json()
    assert len(sources) == 10
    assert sources[0]["is_synthetic"] is True
    assert "relative_vulnerability_score" in sources[0]

    # Filter by source_type
    r_well = client.get("/api/v1/sources?source_type=well&limit=10")
    assert r_well.status_code == 200
    wells = r_well.json()
    for w in wells:
        assert w["source_type"] == "well"


def test_get_source_detail_with_explanation(client):
    r_list = client.get("/api/v1/sources?limit=1")
    first_code = r_list.json()[0]["source_code"]

    r_det = client.get(f"/api/v1/sources/{first_code}")
    assert r_det.status_code == 200
    data = r_det.json()
    assert data["source_code"] == first_code
    assert "explanation" in data
    assert "not evidence of water contamination" in data["explanation"]
    assert data["disclaimer"] is not None


def test_run_assessment_and_queue(client):
    events = client.get("/api/v1/flood-events").json()
    event_id = events[0]["id"]

    r_run = client.post("/api/v1/risk-assessments/run", json={"event_id": event_id, "config_version": "risk-v1"})
    assert r_run.status_code == 200
    run_data = r_run.json()
    assert run_data["sources_scored"] >= 500

    r_queue = client.get(f"/api/v1/testing-queue?event_id={event_id}&limit=20")
    assert r_queue.status_code == 200
    queue = r_queue.json()
    assert len(queue) == 20
    assert queue[0]["rank"] == 1


def test_create_and_get_testing_plan(client):
    events = client.get("/api/v1/flood-events").json()
    event_id = events[0]["id"]

    plan_payload = {
        "event_id": event_id,
        "capacity_k": 10,
        "coverage_radius_m": 500.0,
        "objective": "max_unique_high_risk_population",
        "seed": 42,
        "include_baseline": True,
        "baseline_trials": 100,
    }
    r_plan = client.post("/api/v1/testing-plans", json=plan_payload)
    assert r_plan.status_code == 200
    plan = r_plan.json()
    assert plan["capacity_k"] == 10
    assert len(plan["selected"]) <= 10
    assert plan["metrics"]["unique_population_covered"] > 0
    assert plan["baseline"]["trials"] == 100

    plan_id = plan["plan_id"]
    r_get = client.get(f"/api/v1/testing-plans/{plan_id}")
    assert r_get.status_code == 200
    assert r_get.json()["plan_id"] == plan_id


def test_field_test_recording_and_feedback(client):
    events = client.get("/api/v1/flood-events").json()
    event_id = events[0]["id"]
    sources = client.get("/api/v1/sources?limit=1").json()
    source_id = sources[0]["source_id"]

    ft_payload = {
        "event_id": event_id,
        "source_id": source_id,
        "test_type": "rapid",
        "result_category": "abnormal",
        "verification_status": "simulated",
        "notes": "Simulated field check for demo",
    }
    # Field recorder role is authorized to submit simulated tests
    r_ft = client.post("/api/v1/field-tests", json=ft_payload, headers={"X-Demo-Role": "field_recorder"})
    assert r_ft.status_code == 200
    ft = r_ft.json()
    assert ft["verification_status"] == "simulated"
    assert ft["result_category"] == "abnormal"


def test_risk_map_geojson_endpoint(client):
    r_map = client.get("/api/v1/risk-map")
    assert r_map.status_code == 200
    map_data = r_map.json()
    assert map_data["type"] == "FeatureCollection"
    assert len(map_data["features"]) > 0
    assert map_data["is_synthetic"] is True


def test_audit_endpoint(client):
    events = client.get("/api/v1/flood-events").json()
    event_id = events[0]["id"]
    r_run = client.post("/api/v1/risk-assessments/run", json={"event_id": event_id})
    run_id = r_run.json()["assessment_run_id"]

    # Admin role is authorized to access audit trail
    r_audit = client.get(f"/api/v1/audit/assessments/{run_id}", headers={"X-Demo-Role": "admin"})
    assert r_audit.status_code == 200
    audit_data = r_audit.json()
    assert audit_data["assessment_run_id"] == run_id
    assert "band_distribution" in audit_data
