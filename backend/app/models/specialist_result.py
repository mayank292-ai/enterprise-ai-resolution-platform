"""Models returned by executable specialist agents."""

from pydantic import BaseModel, Field

from app.models.investigation import Evidence
from app.models.investigation_outputs import (
    HypothesisUpdate,
    InvestigationFinding,
    ToolExecution,
    TrustedToolExecution,
)


class SpecialistInvestigationResult(BaseModel):
    """Structured result returned by an executable specialist agent."""

    summary: str

    confidence: float = Field(
        ge=0.0,
        le=1.0,
    )

    findings: list[InvestigationFinding] = Field(
        default_factory=list
    )

    evidence: list[Evidence] = Field(
        default_factory=list
    )

    hypothesis_updates: list[HypothesisUpdate] = Field(
        default_factory=list
    )

    open_questions: list[str] = Field(
        default_factory=list
    )

    recommendations: list[str] = Field(
        default_factory=list
    )

    tools_used: list[ToolExecution] = Field(
        default_factory=list
    )

    execution_trace: list[TrustedToolExecution] = Field(
        default_factory=list
    )