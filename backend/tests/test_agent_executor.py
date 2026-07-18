"""Tests for AgentExecutor."""

from uuid import uuid4

import pytest

from app.agents import (
    AgentExecutor,
    SpecialistAgentRegistry,
)
from app.models import (
    AgentExecutionStatus,
    Evidence,
    EvidenceConfidence,
    Investigation,
    SupervisorAction,
    SupervisorActionType,
    SupervisorConfidence,
)


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
    ) -> list[Evidence]:
        """Return deterministic payment evidence."""

        return [
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
        ]


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

    evidence = await executor.execute(
        investigation=investigation,
        action=action,
    )

    assert len(evidence) == 1
    assert len(investigation.evidence) == 1
    assert len(investigation.agent_decisions) == 1

    decision = investigation.agent_decisions[0]

    assert decision.status == (
        AgentExecutionStatus.COMPLETED
    )
    assert decision.evidence_ids == [
        evidence[0].evidence_id
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