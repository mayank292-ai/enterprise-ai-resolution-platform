from fastapi.testclient import TestClient

from app.main import app
from app.services.workspace_service import workspace_service


client = TestClient(app)


def setup_function() -> None:
    workspace_service.clear()


def test_create_workspace() -> None:
    response = client.post(
        "/api/v1/workspaces",
        json={
            "name": "PDS Resolution Workspace",
            "team_name": "Payment Data Services",
            "purpose": (
                "Investigate complex payment data issues across "
                "multiple PDS domains."
            ),
            "domains": [
                {
                    "name": "Payment Events",
                    "description": "Payment lifecycle and event records.",
                },
                {
                    "name": "FX",
                    "description": "Currency conversion and enrichment data.",
                },
                {
                    "name": "Data Quality",
                    "description": "Validation results and failed controls.",
                },
                {
                    "name": "AMINET Data",
                    "description": "Reference and enrichment data used by PDS.",
                },
            ],
        },
    )

    assert response.status_code == 201

    result = response.json()

    assert result["name"] == "PDS Resolution Workspace"
    assert result["team_name"] == "Payment Data Services"
    assert result["status"] == "configuring"
    assert result["onboarding_progress"] == 20
    assert len(result["domains"]) == 4
    assert result["domains"][0]["name"] == "Payment Events"


def test_list_workspaces() -> None:
    client.post(
        "/api/v1/workspaces",
        json={
            "name": "PDS Resolution Workspace",
            "team_name": "Payment Data Services",
            "purpose": "Investigate operational payment data issues.",
            "domains": [],
        },
    )

    response = client.get("/api/v1/workspaces")

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_missing_workspace_returns_404() -> None:
    response = client.get("/api/v1/workspaces/unknown-workspace")

    assert response.status_code == 404
    assert response.json() == {"detail": "Workspace not found"}