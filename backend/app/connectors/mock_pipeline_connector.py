"""Deterministic pipeline-platform connector for local investigation demos."""

from copy import deepcopy
from typing import Any


class MockPipelineConnector:
    """Expose pipeline runs aligned with the payment incident dataset."""

    def __init__(self) -> None:
        self._runs = self._build_runs()

    async def search_runs(
        self,
        *,
        pipeline_name: str | None = None,
        statuses: list[str] | None = None,
    ) -> list[dict[str, Any]]:
        """Return pipeline runs matching optional filters."""

        runs = list(self._runs.values())

        if pipeline_name:
            runs = [
                run for run in runs
                if run["pipeline_name"] == pipeline_name
            ]

        if statuses:
            allowed = {status.upper() for status in statuses}
            runs = [run for run in runs if run["status"] in allowed]

        return deepcopy(runs)

    async def get_run(self, *, run_id: str) -> dict[str, Any] | None:
        """Return one pipeline run."""

        run = self._runs.get(run_id)
        return deepcopy(run) if run is not None else None

    async def get_task_failures(self, *, run_id: str) -> list[dict[str, Any]]:
        """Return failed tasks for a pipeline run."""

        run = self._runs.get(run_id)
        if run is None:
            return []

        return deepcopy([
            task for task in run["tasks"]
            if task["status"] == "FAILED"
        ])

    @staticmethod
    def _build_runs() -> dict[str, dict[str, Any]]:
        """Build pipeline evidence that rules out orchestration failure."""

        return {
            "RUN-PAYMENT-20260718-0800": {
                "run_id": "RUN-PAYMENT-20260718-0800",
                "pipeline_name": "cross_border_payment_publication",
                "window_start": "2026-07-18T08:00:00Z",
                "window_end": "2026-07-18T09:00:00Z",
                "status": "SUCCESS",
                "expected_records": 8,
                "received_records": 8,
                "processed_records": 8,
                "rejected_by_orchestrator": 0,
                "started_at": "2026-07-18T09:01:00Z",
                "completed_at": "2026-07-18T09:03:14Z",
                "tasks": [
                    {"task_id": "ingest_payment_events", "status": "SUCCESS", "records_out": 8},
                    {"task_id": "transform_canonical_payment", "status": "SUCCESS", "records_out": 8},
                    {"task_id": "publish_downstream", "status": "SUCCESS", "records_out": 8},
                ],
            },
            "RUN-PAYMENT-20260718-0700": {
                "run_id": "RUN-PAYMENT-20260718-0700",
                "pipeline_name": "cross_border_payment_publication",
                "window_start": "2026-07-18T07:00:00Z",
                "window_end": "2026-07-18T08:00:00Z",
                "status": "SUCCESS",
                "expected_records": 6,
                "received_records": 6,
                "processed_records": 6,
                "rejected_by_orchestrator": 0,
                "started_at": "2026-07-18T08:01:00Z",
                "completed_at": "2026-07-18T08:02:41Z",
                "tasks": [
                    {"task_id": "ingest_payment_events", "status": "SUCCESS", "records_out": 6},
                    {"task_id": "transform_canonical_payment", "status": "SUCCESS", "records_out": 6},
                    {"task_id": "publish_downstream", "status": "SUCCESS", "records_out": 6},
                ],
            },
        }
