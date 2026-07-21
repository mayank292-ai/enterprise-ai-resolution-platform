"""Provision approved specialist capabilities."""

from datetime import datetime, timezone

from app.agents.agent_registry import (
    AgentCapability,
    AgentRegistry,
)
from app.agents.model_client import StructuredModelClient
from app.agents.provisioned_specialist_agent import (
    ProvisionedSpecialistAgent,
)
from app.agents.specialist_agent_registry import (
    SpecialistAgentRegistry,
)
from app.connectors.mock_change_connector import (
    MockChangeConnector,
)
from app.models import (
    CapabilityGap,
    CapabilityGapStatus,
    Investigation,
    InvestigationStatus,
)
from app.tools.change_analysis_tool_catalog import (
    create_change_analysis_tool_catalog,
)
from app.tools.change_analysis_tools import ChangeAnalysisTools


class CapabilityProvisioningService:
    """Provision executable specialists from approved capability gaps."""

    def __init__(
        self,
        *,
        model_client: StructuredModelClient,
        supervisor_registry: AgentRegistry,
        specialist_registry: SpecialistAgentRegistry,
    ) -> None:
        self._model_client = model_client
        self._supervisor_registry = supervisor_registry
        self._specialist_registry = specialist_registry

    def provision(
        self,
        *,
        investigation: Investigation,
    ) -> CapabilityGap:
        """Approve and provision the pending capability gap."""

        gap = investigation.pending_capability_gap

        if gap is None:
            raise ValueError(
                "Investigation has no pending capability gap."
            )

        if (
            investigation.status
            != InvestigationStatus
            .AWAITING_CAPABILITY_APPROVAL
        ):
            raise ValueError(
                "Investigation is not awaiting capability approval."
            )

        if gap.status != CapabilityGapStatus.PROPOSED:
            raise ValueError(
                "Only a proposed capability gap can be approved."
            )

        now = datetime.now(timezone.utc)

        gap.status = CapabilityGapStatus.APPROVED
        investigation.updated_at = now

        gap.status = CapabilityGapStatus.CREATING

        self._register_capability(gap)

        gap.status = CapabilityGapStatus.READY
        gap.resolved_at = datetime.now(timezone.utc)
        investigation.updated_at = gap.resolved_at
        investigation.error_message = None

        return gap

    def _register_capability(
        self,
        gap: CapabilityGap,
    ) -> None:
        """Register supervisor metadata and executable implementation."""

        agent_name = gap.proposed_agent_name

        if not self._specialist_registry.contains(agent_name):
            tool_catalog = self._create_tool_catalog(gap)

            specialist = ProvisionedSpecialistAgent(
                agent_name=agent_name,
                description=gap.proposed_agent_description,
                missing_capability=gap.missing_capability,
                model_client=self._model_client,
                tool_catalog=tool_catalog,
            )

            self._specialist_registry.register(specialist)

        if not self._supervisor_registry.contains(agent_name):
            self._supervisor_registry.register(
                AgentCapability(
                    name=agent_name,
                    display_name=gap.title,
                    description=gap.proposed_agent_description,
                    supported_objectives=(
                        gap.resume_objective,
                    ),
                )
            )

    @staticmethod
    def _create_tool_catalog(
        gap: CapabilityGap,
    ):
        """Create approved tools for the demo capability."""

        normalized_capability = (
            f"{gap.title} "
            f"{gap.missing_capability} "
            f"{gap.proposed_agent_name}"
        ).lower()

        if not any(
            keyword in normalized_capability
            for keyword in (
                "change",
                "deployment",
                "version",
                "schema",
                "mapping",
            )
        ):
            raise ValueError(
                "The demo provisioner currently supports only "
                "change-analysis capabilities."
            )

        connector = MockChangeConnector()

        tools = ChangeAnalysisTools(
            connector=connector,
        )

        return create_change_analysis_tool_catalog(
            change_tools=tools,
        )