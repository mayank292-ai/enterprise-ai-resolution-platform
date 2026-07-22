"""Trusted tools for data-contract investigations."""

from typing import Any

from app.connectors.mock_schema_connector import MockSchemaConnector


class SchemaTools:
    """Expose controlled schema and mapping operations."""

    def __init__(self, *, connector: MockSchemaConnector) -> None:
        self._connector = connector

    async def get_schema_definition(self, *, system: str, version: str) -> dict[str, Any]:
        schema = await self._connector.get_schema(system=system, version=version)
        return {"schema_found": schema is not None, "schema": schema}

    async def compare_schema_versions(
        self,
        *,
        system: str,
        old_version: str,
        new_version: str,
    ) -> dict[str, Any]:
        return await self._connector.compare_schema_versions(
            system=system,
            old_version=old_version,
            new_version=new_version,
        )

    async def inspect_field_mapping(
        self,
        *,
        mapping_name: str,
        version: str,
    ) -> dict[str, Any]:
        mapping = await self._connector.inspect_mapping(
            mapping_name=mapping_name,
            version=version,
        )
        return {"mapping_found": mapping is not None, "mapping": mapping}

    async def compare_source_and_canonical_record(self, *, payment_id: str) -> dict[str, Any]:
        comparison = await self._connector.compare_source_and_canonical_record(
            payment_id=payment_id
        )
        return {"record_found": comparison is not None, "comparison": comparison}
