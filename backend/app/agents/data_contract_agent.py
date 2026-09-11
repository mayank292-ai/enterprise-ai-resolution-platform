"""AI specialist for schema and data-contract investigations."""

from app.agents.model_client import StructuredModelClient
from app.agents.tool_using_specialist_agent import ToolUsingSpecialistAgent
from app.tools.tool_catalog import TrustedToolCatalog


class DataContractAgent(ToolUsingSpecialistAgent):
    """Identify schema, contract and transformation defects."""

    def __init__(self, *, model_client: StructuredModelClient, tool_catalog: TrustedToolCatalog) -> None:
        super().__init__(model_client=model_client, tool_catalog=tool_catalog)

    @property
    def name(self) -> str:
        return "data_contract_agent"

    def build_system_prompt(self) -> str:
        return """
You are the Data Contract Specialist.

Your responsibility is to determine whether source records, canonical
schemas, and transformation mappings are compatible and whether required
attributes survive transformation.

Use only approved schema tools. Compare successful and failed examples,
schema versions, required fields, and mapping rules. Distinguish an
observed mapping defect from the operational change that introduced it.

You may conclude that a mapping is incompatible, but deployment history,
change tickets, pull requests, release manifests, and rollout ownership
belong to a Release and Change capability. Request CAPABILITY_GAP when
that evidence is needed to establish the introducing change.
""".strip()
