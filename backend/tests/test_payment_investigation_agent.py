"""Tests for the PaymentInvestigationAgent."""

from typing import Any
from uuid import uuid4

import pytest

from app.agents.payment_investigation_agent import (
    PaymentInvestigationAgent,
)
from app.connectors.mock_payment_connector import (
    MockPaymentConnector,
)
from app.models import (
    Evidence,
    EvidenceConfidence,
    Investigation,
    SpecialistInvestigationResult,
    SpecialistStep,
    SpecialistStepType,
    SpecialistToolCall,
)
from app.tools.payment_tool_catalog import (
    create_payment_tool_catalog,
)
from app.tools.payment_tools import PaymentTools


class FakeModelClient:
    """Return predetermined payment-specialist steps."""

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
        """Return the next configured specialist step."""

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


def create_investigation() -> Investigation:
    """Create the payment incident used by tests."""

    return Investigation(
        workspace_id=uuid4(),
        incident_title="Settlement dashboard mismatch",
        incident_description=(
            "Processed cross-border payments are missing "
            "from downstream settlement reporting."
        ),
    )


def create_result() -> SpecialistInvestigationResult:
    """Create the structured result returned by the fake model."""

    evidence = Evidence(
        source="mock_payment_connector",
        title="Affected payment population identified",
        summary=(
            "Three processed payments failed downstream "
            "publication."
        ),
        confidence=EvidenceConfidence.HIGH,
        data={
            "affected_count": 3,
            "publication_status": "FAILED",
        },
    )

    return SpecialistInvestigationResult(
        summary=(
            "Three payments completed processing but failed "
            "downstream publication."
        ),
        confidence=0.95,
        evidence=[evidence],
    )


@pytest.mark.asyncio
async def test_payment_agent_executes_registered_tool_and_returns_result(
) -> None:
    """Payment agent executes an AI-selected trusted payment tool."""

    expected_result = create_result()

    model_client = FakeModelClient(
        [
            SpecialistStep(
                step_type=SpecialistStepType.CALL_TOOL,
                reasoning=(
                    "The affected payment population must first "
                    "be identified."
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
                    "The trusted payment search established the "
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

    result = await payment_agent.investigate(
        investigation=create_investigation(),
        objective=(
            "Identify the affected payment population and "
            "determine where processing diverged."
        ),
        evidence_needed=[
            "Affected payment identifiers",
            "Processing statuses",
            "Publication statuses",
            "Settlement statuses",
        ],
    )

    assert result == expected_result
    assert result.confidence == 0.95
    assert len(result.evidence) == 1

    assert result.evidence[0].data[
        "affected_count"
    ] == 3

    assert len(model_client.calls) == 2

    first_system_prompt = model_client.calls[0][
        "system_prompt"
    ]

    assert "Payment Investigation Specialist" in (
        first_system_prompt
    )
    assert "search_payments" in first_system_prompt

    second_user_prompt = model_client.calls[1][
        "user_prompt"
    ]

    assert "search_payments" in second_user_prompt
    assert "PAY-" in second_user_prompt


def test_payment_agent_uses_registered_name() -> None:
    """Payment specialist exposes its registry-compatible name."""

    payment_tools = PaymentTools(
        connector=MockPaymentConnector(),
    )

    tool_catalog = create_payment_tool_catalog(
        payment_tools=payment_tools,
    )

    payment_agent = PaymentInvestigationAgent(
        model_client=FakeModelClient([]),
        tool_catalog=tool_catalog,
    )

    assert payment_agent.name == (
        "payment_investigation_agent"
    )


def test_payment_agent_explains_status_filter_scope() -> None:
    """Settlement incidents should begin with discoverable records."""

    payment_agent = PaymentInvestigationAgent(
        model_client=FakeModelClient([]),
        tool_catalog=create_payment_tool_catalog(
            payment_tools=PaymentTools(
                connector=MockPaymentConnector(),
            ),
        ),
    )

    prompt = payment_agent.build_system_prompt()

    assert (
        "processing status, not settlement status"
        in prompt
    )
    assert "without a statuses filter" in prompt
