"""Trusted tools for deployment and change analysis."""

from typing import Any

from app.connectors.mock_change_connector import (
    MockChangeConnector,
)


class ChangeAnalysisTools:
    """Expose controlled change-analysis operations."""

    def __init__(
        self,
        *,
        connector: MockChangeConnector,
    ) -> None:
        self._connector = connector

    async def get_recent_deployments(
        self,
        *,
        service_name: str,
    ) -> dict[str, Any]:
        """Return recent deployments for a service."""

        deployments = (
            await self._connector.get_recent_deployments(
                service_name=service_name,
            )
        )

        return {
            "service_name": service_name,
            "deployment_count": len(deployments),
            "deployments": deployments,
        }

    async def inspect_version_change(
        self,
        *,
        service_name: str,
        version: str,
    ) -> dict[str, Any]:
        """Inspect changes introduced by a deployed version."""

        change = await self._connector.inspect_version_change(
            service_name=service_name,
            version=version,
        )

        return {
            "change_found": change is not None,
            "change": change,
        }