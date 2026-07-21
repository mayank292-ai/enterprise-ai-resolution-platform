"""Investigation API."""

from fastapi import APIRouter, HTTPException

from app.models import (
    CapabilityGap,
    Investigation,
    InvestigationRequest,
)
from app.runtime import create_runtime
from app.services.demo_investigation import (
    create_demo_investigation,
)

router = APIRouter(
    prefix="/api/v1/investigations",
    tags=["Investigations"],
)

runtime = create_runtime()


@router.post(
    "",
    response_model=Investigation,
    status_code=201,
)
def create_investigation(
    request: InvestigationRequest,
) -> Investigation:
    """Create a new investigation."""

    return runtime.investigation_service.create_investigation(
        request
    )


@router.get(
    "",
    response_model=list[Investigation],
)
def list_investigations() -> list[Investigation]:
    """Return all investigations."""

    return (
        runtime.investigation_service.list_investigations()
    )


@router.get(
    "/demo",
    response_model=Investigation,
)
def get_demo_investigation() -> Investigation:
    """Return a completed investigation for frontend development."""

    return create_demo_investigation()


@router.get(
    "/{investigation_id}",
    response_model=Investigation,
)
def get_investigation(
    investigation_id: str,
) -> Investigation:
    """Return an investigation."""

    investigation = (
        runtime.investigation_service.get_investigation(
            investigation_id
        )
    )

    if investigation is None:
        raise HTTPException(
            status_code=404,
            detail="Investigation not found.",
        )

    return investigation


@router.post(
    "/{investigation_id}/run",
    response_model=Investigation,
)
async def run_investigation(
    investigation_id: str,
) -> Investigation:
    """Execute the next investigation step."""

    investigation = (
        runtime.investigation_service.get_investigation(
            investigation_id
        )
    )

    if investigation is None:
        raise HTTPException(
            status_code=404,
            detail="Investigation not found.",
        )

    await runtime.orchestrator.run(
        investigation
    )

    return investigation

@router.post(
    "/{investigation_id}/capability-gap/approve",
    response_model=CapabilityGap,
)
def approve_capability_gap(
    investigation_id: str,
) -> CapabilityGap:
    """Approve and provision the pending capability gap."""

    investigation = (
        runtime.investigation_service.get_investigation(
            investigation_id
        )
    )

    if investigation is None:
        raise HTTPException(
            status_code=404,
            detail="Investigation not found.",
        )

    try:
        capability_gap = (
            runtime.capability_provisioning_service.provision(
                investigation=investigation,
            )
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=409,
            detail=str(exc),
        ) from exc

    runtime.investigation_service.save_investigation(
        investigation
    )

    return capability_gap


@router.post(
    "/{investigation_id}/resume",
    response_model=Investigation,
)
async def resume_investigation(
    investigation_id: str,
) -> Investigation:
    """Resume using the newly provisioned capability."""

    investigation = (
        runtime.investigation_service.get_investigation(
            investigation_id
        )
    )

    if investigation is None:
        raise HTTPException(
            status_code=404,
            detail="Investigation not found.",
        )

    try:
        await runtime.orchestrator.resume_after_capability(
            investigation
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=409,
            detail=str(exc),
        ) from exc

    runtime.investigation_service.save_investigation(
        investigation
    )

    return investigation