"""Tests for AI specialist decision models."""

import pytest

from app.models import (
    SpecialistCapabilityGap,
    SpecialistStep,
    SpecialistStepType,
    SpecialistToolCall,
)


def test_call_tool_step_is_valid() -> None:
    """CALL_TOOL accepts a structured approved-tool request."""

    step = SpecialistStep(
        step_type=SpecialistStepType.CALL_TOOL,
        reasoning=(
            "The affected payment population must be "
            "identified first."
        ),
        tool_call=SpecialistToolCall(
            tool_name="search_payments",
            arguments={},
            purpose=(
                "Identify payments with failed publication."
            ),
        ),
    )

    step.validate_selected_payload()

    assert step.tool_call is not None
    assert step.tool_call.tool_name == "search_payments"


def test_call_tool_requires_tool_call() -> None:
    """CALL_TOOL fails when no tool request is supplied."""

    step = SpecialistStep(
        step_type=SpecialistStepType.CALL_TOOL,
        reasoning="A tool is required.",
    )

    with pytest.raises(
        ValueError,
        match="CALL_TOOL requires tool_call",
    ):
        step.validate_selected_payload()


def test_capability_gap_step_is_valid() -> None:
    """Specialist can report a structured capability gap."""

    step = SpecialistStep(
        step_type=SpecialistStepType.CAPABILITY_GAP,
        reasoning=(
            "Current payment tools cannot verify a "
            "producer-schema change."
        ),
        capability_gap=SpecialistCapabilityGap(
            name="schema_compatibility_analysis",
            description=(
                "Compare producer schemas between versions."
            ),
            reason=(
                "The current evidence only establishes "
                "correlation with a producer version."
            ),
            required_inputs=[
                "baseline schema",
                "current schema",
            ],
            expected_outputs=[
                "removed fields",
                "renamed fields",
                "compatibility risks",
            ],
            suggested_tools=[
                "fetch_schema",
                "compare_schemas",
            ],
        ),
    )

    step.validate_selected_payload()

    assert step.capability_gap is not None
    assert step.capability_gap.name == (
        "schema_compatibility_analysis"
    )


def test_capability_gap_requires_gap_details() -> None:
    """CAPABILITY_GAP fails without a structured gap."""

    step = SpecialistStep(
        step_type=SpecialistStepType.CAPABILITY_GAP,
        reasoning="A missing capability was identified.",
    )

    with pytest.raises(
        ValueError,
        match=(
            "CAPABILITY_GAP requires capability_gap"
        ),
    ):
        step.validate_selected_payload()
