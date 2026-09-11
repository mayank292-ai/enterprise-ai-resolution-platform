"""AI specialist for pipeline reliability investigations."""

from app.agents.model_client import StructuredModelClient
from app.agents.tool_using_specialist_agent import ToolUsingSpecialistAgent
from app.tools.tool_catalog import TrustedToolCatalog


class PipelineReliabilityAgent(ToolUsingSpecialistAgent):
    """Determine whether orchestration or data movement failed."""

    def __init__(self, *, model_client: StructuredModelClient, tool_catalog: TrustedToolCatalog) -> None:
        super().__init__(model_client=model_client, tool_catalog=tool_catalog)

    @property
    def name(self) -> str:
        return "pipeline_reliability_agent"

    def build_system_prompt(self) -> str:
        return """
You are the Pipeline Reliability Specialist.

Your responsibility is to determine whether ingestion, orchestration,
transformation execution, or data movement failed during the incident.

Use only approved pipeline tools. Check run status, task failures,
processing windows, retries, and record-count reconciliation.

A successful pipeline run proves execution health, not semantic data
correctness. Do not claim that successful tasks prove transformed fields
were correct. When orchestration is healthy, clearly rule it out and
recommend investigation of data contracts or application behavior.

Return CAPABILITY_GAP when required pipeline evidence cannot be accessed.
""".strip()
