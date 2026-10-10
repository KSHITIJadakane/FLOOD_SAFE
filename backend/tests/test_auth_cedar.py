"""Unit tests for Phase 5 — AWS Cedar Authorization & Forbid Boundaries."""
from __future__ import annotations
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.storage import storage
from backend.app.auth import authorize
from fastapi import HTTPException


@pytest.fixture
def client():
    if not storage.list_events():
        storage.seed_default_data(seed=42)
    with TestClient(app) as c:
        yield c


def test_viewer_denied_create_plan_403(client):
    """Demo 403 Moment: Viewer attempting to CreatePlan must be blocked by Cedar default-deny."""
    event_id = storage.list_events()[0].id
    headers = {"X-Demo-User": "demo-viewer", "X-Demo-Role": "viewer"}
    payload = {"event_id": event_id, "capacity_k": 10}

    r = client.post("/api/v1/testing-plans", json=payload, headers=headers)
    assert r.status_code == 403
    data = r.json()["detail"]
    assert data["code"] == "FORBIDDEN"
    assert data["action"] == "CreatePlan"
    assert "viewer" in data["roles"]


def test_viewer_denied_run_assessment_403(client):
    event_id = storage.list_events()[0].id
    headers = {"X-Demo-User": "demo-viewer", "X-Demo-Role": "viewer"}
    r = client.post("/api/v1/risk-assessments/run", json={"event_id": event_id}, headers=headers)
    assert r.status_code == 403
    assert r.json()["detail"]["code"] == "FORBIDDEN"


def test_operator_permitted_create_plan(client):
    event_id = storage.list_events()[0].id
    headers = {"X-Demo-User": "demo-operator", "X-Demo-Role": "operator"}
    payload = {"event_id": event_id, "capacity_k": 5}

    r = client.post("/api/v1/testing-plans", json=payload, headers=headers)
    assert r.status_code == 200
    assert r.json()["capacity_k"] == 5


def test_field_recorder_simulated_vs_verified(client):
    event_id = storage.list_events()[0].id
    source_id = storage.get_sources()[0].id
    headers = {"X-Demo-User": "demo-field", "X-Demo-Role": "field_recorder"}

    # 1. Field recorder can record simulated test
    sim_payload = {
        "event_id": event_id,
        "source_id": source_id,
        "verification_status": "simulated",
        "result_category": "abnormal",
    }
    r_sim = client.post("/api/v1/field-tests", json=sim_payload, headers=headers)
    assert r_sim.status_code == 200
    assert r_sim.json()["verification_status"] == "simulated"

    # 2. Field recorder is FORBIDDEN from recording verified result (verified-admin-only)
    ver_payload = {
        "event_id": event_id,
        "source_id": source_id,
        "verification_status": "verified",
        "result_category": "abnormal",
    }
    r_ver = client.post("/api/v1/field-tests", json=ver_payload, headers=headers)
    assert r_ver.status_code == 403
    assert r_ver.json()["detail"]["code"] == "FORBIDDEN"


def test_admin_permitted_verified_field_test(client):
    event_id = storage.list_events()[0].id
    source_id = storage.get_sources()[0].id
    headers = {"X-Demo-User": "demo-admin", "X-Demo-Role": "admin"}

    payload = {
        "event_id": event_id,
        "source_id": source_id,
        "verification_status": "verified",
        "result_category": "normal",
    }
    r = client.post("/api/v1/field-tests", json=payload, headers=headers)
    assert r.status_code == 200
    assert r.json()["verification_status"] == "verified"


def test_audit_admin_only(client):
    event_id = storage.list_events()[0].id
    run = storage.get_latest_assessment(event_id)
    if not run:
        client.post(
            "/api/v1/risk-assessments/run",
            json={"event_id": event_id},
            headers={"X-Demo-Role": "operator"},
        )
        run = storage.get_latest_assessment(event_id)
    run_id = run.assessment_run_id

    # Viewer denied
    r_viewer = client.get(f"/api/v1/audit/assessments/{run_id}", headers={"X-Demo-Role": "viewer"})
    assert r_viewer.status_code == 403

    # Admin allowed
    r_admin = client.get(f"/api/v1/audit/assessments/{run_id}", headers={"X-Demo-Role": "admin"})
    assert r_admin.status_code == 200


def test_no_automatic_advisory_forbid_all_roles(client):
    """Strict Cedar forbid rule: IssueAdvisory is denied across all roles including Admin."""
    for role in ["viewer", "operator", "field_recorder", "admin"]:
        r = client.post("/api/v1/advisories", headers={"X-Demo-Role": role})
        assert r.status_code == 403
        assert r.json()["detail"]["code"] == "FORBIDDEN"
        assert r.json()["detail"]["action"] == "IssueAdvisory"


def test_unknown_role_default_deny():
    """Any unregistered role must fail with 403 default-deny."""
    with pytest.raises(HTTPException) as excinfo:
        authorize(
            user_id="hacker",
            roles=["intruder"],
            action="ViewQueue",
            resource='FloodSafe::FloodEvent::"default"',
        )
    assert excinfo.value.status_code == 403
