"""Mock enterprise connector for deployment and change history."""

from typing import Any


class MockChangeConnector:
    """Provide deterministic deployment evidence for the demo."""

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
        """Return behavioral and configuration changes in one version."""

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
                    "component": "settlement-routing",
                    "change_type": "feature_flag_enabled",
                    "feature_flag": "use_new_settlement_route",
                    "previous_value": False,
                    "new_value": True,
                    "scope": "cross_border_corporate_payments",
                },
                {
                    "component": "settlement-routing",
                    "change_type": "configuration_changed",
                    "configuration_key": "settlement_destination_queue",
                    "previous_value": "settlement-primary-v1",
                    "new_value": "settlement-next-v2",
                },
            ],
            "observed_runtime_effect": {
                "destination_queue": "settlement-next-v2",
                "queue_status": "INACTIVE",
                "acknowledgement_received": False,
                "affected_payment_versions": ["4.8.0"],
            },
            "validation_results": {
                "schema_compatibility_check_executed": True,
                "schema_compatibility_check_status": "PASSED",
                "routing_smoke_test_executed": False,
                "production_queue_readiness_check_executed": False,
            },
        }