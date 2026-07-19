"""Mock payment-system connector used by the investigation platform."""

from copy import deepcopy
from typing import Any


class MockPaymentConnector:
    """Provide deterministic payment data for local investigation demos."""

    def __init__(self) -> None:
        self._payments = self._build_payments()

    async def search_payments(
        self,
        *,
        statuses: list[str] | None = None,
        currencies: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        """Return payments matching the supplied filters."""

        payments = list(self._payments.values())

        if statuses:
            allowed_statuses = {
                status.upper()
                for status in statuses
            }
            payments = [
                payment
                for payment in payments
                if payment["processing_status"] in allowed_statuses
            ]

        if currencies:
            allowed_currencies = {
                currency.upper()
                for currency in currencies
            }
            payments = [
                payment
                for payment in payments
                if payment["currency"] in allowed_currencies
            ]

        return deepcopy(payments)

    async def get_payment(
        self,
        *,
        payment_id: str,
    ) -> dict[str, Any] | None:
        """Return one payment by its identifier."""

        payment = self._payments.get(payment_id)

        if payment is None:
            return None

        return deepcopy(payment)

    async def get_payment_lifecycle(
        self,
        *,
        payment_id: str,
    ) -> list[dict[str, Any]]:
        """Return ordered lifecycle events for one payment."""

        payment = self._payments.get(payment_id)

        if payment is None:
            return []

        return deepcopy(payment["lifecycle"])

    async def get_settlement_status(
        self,
        *,
        payment_id: str,
    ) -> dict[str, Any] | None:
        """Return settlement and publication state for one payment."""

        payment = self._payments.get(payment_id)

        if payment is None:
            return None

        return {
            "payment_id": payment_id,
            "processing_status": payment["processing_status"],
            "settlement_status": payment["settlement_status"],
            "publication_status": payment["publication_status"],
        }

    @staticmethod
    def _build_payments() -> dict[str, dict[str, Any]]:
        """Build a small but meaningful payment investigation dataset."""

        return {
            "PAY-20260718-1042": {
                "payment_id": "PAY-20260718-1042",
                "amount": 75_000_000,
                "currency": "GBP",
                "payment_type": "CROSS_BORDER",
                "region": "UK",
                "processing_status": "COMPLETED",
                "settlement_status": "PENDING",
                "publication_status": "FAILED",
                "source_currency": None,
                "instructed_currency": "GBP",
                "producer_version": "4.8.0",
                "lifecycle": [
                    {
                        "stage": "RECEIVED",
                        "status": "COMPLETED",
                        "timestamp": "2026-07-18T08:07:00Z",
                    },
                    {
                        "stage": "VALIDATED",
                        "status": "COMPLETED",
                        "timestamp": "2026-07-18T08:07:02Z",
                    },
                    {
                        "stage": "BOOKED",
                        "status": "COMPLETED",
                        "timestamp": "2026-07-18T08:07:04Z",
                    },
                    {
                        "stage": "FX_ENRICHMENT",
                        "status": "FAILED",
                        "timestamp": "2026-07-18T08:07:05Z",
                        "reason": "sourceCurrency is missing",
                    },
                    {
                        "stage": "PUBLICATION",
                        "status": "FAILED",
                        "timestamp": "2026-07-18T08:07:06Z",
                        "reason": "Mandatory FX attributes are incomplete",
                    },
                ],
            },
            "PAY-20260718-1088": {
                "payment_id": "PAY-20260718-1088",
                "amount": 62_450_000,
                "currency": "EUR",
                "payment_type": "CROSS_BORDER",
                "region": "EU",
                "processing_status": "COMPLETED",
                "settlement_status": "PENDING",
                "publication_status": "FAILED",
                "source_currency": None,
                "instructed_currency": "EUR",
                "producer_version": "4.8.0",
                "lifecycle": [
                    {
                        "stage": "RECEIVED",
                        "status": "COMPLETED",
                        "timestamp": "2026-07-18T08:09:00Z",
                    },
                    {
                        "stage": "VALIDATED",
                        "status": "COMPLETED",
                        "timestamp": "2026-07-18T08:09:02Z",
                    },
                    {
                        "stage": "BOOKED",
                        "status": "COMPLETED",
                        "timestamp": "2026-07-18T08:09:04Z",
                    },
                    {
                        "stage": "FX_ENRICHMENT",
                        "status": "FAILED",
                        "timestamp": "2026-07-18T08:09:05Z",
                        "reason": "sourceCurrency is missing",
                    },
                    {
                        "stage": "PUBLICATION",
                        "status": "FAILED",
                        "timestamp": "2026-07-18T08:09:06Z",
                        "reason": "Mandatory FX attributes are incomplete",
                    },
                ],
            },
            "PAY-20260718-1121": {
                "payment_id": "PAY-20260718-1121",
                "amount": 45_000_000,
                "currency": "CHF",
                "payment_type": "CROSS_BORDER",
                "region": "CH",
                "processing_status": "COMPLETED",
                "settlement_status": "PENDING",
                "publication_status": "FAILED",
                "source_currency": None,
                "instructed_currency": "CHF",
                "producer_version": "4.8.0",
                "lifecycle": [
                    {
                        "stage": "RECEIVED",
                        "status": "COMPLETED",
                        "timestamp": "2026-07-18T08:11:00Z",
                    },
                    {
                        "stage": "VALIDATED",
                        "status": "COMPLETED",
                        "timestamp": "2026-07-18T08:11:02Z",
                    },
                    {
                        "stage": "BOOKED",
                        "status": "COMPLETED",
                        "timestamp": "2026-07-18T08:11:04Z",
                    },
                    {
                        "stage": "FX_ENRICHMENT",
                        "status": "FAILED",
                        "timestamp": "2026-07-18T08:11:05Z",
                        "reason": "sourceCurrency is missing",
                    },
                    {
                        "stage": "PUBLICATION",
                        "status": "FAILED",
                        "timestamp": "2026-07-18T08:11:06Z",
                        "reason": "Mandatory FX attributes are incomplete",
                    },
                ],
            },
            "PAY-20260718-1001": {
                "payment_id": "PAY-20260718-1001",
                "amount": 10_000_000,
                "currency": "GBP",
                "payment_type": "CROSS_BORDER",
                "region": "UK",
                "processing_status": "COMPLETED",
                "settlement_status": "SETTLED",
                "publication_status": "PUBLISHED",
                "source_currency": "GBP",
                "instructed_currency": "GBP",
                "producer_version": "4.7.2",
                "lifecycle": [
                    {
                        "stage": "RECEIVED",
                        "status": "COMPLETED",
                        "timestamp": "2026-07-18T07:30:00Z",
                    },
                    {
                        "stage": "VALIDATED",
                        "status": "COMPLETED",
                        "timestamp": "2026-07-18T07:30:02Z",
                    },
                    {
                        "stage": "BOOKED",
                        "status": "COMPLETED",
                        "timestamp": "2026-07-18T07:30:04Z",
                    },
                    {
                        "stage": "FX_ENRICHMENT",
                        "status": "COMPLETED",
                        "timestamp": "2026-07-18T07:30:05Z",
                    },
                    {
                        "stage": "PUBLICATION",
                        "status": "COMPLETED",
                        "timestamp": "2026-07-18T07:30:06Z",
                    },
                ],
            },
        }