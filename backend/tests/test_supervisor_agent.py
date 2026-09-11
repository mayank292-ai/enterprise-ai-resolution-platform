"""Tests for SupervisorAgent."""

from typing import Any
from uuid import uuid4

import pytest
from pydantic import BaseModel

from app.agents import (
    SupervisorAgent,
    create_default_agent_registry,
)
from app.models import (
    Investigation,
    SupervisorAction,
    SupervisorActionType,
    SupervisorConfidence,
)


class FakeModelClient:
    """Model client returning a predefined response."""

    def __init__(
        self,
        response: SupervisorAction,
    ) -> None:
        self.response = response
        self.received_system_prompt = ""
        self.received_user_prompt = ""

    async def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        response_model: type[BaseModel],
    ) -> Any:
        self.received_system_prompt = system_prompt
        self.received_user_prompt = user_prompt

        return self.response


@pytest.mark.asyncio
async def test_supervisor_selects_registered_agent() -> None:
    """Supervisor should return a valid delegated action."""

    response = SupervisorAction(
        action_type=SupervisorActionType.DELEGATE,
        agent_name="payment_investigation_agent",
        objective=(
            "Identify the affected payment population and "
            "lifecycle divergence."
        ),
        reason=(
            "The affected population must be established first."
        ),
        confidence=SupervisorConfidence.HIGH,
        updated_hypotheses=[
            "Downstream publication may have failed."
        ],
        evidence_needed=[
            "Affected payment identifiers",
            "Payment lifecycle statuses",
        ],
    )

    model_client = FakeModelClient(response)

    supervisor = SupervisorAgent(
        model_client=model_client,
        agent_registry=create_default_agent_registry(),
    )

    investigation = Investigation(
        workspace_id=uuid4(),
        incident_title="Settlement dashboard mismatch",
        incident_description=(
            "Treasury reports that several high-value "
            "cross-border payments are missing from the "
            "settlement dashboard."
        ),
    )

    action = await supervisor.choose_next_action(
        investigation
    )

    assert action.agent_name == (
        "payment_investigation_agent"
    )
    assert action.action_type == (
        SupervisorActionType.DELEGATE
    )
    assert "Payment Investigation Agent" in (
        model_client.received_system_prompt
    )
    assert investigation.incident_title in (
        model_client.received_user_prompt
    )


@pytest.mark.asyncio
async def test_supervisor_rejects_unknown_agent() -> None:
    """Supervisor should reject an unregistered agent."""

    response = SupervisorAction(
        action_type=SupervisorActionType.DELEGATE,
        agent_name="unknown_agent",
        objective="Investigate the incident.",
        reason="The model selected an invalid capability.",
        confidence=SupervisorConfidence.LOW,
    )

    supervisor = SupervisorAgent(
        model_client=FakeModelClient(response),
        agent_registry=create_default_agent_registry(),
    )

    investigation = Investigation(
        workspace_id=uuid4(),
        incident_title="Settlement dashboard mismatch",
        incident_description=(
            "Several payments are missing from the "
            "settlement dashboard."
        ),
    )

    with pytest.raises(
        ValueError,
        match="unknown agent",
    ):
        await supervisor.choose_next_action(
            investigation
        )