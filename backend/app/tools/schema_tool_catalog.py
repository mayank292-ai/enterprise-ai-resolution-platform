"""Trusted tool catalog for data-contract investigations."""

from app.tools.schema_tools import SchemaTools
from app.tools.tool_catalog import ToolDefinition, TrustedToolCatalog


def create_schema_tool_catalog(*, schema_tools: SchemaTools) -> TrustedToolCatalog:
    """Create the approved schema-investigation tool catalog."""

    catalog = TrustedToolCatalog()
    catalog.register(
        definition=ToolDefinition(
            name="get_schema_definition",
            description="Retrieve the declared fields for one system and schema version.",
            input_schema={
                "type": "object",
                "properties": {"system": {"type": "string"}, "version": {"type": "string"}},
                "required": ["system", "version"],
                "additionalProperties": False,
            },
        ),
        function=schema_tools.get_schema_definition,
    )
    catalog.register(
        definition=ToolDefinition(
            name="compare_schema_versions",
            description="Compare two schema versions and identify added or removed fields.",
            input_schema={
                "type": "object",
                "properties": {
                    "system": {"type": "string"},
                    "old_version": {"type": "string"},
                    "new_version": {"type": "string"},
                },
                "required": ["system", "old_version", "new_version"],
                "additionalProperties": False,
            },
        ),
        function=schema_tools.compare_schema_versions,
    )
    catalog.register(
        definition=ToolDefinition(
            name="inspect_field_mapping",
            description="Inspect source-to-canonical field mapping rules and compatibility validation.",
            input_schema={
                "type": "object",
                "properties": {"mapping_name": {"type": "string"}, "version": {"type": "string"}},
                "required": ["mapping_name", "version"],
                "additionalProperties": False,
            },
        ),
        function=schema_tools.inspect_field_mapping,
    )
    catalog.register(
        definition=ToolDefinition(
            name="compare_source_and_canonical_record",
            description="Compare one source record with its canonical transformed representation.",
            input_schema={
                "type": "object",
                "properties": {"payment_id": {"type": "string"}},
                "required": ["payment_id"],
                "additionalProperties": False,
            },
        ),
        function=schema_tools.compare_source_and_canonical_record,
    )
    return catalog
