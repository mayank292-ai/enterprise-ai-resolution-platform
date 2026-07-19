"""Tests for the payment-investigation tool catalog."""

import pytest

from app.connectors.mock_payment_connector import (
    MockPaymentConnector,
)
from app.tools.payment_tool_catalog import (
    create_payment_tool_catalog,
)
from app.tools.payment_tools import PaymentTools


def create_catalog():
    """Create a payment tool catalog backed by mock data."""

    payment_tools = PaymentTools(
        connector=MockPaymentConnector()
    )

    return create_payment_tool_catalog(
        payment_tools=payment_tools
    )


def test_payment_catalog_registers_expected_tools() -> None:
    """Catalog exposes all approved payment tools."""

    catalog = create_catalog()

    assert catalog.contains("search_payments")
    assert catalog.contains("inspect_payment_lifecycle")
    assert catalog.contains("inspect_settlement_status")
    assert catalog.contains("compare_payment_cohorts")

    assert {
        definition.name
        for definition in catalog.list_definitions()
    } == {
        "search_payments",
        "inspect_payment_lifecycle",
        "inspect_settlement_status",
        "compare_payment_cohorts",
    }


def test_payment_catalog_exposes_model_definitions() -> None:
    """Catalog exposes serializable definitions for Gemini."""

    catalog = create_catalog()

    model_catalog = catalog.build_model_catalog()

    search_definition = next(
        definition
        for definition in model_catalog
        if definition["name"] == "search_payments"
    )

    assert search_definition["input_schema"][
        "additionalProperties"
    ] is False

    lifecycle_definition = next(
        definition
        for definition in model_catalog
        if definition["name"]
        == "inspect_payment_lifecycle"
    )

    assert lifecycle_definition["input_schema"][
        "required"
    ] == [
        "payment_id",
    ]


@pytest.mark.asyncio
async def test_payment_catalog_executes_search() -> None:
    """Catalog executes the real payment search tool."""

    catalog = create_catalog()

    result = await catalog.execute(
        tool_name="search_payments",
        arguments={
            "currencies": [
                "USD",
            ],
        },
    )

    assert "record_count" in result
    assert "payments" in result

    assert all(
        payment["currency"] == "USD"
        for payment in result["payments"]
    )


@pytest.mark.asyncio
async def test_payment_catalog_executes_lifecycle() -> None:
    """Catalog executes lifecycle inspection."""

    catalog = create_catalog()

    search_result = await catalog.execute(
        tool_name="search_payments",
        arguments={},
    )

    payment_id = search_result["payment_ids"][0]

    result = await catalog.execute(
        tool_name="inspect_payment_lifecycle",
        arguments={
            "payment_id": payment_id,
        },
    )

    assert result["payment_id"] == payment_id
    assert "lifecycle" in result
    assert "failed_stages" in result


@pytest.mark.asyncio
async def test_payment_catalog_executes_settlement_status() -> None:
    """Catalog executes settlement-status inspection."""

    catalog = create_catalog()

    search_result = await catalog.execute(
        tool_name="search_payments",
        arguments={},
    )

    payment_id = search_result["payment_ids"][0]

    result = await catalog.execute(
        tool_name="inspect_settlement_status",
        arguments={
            "payment_id": payment_id,
        },
    )

    assert result["payment_found"] is True
    assert result["status"] is not None


@pytest.mark.asyncio
async def test_payment_catalog_executes_cohort_comparison() -> None:
    """Catalog executes failed-versus-successful comparison."""

    catalog = create_catalog()

    result = await catalog.execute(
        tool_name="compare_payment_cohorts",
        arguments={},
    )

    assert "failed_cohort" in result
    assert "successful_cohort" in result
    assert "observed_differences" in result