"""Trusted tool catalog for pipeline-reliability investigations."""

from app.tools.pipeline_tools import PipelineTools
from app.tools.tool_catalog import ToolDefinition, TrustedToolCatalog


def create_pipeline_tool_catalog(*, pipeline_tools: PipelineTools) -> TrustedToolCatalog:
    """Create the approved pipeline-investigation tool catalog."""

    catalog = TrustedToolCatalog()

    catalog.register(
        definition=ToolDefinition(
            name="search_pipeline_runs",
            description="Search orchestration runs by pipeline name or status.",
            input_schema={
                "type": "object",
                "properties": {
                    "pipeline_name": {"type": ["string", "null"]},
                    "statuses": {"type": ["array", "null"], "items": {"type": "string"}},
                },
                "additionalProperties": False,
            },
        ),
        function=pipeline_tools.search_pipeline_runs,
    )
    catalog.register(
        definition=ToolDefinition(
            name="inspect_pipeline_run",
            description="Inspect one pipeline run including all task executions.",
            input_schema={
                "type": "object",
                "properties": {"run_id": {"type": "string"}},
                "required": ["run_id"],
                "additionalProperties": False,
            },
        ),
        function=pipeline_tools.inspect_pipeline_run,
    )
    catalog.register(
        definition=ToolDefinition(
            name="inspect_task_failures",
            description="Find failed orchestration tasks for one pipeline run.",
            input_schema={
                "type": "object",
                "properties": {"run_id": {"type": "string"}},
                "required": ["run_id"],
                "additionalProperties": False,
            },
        ),
        function=pipeline_tools.inspect_task_failures,
    )
    catalog.register(
        definition=ToolDefinition(
            name="compare_expected_and_processed_records",
            description="Verify that expected, received and processed counts reconcile.",
            input_schema={
                "type": "object",
                "properties": {"run_id": {"type": "string"}},
                "required": ["run_id"],
                "additionalProperties": False,
            },
        ),
        function=pipeline_tools.compare_expected_and_processed_records,
    )
    return catalog
