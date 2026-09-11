"""Tests for the trusted agent-tool catalog."""

import pytest

from app.tools.tool_catalog import (
    ToolDefinition,
    TrustedToolCatalog,
)


def create_search_definition() -> ToolDefinition:
    """Create a sample trusted-tool definition."""

    return ToolDefinition(
        name="search_payments",
        description="Search payments using approved filters.",
        input_schema={
            "type": "object",
            "properties": {
                "status": {
                    "type": "string",
                },
            },
            "additionalProperties": False,
        },
    )


def test_catalog_registers_tool() -> None:
    """Catalog stores a trusted tool and its definition."""

    catalog = TrustedToolCatalog()

    catalog.register(
        definition=create_search_definition(),
        function=lambda status=None: {
            "status": status,
        },
    )

    assert catalog.contains("search_payments")

    assert catalog.build_model_catalog() == [
        {
            "name": "search_payments",
            "description": (
                "Search payments using approved filters."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                    },
                },
                "additionalProperties": False,
            },
        }
    ]


def test_catalog_rejects_duplicate_tool() -> None:
    """Catalog rejects duplicate trusted-tool names."""

    catalog = TrustedToolCatalog()
    definition = create_search_definition()

    catalog.register(
        definition=definition,
        function=lambda: {},
    )

    with pytest.raises(
        ValueError,
        match="is already registered",
    ):
        catalog.register(
            definition=definition,
            function=lambda: {},
        )


@pytest.mark.asyncio
async def test_catalog_executes_sync_tool() -> None:
    """Catalog executes a registered synchronous tool."""

    catalog = TrustedToolCatalog()

    catalog.register(
        definition=create_search_definition(),
        function=lambda status=None: {
            "status": status,
            "count": 3,
        },
    )

    result = await catalog.execute(
        tool_name="search_payments",
        arguments={
            "status": "failed",
        },
    )

    assert result == {
        "status": "failed",
        "count": 3,
    }


@pytest.mark.asyncio
async def test_catalog_executes_async_tool() -> None:
    """Catalog executes a registered asynchronous tool."""

    async def inspect_payment(
        payment_id: str,
    ) -> dict[str, str]:
        return {
            "payment_id": payment_id,
        }

    catalog = TrustedToolCatalog()

    catalog.register(
        definition=ToolDefinition(
            name="inspect_payment",
            description="Inspect one payment.",
            input_schema={
                "type": "object",
                "properties": {
                    "payment_id": {
                        "type": "string",
                    },
                },
                "required": [
                    "payment_id",
                ],
                "additionalProperties": False,
            },
        ),
        function=inspect_payment,
    )

    result = await catalog.execute(
        tool_name="inspect_payment",
        arguments={
            "payment_id": "PAY-001",
        },
    )

    assert result == {
        "payment_id": "PAY-001",
    }


@pytest.mark.asyncio
async def test_catalog_rejects_unknown_tool() -> None:
    """Catalog prevents execution of unapproved tools."""

    catalog = TrustedToolCatalog()

    with pytest.raises(
        ValueError,
        match="Unknown or unapproved tool",
    ):
        await catalog.execute(
            tool_name="delete_production_table",
            arguments={},
        )


@pytest.mark.asyncio
async def test_catalog_rejects_invalid_arguments() -> None:
    """Catalog rejects arguments unsupported by the tool."""

    catalog = TrustedToolCatalog()

    catalog.register(
        definition=create_search_definition(),
        function=lambda status=None: {
            "status": status,
        },
    )

    with pytest.raises(
        ValueError,
        match="Invalid arguments for tool",
    ):
        await catalog.execute(
            tool_name="search_payments",
            arguments={
                "unsupported_argument": True,
            },
        )