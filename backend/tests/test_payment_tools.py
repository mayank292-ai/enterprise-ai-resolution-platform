"""Tests for trusted payment investigation tools."""

import pytest

from app.connectors.mock_payment_connector import (
    MockPaymentConnector,
)
from app.tools.payment_tools import PaymentTools


@pytest.fixture
def payment_tools() -> PaymentTools:
    """Create payment tools backed by deterministic mock data."""

    return PaymentTools(
        connector=MockPaymentConnector()
    )


@pytest.mark.asyncio
async def test_search_payments(
    payment_tools: PaymentTools,
) -> None:
    """Search should return the complete mock payment population."""

    result = await payment_tools.search_payments()

    assert result["record_count"] == 4
    assert result["total_value"] == 192_450_000


@pytest.mark.asyncio
async def test_inspect_failed_payment_lifecycle(
    payment_tools: PaymentTools,
) -> None:
    """Lifecycle inspection should expose failed processing stages."""

    result = await payment_tools.inspect_payment_lifecycle(
        payment_id="PAY-20260718-1042"
    )

    assert len(result["failed_stages"]) == 1
    assert result["failed_stages"][0]["stage"] == "PUBLICATION"


@pytest.mark.asyncio
async def test_compare_payment_cohorts(
    payment_tools: PaymentTools,
) -> None:
    """Cohort comparison should identify factual differences."""

    result = await payment_tools.compare_payment_cohorts()

    assert result["failed_cohort"]["record_count"] == 3
    assert result["successful_cohort"]["record_count"] == 1

    difference_fields = {
        difference["field"]
        for difference in result["observed_differences"]
    }

    assert "producer_version" in difference_fields
