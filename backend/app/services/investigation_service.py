"""Service responsible for managing enterprise investigations."""

from datetime import datetime, timezone

from app.models import (
    Investigation,
    InvestigationRequest,
    InvestigationStatus,
)


class InvestigationService:
    """Coordinates the lifecycle of an investigation."""

    def __init__(self) -> None:
        self._investigations: dict[str, Investigation] = {}

    def create_investigation(
        self,
        request: InvestigationRequest,
    ) -> Investigation:
        """Create a new investigation."""

        investigation = Investigation(
            workspace_id=request.workspace_id,
            incident_title=request.incident_title,
            incident_description=request.incident_description,
            status=InvestigationStatus.CREATED,
        )

        self._investigations[
            str(investigation.investigation_id)
        ] = investigation

        return investigation

    def get_investigation(
        self,
        investigation_id: str,
    ) -> Investigation | None:
        """Return an investigation."""

        return self._investigations.get(investigation_id)

    def update_status(
        self,
        investigation: Investigation,
        status: InvestigationStatus,
    ) -> Investigation:
        """Update investigation status."""

        investigation.status = status
        investigation.updated_at = datetime.now(timezone.utc)

        if status == InvestigationStatus.COMPLETED:
            investigation.completed_at = datetime.now(timezone.utc)

        return investigation

    def list_investigations(self) -> list[Investigation]:
        """Return all investigations."""

        return list(self._investigations.values())