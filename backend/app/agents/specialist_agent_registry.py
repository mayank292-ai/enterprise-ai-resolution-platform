"""Registry of executable specialist-agent implementations."""

from app.agents.data_contract_agent import DataContractAgent
from app.agents.model_client import StructuredModelClient
from app.agents.payment_investigation_agent import PaymentInvestigationAgent
from app.agents.pipeline_reliability_agent import PipelineReliabilityAgent
from app.agents.specialist_agent import SpecialistAgent
from app.agents.verification_agent import VerificationAgent
from app.connectors.mock_payment_connector import MockPaymentConnector
from app.connectors.mock_pipeline_connector import MockPipelineConnector
from app.connectors.mock_schema_connector import MockSchemaConnector
from app.tools.payment_tool_catalog import create_payment_tool_catalog
from app.tools.payment_tools import PaymentTools
from app.tools.pipeline_tool_catalog import create_pipeline_tool_catalog
from app.tools.pipeline_tools import PipelineTools
from app.tools.schema_tool_catalog import create_schema_tool_catalog
from app.tools.schema_tools import SchemaTools


class SpecialistAgentRegistry:
    """Stores executable specialist agents by their unique names."""

    def __init__(self) -> None:
        self._agents: dict[str, SpecialistAgent] = {}

    def register(self, agent: SpecialistAgent) -> None:
        """Register an executable specialist agent."""

        if agent.name in self._agents:
            raise ValueError(
                f"Specialist agent '{agent.name}' is already registered."
            )
        self._agents[agent.name] = agent

    def get(self, agent_name: str) -> SpecialistAgent | None:
        """Return an executable specialist by name."""

        return self._agents.get(agent_name)

    def contains(self, agent_name: str) -> bool:
        """Return whether an implementation is registered."""

        return agent_name in self._agents

    def list_names(self) -> list[str]:
        """Return the names of all executable specialists."""

        return list(self._agents)


def create_default_specialist_registry(
    *,
    model_client: StructuredModelClient,
) -> SpecialistAgentRegistry:
    """Create all permanent executable specialist implementations."""

    registry = SpecialistAgentRegistry()

    payment_tools = PaymentTools(connector=MockPaymentConnector())
    payment_catalog = create_payment_tool_catalog(payment_tools=payment_tools)

    pipeline_tools = PipelineTools(connector=MockPipelineConnector())
    pipeline_catalog = create_pipeline_tool_catalog(pipeline_tools=pipeline_tools)

    schema_tools = SchemaTools(connector=MockSchemaConnector())
    schema_catalog = create_schema_tool_catalog(schema_tools=schema_tools)

    registry.register(
        PaymentInvestigationAgent(
            model_client=model_client,
            tool_catalog=payment_catalog,
        )
    )
    registry.register(
        PipelineReliabilityAgent(
            model_client=model_client,
            tool_catalog=pipeline_catalog,
        )
    )
    registry.register(
        DataContractAgent(
            model_client=model_client,
            tool_catalog=schema_catalog,
        )
    )
    registry.register(
        VerificationAgent(
            model_client=model_client,
            tool_catalog=payment_catalog,
        )
    )
    return registry