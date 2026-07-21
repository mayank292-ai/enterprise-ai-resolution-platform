"""Mock enterprise connector for deployment and change history."""

from typing import Any


class MockChangeConnector:
    """Provide deterministic change-history data for the demo."""

    async def get_recent_deployments(
        self,
        *,
        service_name: str,
    ) -> list[dict[str, Any]]:
        """Return recent deployments for one service."""

        if service_name != "payment-producer":
            return []

        return [
            {
                "service_name": "payment-producer",
                "previous_version": "4.7.2",
                "deployed_version": "4.8.0",
                "deployed_at": "2026-07-18T08:00:00Z",
                "deployment_status": "completed",
                "rollback_available": True,
                "change_ticket": "CHG-4821",
            }
        ]

    async def inspect_version_change(
        self,
        *,
        service_name: str,
        version: str,
    ) -> dict[str, Any] | None:
        """Return the relevant changes introduced by a version."""

        if (
            service_name != "payment-producer"
            or version != "4.8.0"
        ):
            return None

        return {
            "service_name": "payment-producer",
            "version": "4.8.0",
            "previous_version": "4.7.2",
            "change_ticket": "CHG-4821",
            "changes": [
                {
                    "component": "payment-attribute-mapping",
                    "field": "source_currency",
                    "change_type": "mapping_removed",
                    "replacement_field": "instructed_currency",
                    "downstream_contract_updated": False,
                }
            ],
            "validation_results": {
                "schema_compatibility_check_executed": False,
                "downstream_mapping_test_executed": False,
            },
        }