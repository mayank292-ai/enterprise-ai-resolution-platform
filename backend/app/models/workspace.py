from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class DomainCreate(BaseModel):
    """Information required to add a domain to a workspace."""

    name: str = Field(min_length=2, max_length=100)
    description: str = Field(min_length=5, max_length=500)


class Domain(BaseModel):
    """A business or data domain configured inside a workspace."""

    id: str
    name: str
    description: str
    status: Literal["draft", "ready"] = "draft"


class WorkspaceCreate(BaseModel):
    """Information supplied when a team creates a workspace."""

    name: str = Field(min_length=3, max_length=100)
    team_name: str = Field(min_length=2, max_length=100)
    purpose: str = Field(min_length=10, max_length=1000)
    domains: list[DomainCreate] = Field(default_factory=list)


class Workspace(BaseModel):
    """Complete workspace returned by the platform."""

    id: str
    name: str
    team_name: str
    purpose: str
    status: Literal["draft", "configuring", "ready"]
    onboarding_progress: int = Field(ge=0, le=100)
    domains: list[Domain]
    created_at: datetime