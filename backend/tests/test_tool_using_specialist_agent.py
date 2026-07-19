"""Tests for the reusable tool-using specialist loop."""

from typing import Any
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest

from app.agents.tool_using_specialist_agent import (
    SpecialistCapabilityGapError,
    ToolUsingSpecialistAgent,
)
from app.models import (
    CapabilityGap,
    Evidence,
    EvidenceConfidence,
    Investigation,
    SpecialistInvestigationResult,
    SpecialistStep,
    SpecialistStepType,
    SpecialistToolCall,
)


class FakeModelClient:
    """Return predetermined specialist steps."""

    def __init__(
        self,
        steps: list[SpecialistStep],
    ) -> None:
        self._steps = steps
        self.calls: list[dict[str, Any]] = []

    async def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        response_model: type[Any],
    ) -> SpecialistStep:
        """Return the next predetermined response."""

        self.calls.append(
            {
                "system_prompt": system_prompt,
                "user_prompt": user_prompt,
                "response_model": response_model,
            }
        )

        if not self._steps:
            raise AssertionError(
                "Fake model has no remaining responses."
            )

        return self._steps.pop(0)


class DummySpecialistAgent(ToolUsingSpecialistAgent):
    """Minimal concrete specialist used by tests."""

    @property
    def name(self) -> str:
        """Return the specialist name."""

        return "test_specialist"

    def build_system_prompt(self) -> str:
        """Return test-domain instructions."""

        return (
            "Investigate test records using only approved "
            "test tools."
        )


def create_investigation() -> Investigation:
    """Create a minimal investigation for tests."""

    return Investigation(
        workspace_id=uuid4(),
        incident_title="Test incident",
        incident_description=(
            "Several records did not reach the downstream system."
        ),
    )


def create_evidence() -> Evidence:
    """Create one specialist evidence item."""

    return Evidence(
        source="test_records",
        title="Affected records identified",
        summary="Three records failed downstream publication.",
        confidence=EvidenceConfidence.HIGH,
        data={
            "record_count": 3,
        },
    )


def create_specialist_result(
    *,
    evidence: Evidence,
    confidence: float = 0.9,
) -> SpecialistInvestigationResult:
    """Create a complete specialist result for tests."""

    return SpecialistInvestigationResult(
        summary="Three affected records were identified.",
        confidence=confidence,
        evidence=[evidence],
    )


@pytest.mark.asyncio
async def test_finishes_without_calling_tool() -> None:
    """Return the complete result when the model finishes."""

    evidence = create_evidence()

    expected_result = create_specialist_result(
        evidence=evidence,
    )

    model_client = FakeModelClient(
        [
            SpecialistStep(
                step_type=SpecialistStepType.FINISH,
                reasoning="Existing information is sufficient.",
                final_result=expected_result,
            )
        ]
    )

    tool_catalog = Mock()
    tool_catalog.build_model_catalog.return_value = (
        "No tools required."
    )
    tool_catalog.execute = AsyncMock()

    agent = DummySpecialistAgent(
        model_client=model_client,
        tool_catalog=tool_catalog,
    )

    result = await agent.investigate(
        investigation=create_investigation(),
        objective="Identify affected records.",
        evidence_needed=["Affected record count"],
    )

    assert result == expected_result
    assert result.evidence == [evidence]

    tool_catalog.execute.assert_not_awaited()
    assert len(model_client.calls) == 1


@pytest.mark.asyncio
async def test_calls_tool_then_finishes() -> None:
    """Feed a trusted tool result back to the model."""

    evidence = create_evidence()

    expected_result = create_specialist_result(
        evidence=evidence,
        confidence=0.95,
    )

    model_client = FakeModelClient(
        [
            SpecialistStep(
                step_type=SpecialistStepType.CALL_TOOL,
                reasoning=(
                    "The affected population must be established."
                ),
                tool_call=SpecialistToolCall(
                    tool_name="search_test_records",
                    arguments={
                        "status": "FAILED",
                    },
                    purpose="Identify affected records.",
                ),
            ),
            SpecialistStep(
                step_type=SpecialistStepType.FINISH,
                reasoning=(
                    "The trusted result establishes the population."
                ),
                final_result=expected_result,
            ),
        ]
    )

    tool_catalog = Mock()
    tool_catalog.build_model_catalog.return_value = (
        "search_test_records: Search test records."
    )
    tool_catalog.execute = AsyncMock(
        return_value={
            "record_count": 3,
            "record_ids": [
                "REC-1",
                "REC-2",
                "REC-3",
            ],
        }
    )

    agent = DummySpecialistAgent(
        model_client=model_client,
        tool_catalog=tool_catalog,
    )

    result = await agent.investigate(
        investigation=create_investigation(),
        objective="Identify affected records.",
        evidence_needed=["Affected record count"],
    )

    assert result == expected_result
    assert result.evidence == [evidence]

    tool_catalog.execute.assert_awaited_once_with(
        tool_name="search_test_records",
        arguments={
            "status": "FAILED",
        },
    )

    assert len(model_client.calls) == 2

    second_prompt = model_client.calls[1]["user_prompt"]

    assert "search_test_records" in second_prompt
    assert '"record_count": 3' in second_prompt
    assert "REC-1" in second_prompt


@pytest.mark.asyncio
async def test_raises_structured_capability_gap() -> None:
    """Expose the complete capability gap to the caller."""

    gap = CapabilityGap(
        name="deployment_history_lookup",
        description=(
            "Retrieve deployments preceding the incident."
        ),
        reason=(
            "No approved tool can inspect deployment history."
        ),
        required_inputs=["incident_start_time"],
        expected_outputs=["deployment_version"],
        suggested_tools=["inspect_deployment_history"],
    )

    model_client = FakeModelClient(
        [
            SpecialistStep(
                step_type=(
                    SpecialistStepType.CAPABILITY_GAP
                ),
                reasoning=(
                    "Deployment information is required."
                ),
                capability_gap=gap,
            )
        ]
    )

    tool_catalog = Mock()
    tool_catalog.build_model_catalog.return_value = (
        "search_test_records: Search test records."
    )
    tool_catalog.execute = AsyncMock()

    agent = DummySpecialistAgent(
        model_client=model_client,
        tool_catalog=tool_catalog,
    )

    with pytest.raises(
        SpecialistCapabilityGapError
    ) as exception_info:
        await agent.investigate(
            investigation=create_investigation(),
            objective="Identify the change causing failures.",
            evidence_needed=["Preceding deployment"],
        )

    error = exception_info.value

    assert error.specialist_name == "test_specialist"
    assert error.capability_gap == gap

    tool_catalog.execute.assert_not_awaited()


@pytest.mark.asyncio
async def test_stops_after_maximum_tool_steps() -> None:
    """Prevent an unbounded AI tool-execution loop."""

    repeated_step = SpecialistStep(
        step_type=SpecialistStepType.CALL_TOOL,
        reasoning="More records must be inspected.",
        tool_call=SpecialistToolCall(
            tool_name="search_test_records",
            arguments={
                "status": "FAILED",
            },
            purpose="Inspect additional records.",
        ),
    )

    model_client = FakeModelClient(
        [
            repeated_step.model_copy(deep=True)
            for _ in range(
                ToolUsingSpecialistAgent.MAX_TOOL_STEPS
            )
        ]
    )

    tool_catalog = Mock()
    tool_catalog.build_model_catalog.return_value = (
        "search_test_records: Search test records."
    )
    tool_catalog.execute = AsyncMock(
        return_value={
            "record_count": 3,
        }
    )

    agent = DummySpecialistAgent(
        model_client=model_client,
        tool_catalog=tool_catalog,
    )

    with pytest.raises(
        RuntimeError,
        match=(
            "Maximum specialist investigation "
            "steps exceeded"
        ),
    ):
        await agent.investigate(
            investigation=create_investigation(),
            objective="Identify affected records.",
            evidence_needed=["Affected record count"],
        )

    assert (
        tool_catalog.execute.await_count
        == ToolUsingSpecialistAgent.MAX_TOOL_STEPS
    )