"""Registry of executable specialist-agent implementations."""

from app.agents.model_client import StructuredModelClient
from app.agents.payment_investigation_agent import (
    PaymentInvestigationAgent,
)
from app.agents.verification_agent import VerificationAgent
from app.agents.specialist_agent import SpecialistAgent
from app.connectors.mock_payment_connector import (
    MockPaymentConnector,
)
from app.tools.payment_tool_catalog import (
    create_payment_tool_catalog,
)
from app.tools.payment_tools import PaymentTools


class SpecialistAgentRegistry:
    """Stores executable specialist agents by their unique names."""

    def __init__(self) -> None:
        self._agents: dict[str, SpecialistAgent] = {}

    def register(
        self,
        agent: SpecialistAgent,
    ) -> None:
        """Register an executable specialist agent."""

        if agent.name in self._agents:
            raise ValueError(
                f"Specialist agent '{agent.name}' "
                "is already registered."
            )

        self._agents[agent.name] = agent

    def get(
        self,
        agent_name: str,
    ) -> SpecialistAgent | None:
        """Return an executable specialist by name."""

        return self._agents.get(agent_name)

    def contains(
        self,
        agent_name: str,
    ) -> bool:
        """Return whether an implementation is registered."""

        return agent_name in self._agents

    def list_names(self) -> list[str]:
        """Return the names of all executable specialists."""

        return list(self._agents)


def create_default_specialist_registry(
    *,
    model_client: StructuredModelClient,
) -> SpecialistAgentRegistry:
    """Create executable specialist implementations."""

    registry = SpecialistAgentRegistry()

    payment_connector = MockPaymentConnector()

    payment_tools = PaymentTools(
        connector=payment_connector,
    )

    payment_tool_catalog = create_payment_tool_catalog(
        payment_tools=payment_tools,
    )

    registry.register(
        PaymentInvestigationAgent(
            model_client=model_client,
            tool_catalog=payment_tool_catalog,
        )
    )

    registry.register(
        VerificationAgent(
            model_client=model_client,
            tool_catalog=payment_tool_catalog,
        )
    )

    return registry