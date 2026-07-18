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

    def register(
        self,
        capability: AgentCapability,
    ) -> None:
        """Register one specialist-agent capability."""

        if capability.name in self._capabilities:
            raise ValueError(
                f"Agent '{capability.name}' is already registered."
            )

        self._capabilities[capability.name] = capability

    def get(
        self,
        agent_name: str,
    ) -> AgentCapability | None:
        """Return one registered capability."""

        return self._capabilities.get(agent_name)

    def list_capabilities(self) -> list[AgentCapability]:
        """Return all registered specialist capabilities."""

        return list(self._capabilities.values())

    def contains(
        self,
        agent_name: str,
    ) -> bool:
        """Check whether an agent is registered."""

        return agent_name in self._capabilities

    def build_supervisor_catalog(self) -> str:
        """Build the agent catalog supplied to the supervisor model."""

        return "\n\n".join(
            capability.to_prompt_text()
            for capability in self.list_capabilities()
        )


def create_default_agent_registry() -> AgentRegistry:
    """Create the initial specialist-agent registry."""

    registry = AgentRegistry()

    registry.register(
        AgentCapability(
            name="payment_investigation_agent",
            display_name="Payment Investigation Agent",
            description=(
                "Investigates payment lifecycle events, statuses, "
                "amounts, currencies, processing stages, and downstream "
                "publication outcomes."
            ),
            supported_objectives=(
                "Identify the affected payment population.",
                "Reconstruct the lifecycle of selected payments.",
                "Compare successful and unsuccessful payment cohorts.",
                "Inspect downstream publication and settlement states.",
            ),
        )
    )

    registry.register(
        AgentCapability(
            name="fx_investigation_agent",
            display_name="FX Investigation Agent",
            description=(
                "Investigates foreign-exchange enrichment, conversion "
                "requests, conversion inputs, rates, converted amounts, "
                "and FX processing outcomes."
            ),
            supported_objectives=(
                "Inspect conversion attempts for affected payments.",
                "Determine whether required FX inputs were available.",
                "Compare successful and failed conversion cohorts.",
                "Identify incomplete or inconsistent FX enrichment.",
            ),
        )
    )

    registry.register(
        AgentCapability(
            name="reference_data_agent",
            display_name="Reference Data Agent",
            description=(
                "Investigates currency reference data, supported currency "
                "pairs, exchange-rate availability, validity periods, and "
                "reference-data publication."
            ),
            supported_objectives=(
                "Confirm whether required exchange rates existed.",
                "Validate currency-pair support.",
                "Check reference-data validity and publication timing.",
                "Eliminate reference-data availability as a hypothesis.",
            ),
        )
    )

    registry.register(
        AgentCapability(
            name="data_quality_agent",
            display_name="Data Quality Agent",
            description=(
                "Investigates data-quality executions, failed controls, "
                "record-level exceptions, completeness issues, and "
                "failure trends."
            ),
            supported_objectives=(
                "Identify controls failed by the affected population.",
                "Inspect record-level data-quality exceptions.",
                "Compare current failures with historical baselines.",
                "Determine which validation blocked downstream processing.",
            ),
        )
    )

    registry.register(
        AgentCapability(
            name="change_analysis_agent",
            display_name="Change Analysis Agent",
            description=(
                "Investigates deployments, producer versions, schema "
                "changes, field mappings, and configuration changes."
            ),
            supported_objectives=(
                "Identify changes preceding the incident.",
                "Compare schema versions and attribute paths.",
                "Inspect mapping compatibility.",
                "Correlate deployments with the beginning of failures.",
            ),
        )
    )

    registry.register(
        AgentCapability(
            name="verification_agent",
            display_name="Verification Agent",
            description=(
                "Challenges proposed conclusions, searches for conflicting "
                "evidence, validates affected populations, and confirms "
                "whether the evidence sufficiently supports the root cause."
            ),
            supported_objectives=(
                "Search for contradictory evidence.",
                "Validate the proposed root cause.",
                "Verify impact calculations.",
                "Determine whether the investigation can be concluded.",
            ),
        )
    )

    return registry