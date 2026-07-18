"""Investigation API."""

from fastapi import APIRouter, HTTPException

from app.models import InvestigationRequest
from app.services.investigation_service import InvestigationService
from app.services.demo_investigation import (
    create_demo_investigation,
)

router = APIRouter(
    prefix="/api/v1/investigations",
    tags=["Investigations"],
)

service = InvestigationService()


@router.post("", status_code=201)
def create_investigation(
    request: InvestigationRequest,
):
    """Create a new investigation."""

    return service.create_investigation(request)


@router.get("/demo")
def get_demo_investigation():
    """Return a completed investigation for frontend development."""

    return create_demo_investigation()


@router.get("/{investigation_id}")
def get_investigation(
    investigation_id: str,
):
    """Return an investigation."""

    investigation = service.get_investigation(
        investigation_id
    )

    if investigation is None:
        raise HTTPException(
            status_code=404,
            detail="Investigation not found.",
        )

    return investigation