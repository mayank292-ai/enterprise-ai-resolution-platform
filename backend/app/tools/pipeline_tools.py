"""Trusted tools for pipeline-reliability investigations."""

from typing import Any

from app.connectors.mock_pipeline_connector import MockPipelineConnector


class PipelineTools:
    """Expose controlled pipeline investigation operations."""

    def __init__(self, *, connector: MockPipelineConnector) -> None:
        self._connector = connector

    async def search_pipeline_runs(
        self,
        *,
        pipeline_name: str | None = None,
        statuses: list[str] | None = None,
    ) -> dict[str, Any]:
        """Search pipeline runs and summarize their health."""

        runs = await self._connector.search_runs(
            pipeline_name=pipeline_name,
            statuses=statuses,
        )
        return {"run_count": len(runs), "runs": runs}

    async def inspect_pipeline_run(self, *, run_id: str) -> dict[str, Any]:
        """Inspect one pipeline run and its task-level execution."""

        run = await self._connector.get_run(run_id=run_id)
        return {"run_found": run is not None, "run": run}

    async def inspect_task_failures(self, *, run_id: str) -> dict[str, Any]:
        """Return task failures for one run."""

        failures = await self._connector.get_task_failures(run_id=run_id)
        return {"run_id": run_id, "failure_count": len(failures), "failures": failures}

    async def compare_expected_and_processed_records(
        self,
        *,
        run_id: str,
    ) -> dict[str, Any]:
        """Compare expected, received and processed record counts."""

        run = await self._connector.get_run(run_id=run_id)
        if run is None:
            return {"run_found": False, "run_id": run_id}

        return {
            "run_found": True,
            "run_id": run_id,
            "expected_records": run["expected_records"],
            "received_records": run["received_records"],
            "processed_records": run["processed_records"],
            "record_count_match": (
                run["expected_records"]
                == run["received_records"]
                == run["processed_records"]
            ),
            "pipeline_status": run["status"],
        }
