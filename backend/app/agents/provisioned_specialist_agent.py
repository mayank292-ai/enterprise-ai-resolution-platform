"""Dynamically configured specialist created from an approved gap."""

from app.agents.model_client import StructuredModelClient
from app.agents.tool_using_specialist_agent import (
    ToolUsingSpecialistAgent,
)
from app.tools.tool_catalog import TrustedToolCatalog


class ProvisionedSpecialistAgent(ToolUsingSpecialistAgent):
    """Specialist configured from an approved capability proposal."""

    def __init__(
        self,
        *,
        agent_name: str,
        description: str,
        missing_capability: str,
        model_client: StructuredModelClient,
        tool_catalog: TrustedToolCatalog,
    ) -> None:
        super().__init__(
            model_client=model_client,
            tool_catalog=tool_catalog,
        )

        self._agent_name = agent_name
        self._description = description
        self._missing_capability = missing_capability

    @property
    def name(self) -> str:
        """Return the provisioned specialist name."""

        return self._agent_name

    def build_system_prompt(self) -> str:
        """Build instructions from the approved capability proposal."""

        return f"""
You are a newly provisioned enterprise specialist.

SPECIALIST NAME

{self._agent_name}

APPROVED CAPABILITY

{self._missing_capability}

DESCRIPTION

{self._description}

YOUR RESPONSIBILITY

Investigate the assigned capability gap using the approved trusted
tools. Review the evidence already collected by earlier specialists
and obtain only the additional evidence required to resolve the gap.

For deployment and change-analysis investigations:

1. Identify the service and version implicated by existing evidence.
2. Inspect deployment timing.
3. Inspect the changes introduced by the implicated version.
4. Determine whether the change explains the observed incident.
5. Clearly distinguish correlation from direct change evidence.
6. Do not confirm a deployment as the root cause unless trusted
   change-history evidence directly supports that conclusion.
7. Return findings, evidence, hypothesis updates, open questions, and
   recommendations in the final result.
8. Do not claim that the operational remediation has already occurred.
""".strip()