from fastapi import APIRouter, HTTPException, status

from app.models.workspace import Workspace, WorkspaceCreate
from app.services.workspace_service import workspace_service


router = APIRouter(
    prefix="/api/v1/workspaces",
    tags=["Workspaces"],
)


@router.post(
    "",
    response_model=Workspace,
    status_code=status.HTTP_201_CREATED,
)
def create_workspace(request: WorkspaceCreate) -> Workspace:
    """Create a workspace for a team or business function."""
    return workspace_service.create_workspace(request)


@router.get("", response_model=list[Workspace])
def list_workspaces() -> list[Workspace]:
    """Return all currently configured workspaces."""
    return workspace_service.list_workspaces()


@router.get("/{workspace_id}", response_model=Workspace)
def get_workspace(workspace_id: str) -> Workspace:
    """Return one workspace by its identifier."""
    workspace = workspace_service.get_workspace(workspace_id)

    if workspace is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    return workspace