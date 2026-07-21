"""Service responsible for managing enterprise investigations."""

from collections.abc import Iterable
from datetime import datetime, timezone

from app.models import (
    Investigation,
    InvestigationRequest,
    InvestigationStatus,
)


class InvestigationService:
    """Coordinates the lifecycle of enterprise investigations."""

    def __init__(
        self,
        initial_investigations: Iterable[Investigation] | None = None,
    ) -> None:
        """Create the service and optionally preload investigations."""

        self._investigations: dict[str, Investigation] = {}

        if initial_investigations is not None:
            for investigation in initial_investigations:
                self.save_investigation(investigation)

    def create_investigation(
        self,
        request: InvestigationRequest,
    ) -> Investigation:
        """Create and store a new investigation."""

        investigation = Investigation(
            workspace_id=request.workspace_id,
            incident_title=request.incident_title,
            incident_description=request.incident_description,
            status=InvestigationStatus.CREATED,
        )

        return self.save_investigation(investigation)

    def save_investigation(
        self,
        investigation: Investigation,
    ) -> Investigation:
        """Store or replace an investigation."""

        self._investigations[
            str(investigation.investigation_id)
        ] = investigation

        return investigation

    def get_investigation(
        self,
        investigation_id: str,
    ) -> Investigation | None:
        """Return an investigation by identifier."""

        return self._investigations.get(investigation_id)

    def update_status(
        self,
        investigation: Investigation,
        status: InvestigationStatus,
    ) -> Investigation:
        """Update and persist an investigation status."""

        current_time = datetime.now(timezone.utc)

        investigation.status = status
        investigation.updated_at = current_time

        if status == InvestigationStatus.COMPLETED:
            investigation.completed_at = current_time

        return self.save_investigation(investigation)

    def list_investigations(self) -> list[Investigation]:
        """Return investigations ordered by most recent activity."""

        return sorted(
            self._investigations.values(),
            key=lambda investigation: investigation.updated_at,
            reverse=True,
        )