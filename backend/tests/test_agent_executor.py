"""Tests for AgentExecutor."""

from uuid import uuid4
from typing import Any

import pytest

from app.agents import (
    AgentExecutor,
    SpecialistAgentRegistry,
)
from app.models import (
    AgentExecutionStatus,
    Evidence,
    EvidenceConfidence,
    HypothesisUpdate,
    HypothesisUpdateStatus,
    Investigation,
    SpecialistInvestigationResult,
    SpecialistStep,
    SpecialistStepType,
    SpecialistToolCall,
    SupervisorAction,
    SupervisorActionType,
    SupervisorConfidence,
)
from app.tools.payment_tool_catalog import (
    create_payment_tool_catalog,
)
from app.agents.payment_investigation_agent import (
    PaymentInvestigationAgent,
)
from app.connectors.mock_payment_connector import (
    MockPaymentConnector,
)
from app.tools.payment_tools import PaymentTools


class FakePaymentAgent:
    """Fake payment specialist used only for unit testing."""

    @property
    def name(self) -> str:
        """Return the specialist's registered name."""

        return "payment_investigation_agent"

    async def investigate(
        self,
        *,
        investigation: Investigation,
        objective: str,
        evidence_needed: list[str],
    ) -> SpecialistInvestigationResult:
        """Return deterministic payment evidence."""

        return SpecialistInvestigationResult(
            summary="Affected payment population identified.",
            confidence=1.0,
            evidence=[
                Evidence(
                    source="fake_payment_system",
                    title=(
                        "Affected payment population identified"
                    ),
                    summary=(
                        "Three payments failed downstream "
                        "publication."
                    ),
                    confidence=EvidenceConfidence.HIGH,
                    data={
                        "affected_count": 3,
                        "objective": objective,
                        "evidence_needed": evidence_needed,
                    },
                )
            ],
        )


class FakeModelClient:
    """Return predetermined specialist steps."""

    def __init__(
        self,
        steps: list[SpecialistStep],
    ) -> None:
        self._steps = steps
        self.calls: list[dict[str, Any]] = []

    async def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        response_model: type[Any],
    ) -> SpecialistStep:
        """Return the next predetermined model response."""

        self.calls.append(
            {
                "system_prompt": system_prompt,
                "user_prompt": user_prompt,
                "response_model": response_model,
            }
        )

        if not self._steps:
            raise AssertionError(
                "Fake model has no remaining responses."
            )

        return self._steps.pop(0)

@pytest.mark.asyncio
async def test_executor_runs_registered_specialist() -> None:
    """Executor runs a specialist and stores its evidence."""

    registry = SpecialistAgentRegistry()
    registry.register(FakePaymentAgent())

    executor = AgentExecutor(
        specialist_registry=registry
    )

    investigation = Investigation(
        workspace_id=uuid4(),
        incident_title="Settlement mismatch",
        incident_description=(
            "Several processed payments are missing "
            "from downstream settlement reporting."
        ),
    )

    action = SupervisorAction(
        action_type=SupervisorActionType.DELEGATE,
        agent_name="payment_investigation_agent",
        objective=(
            "Identify the affected payment population."
        ),
        reason=(
            "The affected population must be established."
        ),
        confidence=SupervisorConfidence.HIGH,
        evidence_needed=[
            "Affected payment identifiers",
            "Publication statuses",
        ],
    )

    result = await executor.execute(
        investigation=investigation,
        action=action,
    )

    assert len(result.evidence) == 1
    assert len(investigation.evidence) == 1
    assert len(investigation.agent_decisions) == 1

    decision = investigation.agent_decisions[0]

    assert decision.status == (
        AgentExecutionStatus.COMPLETED
    )
    assert decision.evidence_ids == [
        result.evidence[0].evidence_id
    ]


@pytest.mark.asyncio
async def test_executor_rejects_missing_specialist() -> None:
    """Executor rejects an agent with no implementation."""

    executor = AgentExecutor(
        specialist_registry=SpecialistAgentRegistry()
    )

    investigation = Investigation(
        workspace_id=uuid4(),
        incident_title="Settlement mismatch",
        incident_description=(
            "Several processed payments are missing "
            "from downstream settlement reporting."
        ),
    )

    action = SupervisorAction(
        action_type=SupervisorActionType.DELEGATE,
        agent_name="payment_investigation_agent",
        objective="Identify affected payments.",
        reason="Payment evidence is required.",
        confidence=SupervisorConfidence.HIGH,
    )

    with pytest.raises(
        ValueError,
        match="No executable implementation",
    ):
        await executor.execute(
            investigation=investigation,
            action=action,
        )
@pytest.mark.asyncio
async def test_executor_runs_payment_investigation_agent() -> None:
    """Executor runs the AI-powered payment specialist."""

    evidence = Evidence(
        source="mock_payment_connector",
        title="Affected payment population identified",
        summary=(
            "Three payments failed downstream publication."
        ),
        confidence=EvidenceConfidence.HIGH,
        data={
            "affected_count": 3,
            "publication_status": "FAILED",
        },
    )

    expected_result = SpecialistInvestigationResult(
        summary=(
            "Three processed payments failed downstream "
            "publication."
        ),
        confidence=1.0,
        evidence=[evidence],
        hypothesis_updates=[
            HypothesisUpdate(
                statement=(
                    "Producer version 4.8.0 caused the "
                    "publication failures."
                ),
                status=HypothesisUpdateStatus.CONFIRMED,
                confidence=1.0,
                reasoning=(
                    "The failed cohort used version 4.8.0 "
                    "and had missing source currency values."
                ),
            )
        ],
    )

    model_client = FakeModelClient(
        [
            SpecialistStep(
                step_type=SpecialistStepType.CALL_TOOL,
                reasoning=(
                    "The affected payment population must be "
                    "identified."
                ),
                tool_call=SpecialistToolCall(
                    tool_name="search_payments",
                    arguments={},
                    purpose=(
                        "Retrieve the payment population for investigation."
                    ),
                ),
            ),
            SpecialistStep(
                step_type=SpecialistStepType.FINISH,
                reasoning=(
                    "The trusted search result establishes the "
                    "affected population."
                ),
                final_result=expected_result,
            ),
        ]
    )

    payment_tools = PaymentTools(
        connector=MockPaymentConnector(),
    )

    tool_catalog = create_payment_tool_catalog(
        payment_tools=payment_tools,
    )

    payment_agent = PaymentInvestigationAgent(
        model_client=model_client,
        tool_catalog=tool_catalog,
    )

    specialist_registry = SpecialistAgentRegistry()
    specialist_registry.register(payment_agent)

    executor = AgentExecutor(
        specialist_registry=specialist_registry,
    )

    investigation = Investigation(
        workspace_id=uuid4(),
        incident_title="Settlement dashboard mismatch",
        incident_description=(
            "Processed cross-border payments are missing "
            "from downstream settlement reporting."
        ),
    )

    action = SupervisorAction(
        action_type=SupervisorActionType.DELEGATE,
        agent_name="payment_investigation_agent",
        objective=(
            "Identify the affected payment population and "
            "determine where processing diverged."
        ),
        reason=(
            "The affected population and lifecycle divergence "
            "must be established first."
        ),
        evidence_needed=[
            "Affected payment identifiers",
            "Processing statuses",
            "Publication statuses",
            "Settlement statuses",
        ],
        confidence=SupervisorConfidence.HIGH,
    )

    result = await executor.execute(
        investigation=investigation,
        action=action,
        )

    assert result.confidence == 1.0
    assert len(result.evidence) == 1
    assert len(result.execution_trace) == 1

    stored_evidence = result.evidence[0]

    assert stored_evidence.source == evidence.source
    assert stored_evidence.title == evidence.title
    assert stored_evidence.summary == evidence.summary
    assert stored_evidence.confidence == evidence.confidence
    assert stored_evidence.data == evidence.data

    assert stored_evidence.evidence_id != evidence.evidence_id
    assert stored_evidence.created_at != evidence.created_at

    assert len(investigation.evidence) == 1
    assert investigation.evidence[0] == stored_evidence

    assert len(investigation.agent_decisions) == 1

    decision = investigation.agent_decisions[0]

    assert decision.agent_name == (
        "payment_investigation_agent"
    )
    assert decision.status == (
        AgentExecutionStatus.COMPLETED
    )
    assert decision.completed_at is not None

    assert decision.evidence_ids == [
        stored_evidence.evidence_id
    ]

    assert len(investigation.hypothesis_updates) == 1

    persisted_update = (
        investigation.hypothesis_updates[0]
    )

    assert persisted_update.status == (
        HypothesisUpdateStatus.SUPPORTED
    )
    assert persisted_update.confidence == 0.95
    assert (
        "independently verified"
        in persisted_update.reasoning
    )

    assert len(investigation.specialist_outcomes) == 1

    outcome = investigation.specialist_outcomes[0]

    assert outcome.decision_id == decision.decision_id
    assert outcome.agent_name == (
        "payment_investigation_agent"
    )
    assert outcome.summary == expected_result.summary

    # Non-verification specialist confidence is capped.
    assert outcome.confidence == 0.95

    # Raw specialist result remains unchanged.
    assert result.confidence == 1.0

    assert len(investigation.tool_execution_trace) == 1

    execution = investigation.tool_execution_trace[0]

    assert execution.decision_id == decision.decision_id
    assert execution.agent_name == (
        "payment_investigation_agent"
    )
    assert execution.tool_name == "search_payments"
    assert execution.arguments == {}

    assert decision.tool_execution_ids == [
        execution.execution_id
    ]

    assert len(model_client.calls) == 2

    second_prompt = model_client.calls[1][
        "user_prompt"
    ]

    assert "search_payments" in second_prompt
    assert "PAY-" in second_prompt