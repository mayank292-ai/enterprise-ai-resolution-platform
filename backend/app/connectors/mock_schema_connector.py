"""Deterministic schema and data-contract connector for local demos."""

from copy import deepcopy
from typing import Any


class MockSchemaConnector:
    """Expose source schemas, canonical contracts and field mappings."""

    def __init__(self) -> None:
        self._schemas = self._build_schemas()
        self._mappings = self._build_mappings()
        self._samples = self._build_samples()

    async def get_schema(
        self,
        *,
        system: str,
        version: str,
    ) -> dict[str, Any] | None:
        """Return one schema definition."""

        schema = self._schemas.get((system, version))
        return deepcopy(schema) if schema is not None else None

    async def compare_schema_versions(
        self,
        *,
        system: str,
        old_version: str,
        new_version: str,
    ) -> dict[str, Any]:
        """Compare fields between two schema versions."""

        old = self._schemas.get((system, old_version))
        new = self._schemas.get((system, new_version))

        if old is None or new is None:
            return {"schemas_found": False}

        old_fields = set(old["fields"])
        new_fields = set(new["fields"])

        return {
            "schemas_found": True,
            "system": system,
            "old_version": old_version,
            "new_version": new_version,
            "added_fields": sorted(new_fields - old_fields),
            "removed_fields": sorted(old_fields - new_fields),
            "common_fields": sorted(old_fields & new_fields),
        }

    async def inspect_mapping(
        self,
        *,
        mapping_name: str,
        version: str,
    ) -> dict[str, Any] | None:
        """Return one mapping definition and validation result."""

        mapping = self._mappings.get((mapping_name, version))
        return deepcopy(mapping) if mapping is not None else None

    async def compare_source_and_canonical_record(
        self,
        *,
        payment_id: str,
    ) -> dict[str, Any] | None:
        """Compare source and canonical values for one payment."""

        sample = self._samples.get(payment_id)
        return deepcopy(sample) if sample is not None else None

    @staticmethod
    def _build_schemas() -> dict[tuple[str, str], dict[str, Any]]:
        """Build compatible producer and canonical schemas."""

        common_fields = {
            "paymentId": {"type": "string", "required": True},
            "sourceCurrency": {"type": "string", "required": True},
            "instructedCurrency": {"type": "string", "required": True},
            "amount": {"type": "number", "required": True},
        }

        return {
            ("payment_producer", "4.7.2"): {
                "system": "payment_producer",
                "version": "4.7.2",
                "fields": deepcopy(common_fields),
            },
            ("payment_producer", "4.8.0"): {
                "system": "payment_producer",
                "version": "4.8.0",
                "fields": deepcopy(common_fields),
            },
            ("canonical_payment", "3.2"): {
                "system": "canonical_payment",
                "version": "3.2",
                "fields": deepcopy(common_fields),
            },
        }

    @staticmethod
    def _build_mappings() -> dict[tuple[str, str], dict[str, Any]]:
        """Build mappings that rule out a contract transformation defect."""

        rules = {
            "paymentId": "paymentId",
            "sourceCurrency": "sourceCurrency",
            "instructedCurrency": "instructedCurrency",
            "amount": "amount",
        }

        return {
            ("producer_to_canonical", "4.7.2"): {
                "mapping_name": "producer_to_canonical",
                "version": "4.7.2",
                "rules": deepcopy(rules),
                "validation": {
                    "status": "VALID",
                    "unresolved_source_paths": [],
                },
            },
            ("producer_to_canonical", "4.8.0"): {
                "mapping_name": "producer_to_canonical",
                "version": "4.8.0",
                "rules": deepcopy(rules),
                "validation": {
                    "status": "VALID",
                    "unresolved_source_paths": [],
                },
            },
        }

    @staticmethod
    def _build_samples() -> dict[str, dict[str, Any]]:
        """Build valid source-to-canonical record comparisons."""

        return {
            "PAY-20260718-1042": {
                "payment_id": "PAY-20260718-1042",
                "producer_version": "4.8.0",
                "source_record": {
                    "paymentId": "PAY-20260718-1042",
                    "sourceCurrency": "GBP",
                    "instructedCurrency": "GBP",
                    "amount": 75_000_000,
                },
                "canonical_record": {
                    "paymentId": "PAY-20260718-1042",
                    "sourceCurrency": "GBP",
                    "instructedCurrency": "GBP",
                    "amount": 75_000_000,
                },
                "contract_violations": [],
            },
            "PAY-20260718-1088": {
                "payment_id": "PAY-20260718-1088",
                "producer_version": "4.8.0",
                "source_record": {
                    "paymentId": "PAY-20260718-1088",
                    "sourceCurrency": "EUR",
                    "instructedCurrency": "EUR",
                    "amount": 62_450_000,
                },
                "canonical_record": {
                    "paymentId": "PAY-20260718-1088",
                    "sourceCurrency": "EUR",
                    "instructedCurrency": "EUR",
                    "amount": 62_450_000,
                },
                "contract_violations": [],
            },
            "PAY-20260718-1121": {
                "payment_id": "PAY-20260718-1121",
                "producer_version": "4.8.0",
                "source_record": {
                    "paymentId": "PAY-20260718-1121",
                    "sourceCurrency": "CHF",
                    "instructedCurrency": "CHF",
                    "amount": 45_000_000,
                },
                "canonical_record": {
                    "paymentId": "PAY-20260718-1121",
                    "sourceCurrency": "CHF",
                    "instructedCurrency": "CHF",
                    "amount": 45_000_000,
                },
                "contract_violations": [],
            },
            "PAY-20260718-1001": {
                "payment_id": "PAY-20260718-1001",
                "producer_version": "4.7.2",
                "source_record": {
                    "paymentId": "PAY-20260718-1001",
                    "sourceCurrency": "GBP",
                    "instructedCurrency": "GBP",
                    "amount": 10_000_000,
                },
                "canonical_record": {
                    "paymentId": "PAY-20260718-1001",
                    "sourceCurrency": "GBP",
                    "instructedCurrency": "GBP",
                    "amount": 10_000_000,
                },
                "contract_violations": [],
            },
        }
