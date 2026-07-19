"""Models used by an AI specialist during an investigation."""

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

from app.models.specialist_result import (
    SpecialistInvestigationResult,
)


class SpecialistStepType(str, Enum):
    """Actions an AI specialist may select."""

    CALL_TOOL = "call_tool"
    FINISH = "finish"
    CAPABILITY_GAP = "capability_gap"


class SpecialistToolCall(BaseModel):
    """Request to execute one approved trusted tool."""

    tool_name: str
    arguments: dict[str, Any] = Field(
        default_factory=dict
    )
    purpose: str


class CapabilityGap(BaseModel):
    """A capability missing from the approved registry."""

    name: str
    description: str
    reason: str
    required_inputs: list[str] = Field(
        default_factory=list
    )
    expected_outputs: list[str] = Field(
        default_factory=list
    )
    suggested_tools: list[str] = Field(
        default_factory=list
    )


class SpecialistStep(BaseModel):
    """One structured decision produced by a specialist model."""

    step_type: SpecialistStepType
    reasoning: str

    tool_call: SpecialistToolCall | None = None

    final_result: SpecialistInvestigationResult | None = None

    capability_gap: CapabilityGap | None = None

    def validate_selected_payload(self) -> None:
        """Validate the payload required for the selected step."""

        if (
            self.step_type == SpecialistStepType.CALL_TOOL
            and self.tool_call is None
        ):
            raise ValueError(
                "CALL_TOOL requires tool_call."
            )

        if (
            self.step_type == SpecialistStepType.FINISH
            and self.final_result is None
        ):
            raise ValueError(
                "FINISH requires final_result."
            )

        if (
            self.step_type
            == SpecialistStepType.CAPABILITY_GAP
            and self.capability_gap is None
        ):
            raise ValueError(
                "CAPABILITY_GAP requires capability_gap."
            )