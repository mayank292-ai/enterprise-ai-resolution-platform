"""Tests for the frontend demo investigation endpoint."""

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_demo_investigation_returns_complete_response() -> None:
    """Demo endpoint should return frontend-ready investigation data."""

    response = client.get(
        "/api/v1/investigations/demo"
    )

    assert response.status_code == 200

    body = response.json()

    assert body["status"] == "completed"
    assert len(body["agent_decisions"]) == 5
    assert len(body["evidence"]) == 5
    assert body["root_cause"] is not None
    assert body["business_impact"]["affected_records"] == 37
    assert body["capability_opportunity"] is not None