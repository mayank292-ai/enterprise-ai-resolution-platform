"""Durable outputs produced during investigations."""

from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class HypothesisUpdateStatus(str, Enum):
    """Allowed states for specialist hypothesis updates."""

    PROPOSED = "proposed"
    SUPPORTED = "supported"
    CONTRADICTED = "contradicted"
    CONFIRMED = "confirmed"


class HypothesisUpdate(BaseModel):
    """A specialist's proposed update to one hypothesis."""

    statement: str
    status: HypothesisUpdateStatus

    confidence: float = Field(
        ge=0.0,
        le=1.0,
    )

    reasoning: str


class InvestigationFinding(BaseModel):
    """One important finding produced by a specialist."""

    title: str
    explanation: str


class ToolExecution(BaseModel):
    """Model-reported summary of one trusted tool used."""

    tool_name: str
    purpose: str


class TrustedToolExecution(BaseModel):
    """Backend-generated record of one trusted tool execution."""

    execution_id: UUID = Field(default_factory=uuid4)

    step_number: int = Field(ge=1)

    agent_name: str | None = None
    decision_id: UUID | None = None

    tool_name: str
    purpose: str
    reasoning: str

    arguments: dict[str, Any] = Field(
        default_factory=dict
    )

    result: Any = None

    executed_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class SpecialistAssignmentOutcome(BaseModel):
    """Durable summary of one specialist assignment."""

    decision_id: UUID
    agent_name: str
    summary: str

    confidence: float = Field(
        ge=0.0,
        le=1.0,
    )