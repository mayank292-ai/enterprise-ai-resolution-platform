"""Data models for enterprise incident investigations."""

from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, model_validator

from app.models.investigation_outputs import (
    HypothesisUpdate,
    InvestigationFinding,
    SpecialistAssignmentOutcome,
    TrustedToolExecution,
)

class InvestigationStatus(str, Enum):
    """Lifecycle states of an investigation."""

    CREATED = "created"
    PLANNING = "planning"
    INVESTIGATING = "investigating"
    VERIFYING = "verifying"
    AWAITING_CAPABILITY_APPROVAL = (
        "awaiting_capability_approval"
    )
    COMPLETED = "completed"
    FAILED = "failed"


class EvidenceConfidence(str, Enum):
    """Strength of an individual piece of evidence."""

    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERIFIED = "verified"


class AgentExecutionStatus(str, Enum):
    """Execution status of a specialist-agent assignment."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class SupervisorConfidence(str, Enum):
    """Confidence in the supervisor's selected next action."""

    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"


class SupervisorActionType(str, Enum):
    """Actions the supervisor may choose during an investigation."""

    DELEGATE = "delegate"
    VERIFY = "verify"
    CAPABILITY_GAP = "capability_gap"
    COMPLETE = "complete"


class CapabilityGapStatus(str, Enum):
    """Lifecycle states of a discovered capability gap."""

    PROPOSED = "proposed"
    APPROVED = "approved"
    REJECTED = "rejected"
    CREATING = "creating"
    READY = "ready"


class InvestigationRequest(BaseModel):
    """Request submitted by a user to begin an investigation."""

    workspace_id: UUID
    incident_title: str = Field(
        min_length=3,
        max_length=200,
    )
    incident_description: str = Field(
        min_length=10,
        max_length=10_000,
    )


class InvestigationClassification(BaseModel):
    """Supervisor's initial understanding of the incident."""

    category: str
    priority: str
    business_process: str
    summary: str


class Hypothesis(BaseModel):
    """A possible explanation being evaluated during an investigation."""

    hypothesis_id: UUID = Field(default_factory=uuid4)
    statement: str
    status: str = "open"
    supporting_evidence_ids: list[UUID] = Field(
        default_factory=list
    )
    contradicting_evidence_ids: list[UUID] = Field(
        default_factory=list
    )


class Evidence(BaseModel):
    """A factual result returned by an agent or tool."""

    evidence_id: UUID = Field(default_factory=uuid4)
    source: str
    title: str
    summary: str
    confidence: EvidenceConfidence
    data: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class AgentDecision(BaseModel):
    """One autonomous routing decision made by the supervisor."""

    decision_id: UUID = Field(default_factory=uuid4)

    agent_name: str
    objective: str
    reason: str

    status: AgentExecutionStatus = (
        AgentExecutionStatus.PENDING
    )

    evidence_ids: list[UUID] = Field(
        default_factory=list
    )

    tool_execution_ids: list[UUID] = Field(
        default_factory=list
    )

    started_at: datetime | None = None
    completed_at: datetime | None = None


class CapabilityGapProposal(BaseModel):
    """Capability missing from the current specialist registry."""

    title: str
    missing_capability: str
    reason: str

    proposed_agent_name: str
    proposed_agent_description: str

    required_tools: list[str] = Field(
        default_factory=list
    )

    resume_objective: str


class CapabilityGap(BaseModel):
    """Persisted capability gap awaiting human review."""

    capability_gap_id: UUID = Field(
        default_factory=uuid4
    )

    title: str
    missing_capability: str
    reason: str

    proposed_agent_name: str
    proposed_agent_description: str

    required_tools: list[str] = Field(
        default_factory=list
    )

    resume_objective: str

    status: CapabilityGapStatus = (
        CapabilityGapStatus.PROPOSED
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    resolved_at: datetime | None = None


class SupervisorAction(BaseModel):
    """Structured next action selected by the supervisor model."""

    action_type: SupervisorActionType
    agent_name: str | None = None
    objective: str | None = None
    reason: str
    confidence: SupervisorConfidence

    updated_hypotheses: list[str] = Field(
        default_factory=list
    )

    evidence_needed: list[str] = Field(
        default_factory=list
    )

    capability_gap: CapabilityGapProposal | None = None

    @model_validator(mode="after")
    def validate_action_fields(
        self,
    ) -> "SupervisorAction":
        """Validate fields required by each action type."""

        if self.action_type in {
            SupervisorActionType.DELEGATE,
            SupervisorActionType.VERIFY,
        }:
            if not self.agent_name:
                raise ValueError(
                    "agent_name is required for delegate "
                    "and verify actions."
                )

            if not self.objective:
                raise ValueError(
                    "objective is required for delegate "
                    "and verify actions."
                )

            if self.capability_gap is not None:
                raise ValueError(
                    "capability_gap must not be provided for "
                    "delegate or verify actions."
                )

        elif (
            self.action_type
            == SupervisorActionType.CAPABILITY_GAP
        ):
            if self.capability_gap is None:
                raise ValueError(
                    "capability_gap is required for a "
                    "capability-gap action."
                )

            if self.agent_name is not None:
                raise ValueError(
                    "agent_name must not be provided for a "
                    "capability-gap action."
                )

        elif (
            self.action_type
            == SupervisorActionType.COMPLETE
        ):
            if self.capability_gap is not None:
                raise ValueError(
                    "capability_gap must not be provided for "
                    "a complete action."
                )

        return self


class RootCause(BaseModel):
    """Verified root cause produced after evidence synthesis."""

    title: str
    explanation: str
    confidence: EvidenceConfidence
    evidence_ids: list[UUID] = Field(
        default_factory=list
    )


class BusinessImpact(BaseModel):
    """Quantified operational and financial impact."""

    affected_records: int = 0
    affected_value: float = 0.0
    currency: str = "USD"
    affected_systems: list[str] = Field(
        default_factory=list
    )
    earliest_occurrence: datetime | None = None


class Recommendation(BaseModel):
    """A remediation or prevention recommendation."""

    title: str
    description: str
    priority: str
    recommendation_type: str


class CapabilityOpportunity(BaseModel):
    """A capability proposed from knowledge learned during an incident."""

    title: str
    problem_detected: str
    proposed_capability: str
    expected_benefit: str


class Investigation(BaseModel):
    """Complete durable state of an enterprise investigation."""

    investigation_id: UUID = Field(
        default_factory=uuid4
    )
    workspace_id: UUID
    incident_title: str
    incident_description: str
    status: InvestigationStatus = (
        InvestigationStatus.CREATED
    )

    classification: InvestigationClassification | None = None

    hypotheses: list[Hypothesis] = Field(
        default_factory=list
    )

    agent_decisions: list[AgentDecision] = Field(
        default_factory=list
    )

    evidence: list[Evidence] = Field(
        default_factory=list
    )

    findings: list[InvestigationFinding] = Field(
        default_factory=list
    )

    hypothesis_updates: list[HypothesisUpdate] = Field(
        default_factory=list
    )

    open_questions: list[str] = Field(
        default_factory=list
    )

    specialist_recommendations: list[str] = Field(
        default_factory=list
    )

    tool_execution_trace: list[
        TrustedToolExecution
    ] = Field(
        default_factory=list
    )

    specialist_outcomes: list[
        SpecialistAssignmentOutcome
    ] = Field(
        default_factory=list
    )

    pending_capability_gap: CapabilityGap | None = None

    root_cause: RootCause | None = None
    business_impact: BusinessImpact | None = None

    recommendations: list[Recommendation] = Field(
        default_factory=list
    )

    executive_summary: list[str] = Field(
        default_factory=list
    )

    capability_opportunity: (
        CapabilityOpportunity | None
    ) = None

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    completed_at: datetime | None = None
    error_message: str | None = None