"""Tests for executable specialist-agent registry."""

from typing import TypeVar

import pytest
from pydantic import BaseModel

from app.agents.payment_investigation_agent import (
    PaymentInvestigationAgent,
)
from app.agents.specialist_agent_registry import (
    SpecialistAgentRegistry,
    create_default_specialist_registry,
)
from app.connectors.mock_payment_connector import (
    MockPaymentConnector,
)
from app.tools.payment_tool_catalog import (
    create_payment_tool_catalog,
)
from app.tools.payment_tools import PaymentTools


ResponseModel = TypeVar(
    "ResponseModel",
    bound=BaseModel,
)


class FakeModelClient:
    """Model client used only for registry construction tests."""

    async def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        response_model: type[ResponseModel],
    ) -> ResponseModel:
        """Registry tests must not execute the model."""

        raise AssertionError(
            "Model execution was not expected in this test."
        )


def test_default_registry_contains_payment_agent() -> None:
    """Default executable registry includes payment specialist."""

    registry = create_default_specialist_registry(
        model_client=FakeModelClient(),
    )

    assert registry.contains(
        "payment_investigation_agent"
    )

    assert registry.get(
        "payment_investigation_agent"
    ) is not None

    assert registry.list_names() == [
        "payment_investigation_agent"
    ]


def test_registry_rejects_duplicate_agent() -> None:
    """Executable registry rejects duplicate agent names."""

    registry = SpecialistAgentRegistry()

    payment_tools = PaymentTools(
        connector=MockPaymentConnector(),
    )

    tool_catalog = create_payment_tool_catalog(
        payment_tools=payment_tools,
    )

    agent = PaymentInvestigationAgent(
        model_client=FakeModelClient(),
        tool_catalog=tool_catalog,
    )

    registry.register(agent)

    with pytest.raises(
        ValueError,
        match="is already registered",
    ):
        registry.register(agent)