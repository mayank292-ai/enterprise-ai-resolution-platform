"""Registry of specialist agents available to the supervisor."""

from dataclasses import dataclass


@dataclass(frozen=True)
class AgentCapability:
    """Description of one specialist agent and its capabilities."""

    name: str
    display_name: str
    description: str
    supported_objectives: tuple[str, ...]

    def to_prompt_text(self) -> str:
        """Return a concise capability description for the supervisor."""

        objectives = "\n".join(
            f"  - {objective}"
            for objective in self.supported_objectives
        )
        return (
            f"Agent name: {self.name}\n"
            f"Display name: {self.display_name}\n"
            f"Description: {self.description}\n"
            f"Supported objectives:\n{objectives}"
        )


class AgentRegistry:
    """Stores the specialist agents available within a workspace."""

    def __init__(self) -> None:
        self._capabilities: dict[str, AgentCapability] = {}

    def register(self, capability: AgentCapability) -> None:
        """Register one specialist-agent capability."""

        if capability.name in self._capabilities:
            raise ValueError(
                f"Agent '{capability.name}' is already registered."
            )
        self._capabilities[capability.name] = capability

    def get(self, agent_name: str) -> AgentCapability | None:
        """Return one registered capability."""

        return self._capabilities.get(agent_name)

    def list_capabilities(self) -> list[AgentCapability]:
        """Return all registered specialist capabilities."""

        return list(self._capabilities.values())

    def contains(self, agent_name: str) -> bool:
        """Check whether an agent is registered."""

        return agent_name in self._capabilities

    def build_supervisor_catalog(self) -> str:
        """Build the agent catalog supplied to the supervisor model."""

        return "\n\n".join(
            capability.to_prompt_text()
            for capability in self.list_capabilities()
        )


def create_default_agent_registry() -> AgentRegistry:
    """Create the registry of executable permanent specialists."""

    registry = AgentRegistry()
    registry.register(
        AgentCapability(
            name="payment_investigation_agent",
            display_name="Payment Investigation Agent",
            description=(
                "Scopes affected payments, reconstructs lifecycle behavior, "
                "and compares successful and unsuccessful cohorts."
            ),
            supported_objectives=(
                "Identify the affected payment population.",
                "Reconstruct representative payment lifecycles.",
                "Compare successful and unsuccessful cohorts.",
                "Assess payment value, currency and downstream impact.",
            ),
        )
    )
    registry.register(
        AgentCapability(
            name="pipeline_reliability_agent",
            display_name="Pipeline Reliability Agent",
            description=(
                "Investigates orchestration, ingestion, transformation "
                "execution, task failures and record-count reconciliation."
            ),
            supported_objectives=(
                "Determine whether pipeline execution failed.",
                "Inspect run and task health.",
                "Reconcile expected, received and processed counts.",
                "Rule orchestration or data movement in or out.",
            ),
        )
    )
    registry.register(
        AgentCapability(
            name="data_contract_agent",
            display_name="Data Contract Agent",
            description=(
                "Investigates source schemas, canonical contracts, required "
                "fields, field mappings and transformed records."
            ),
            supported_objectives=(
                "Compare source and canonical schema versions.",
                "Inspect source-to-canonical field mappings.",
                "Identify missing required attributes after transformation.",
                "Establish whether a data-contract defect exists.",
            ),
        )
    )
    registry.register(
        AgentCapability(
            name="verification_agent",
            display_name="Verification Agent",
            description=(
                "Challenges proposed conclusions, searches for conflicting "
                "evidence and validates whether root cause is supported."
            ),
            supported_objectives=(
                "Search for contradictory evidence.",
                "Validate the proposed root cause.",
                "Verify impact calculations.",
                "Determine whether the investigation can conclude.",
            ),
        )
    )
    return registry
