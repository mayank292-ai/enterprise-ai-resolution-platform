"""Trusted tools available to payment-investigation agents."""

from typing import Any

from app.connectors.mock_payment_connector import (
    MockPaymentConnector,
)


class PaymentTools:
    """Expose controlled payment investigation operations."""

    def __init__(
        self,
        *,
        connector: MockPaymentConnector,
    ) -> None:
        self._connector = connector

    async def search_payments(
        self,
        *,
        statuses: list[str] | None = None,
        currencies: list[str] | None = None,
    ) -> dict[str, Any]:
        """Search payments and return a compact factual summary."""

        payments = await self._connector.search_payments(
            statuses=statuses,
            currencies=currencies,
        )

        return {
            "record_count": len(payments),
            "total_value": sum(
                payment["amount"]
                for payment in payments
            ),
            "payment_ids": [
                payment["payment_id"]
                for payment in payments
            ],
            "payments": payments,
        }

    async def inspect_payment_lifecycle(
        self,
        *,
        payment_id: str,
    ) -> dict[str, Any]:
        """Inspect the processing lifecycle of one payment."""

        lifecycle = await self._connector.get_payment_lifecycle(
            payment_id=payment_id
        )

        failed_stages = [
            event
            for event in lifecycle
            if event["status"] == "FAILED"
        ]

        return {
            "payment_id": payment_id,
            "lifecycle": lifecycle,
            "failed_stages": failed_stages,
        }

    async def inspect_settlement_status(
        self,
        *,
        payment_id: str,
    ) -> dict[str, Any]:
        """Inspect settlement and downstream publication state."""

        status = await self._connector.get_settlement_status(
            payment_id=payment_id
        )

        return {
            "payment_found": status is not None,
            "status": status,
        }

    async def compare_payment_cohorts(
        self,
        *,
        failed_publication_status: str = "FAILED",
        successful_publication_status: str = "PUBLISHED",
    ) -> dict[str, Any]:
        """Compare failed and successfully published payment cohorts."""

        result = await self._connector.search_payments()

        failed = [
            payment
            for payment in result
            if payment["publication_status"]
            == failed_publication_status
        ]
        successful = [
            payment
            for payment in result
            if payment["publication_status"]
            == successful_publication_status
        ]

        return {
            "failed_cohort": self._summarize_cohort(failed),
            "successful_cohort": self._summarize_cohort(successful),
            "observed_differences": self._find_differences(
                failed=failed,
                successful=successful,
            ),
        }

    @staticmethod
    def _summarize_cohort(
        payments: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """Return aggregate facts for one payment cohort."""

        return {
            "record_count": len(payments),
            "total_value": sum(
                payment["amount"]
                for payment in payments
            ),
            "currencies": sorted({
                payment["currency"]
                for payment in payments
            }),
            "producer_versions": sorted({
                payment["producer_version"]
                for payment in payments
            }),
            "missing_source_currency_count": sum(
                payment["source_currency"] is None
                for payment in payments
            ),
        }

    @staticmethod
    def _find_differences(
        *,
        failed: list[dict[str, Any]],
        successful: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Return factual field differences between two cohorts."""

        differences: list[dict[str, Any]] = []

        failed_versions = {
            payment["producer_version"]
            for payment in failed
        }
        successful_versions = {
            payment["producer_version"]
            for payment in successful
        }

        if failed_versions != successful_versions:
            differences.append({
                "field": "producer_version",
                "failed_values": sorted(failed_versions),
                "successful_values": sorted(successful_versions),
            })

        failed_missing_currency = sum(
            payment["source_currency"] is None
            for payment in failed
        )
        successful_missing_currency = sum(
            payment["source_currency"] is None
            for payment in successful
        )

        if failed_missing_currency != successful_missing_currency:
            differences.append({
                "field": "source_currency_missing_count",
                "failed_value": failed_missing_currency,
                "successful_value": successful_missing_currency,
            })

        return differences
