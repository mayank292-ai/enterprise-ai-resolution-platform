"""Trusted tool catalog for change-analysis investigations."""

from app.tools.change_analysis_tools import ChangeAnalysisTools
from app.tools.tool_catalog import (
    ToolDefinition,
    TrustedToolCatalog,
)


def create_change_analysis_tool_catalog(
    *,
    change_tools: ChangeAnalysisTools,
) -> TrustedToolCatalog:
    """Create the approved change-analysis tool catalog."""

    catalog = TrustedToolCatalog()

    catalog.register(
        definition=ToolDefinition(
            name="get_recent_deployments",
            description=(
                "Retrieve recent deployment history for an enterprise "
                "service, including versions, deployment time, change "
                "ticket, status, and rollback availability."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "service_name": {
                        "type": "string",
                        "description": (
                            "Enterprise service whose deployment "
                            "history should be inspected."
                        ),
                    },
                },
                "required": [
                    "service_name",
                ],
                "additionalProperties": False,
            },
        ),
        function=change_tools.get_recent_deployments,
    )

    catalog.register(
        definition=ToolDefinition(
            name="inspect_version_change",
            description=(
                "Inspect the code, configuration, schema, and mapping "
                "changes introduced by a particular service version."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "service_name": {
                        "type": "string",
                        "description": (
                            "Enterprise service whose version should "
                            "be inspected."
                        ),
                    },
                    "version": {
                        "type": "string",
                        "description": (
                            "Deployed version to inspect."
                        ),
                    },
                },
                "required": [
                    "service_name",
                    "version",
                ],
                "additionalProperties": False,
            },
        ),
        function=change_tools.inspect_version_change,
    )

    return catalog