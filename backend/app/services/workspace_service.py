from datetime import UTC, datetime
from uuid import uuid4

from app.models.workspace import Domain, Workspace, WorkspaceCreate


class WorkspaceService:
    """Manage workspace creation and retrieval."""

    def __init__(self) -> None:
        self._workspaces: dict[str, Workspace] = {}

    def create_workspace(self, request: WorkspaceCreate) -> Workspace:
        domains = [
            Domain(
                id=str(uuid4()),
                name=domain.name,
                description=domain.description,
                status="draft",
            )
            for domain in request.domains
        ]

        workspace = Workspace(
            id=str(uuid4()),
            name=request.name,
            team_name=request.team_name,
            purpose=request.purpose,
            status="configuring",
            onboarding_progress=self._calculate_progress(domains),
            domains=domains,
            created_at=datetime.now(UTC),
        )

        self._workspaces[workspace.id] = workspace
        return workspace

    def list_workspaces(self) -> list[Workspace]:
        return list(self._workspaces.values())

    def get_workspace(self, workspace_id: str) -> Workspace | None:
        return self._workspaces.get(workspace_id)

    def clear(self) -> None:
        """Clear temporary storage. Used by automated tests."""
        self._workspaces.clear()

    @staticmethod
    def _calculate_progress(domains: list[Domain]) -> int:
        if not domains:
            return 10

        return 20


workspace_service = WorkspaceService()