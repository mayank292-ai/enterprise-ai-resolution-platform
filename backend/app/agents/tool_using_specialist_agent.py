"""Reusable base class for AI specialists using trusted tools."""

import json
from abc import ABC, abstractmethod
from typing import Any

from app.agents.model_client import StructuredModelClient
from app.models import (
    CapabilityGap,
    Investigation,
    SpecialistInvestigationResult,
    SpecialistStep,
    SpecialistStepType,
    TrustedToolExecution,
)
from app.tools.tool_catalog import TrustedToolCatalog


class SpecialistCapabilityGapError(RuntimeError):
    """Raised when a specialist requires an unavailable capability."""

    def __init__(
        self,
        *,
        specialist_name: str,
        capability_gap: CapabilityGap,
    ) -> None:
        self.specialist_name = specialist_name
        self.capability_gap = capability_gap

        super().__init__(
            f"Specialist '{specialist_name}' requires unavailable "
            f"capability '{capability_gap.name}'."
        )


class ToolUsingSpecialistAgent(ABC):
    """Reusable AI specialist that investigates using trusted tools."""

    MAX_TOOL_STEPS = 10

    def __init__(
        self,
        *,
        model_client: StructuredModelClient,
        tool_catalog: TrustedToolCatalog,
    ) -> None:
        self._model_client = model_client
        self._tool_catalog = tool_catalog

    @property
    @abstractmethod
    def name(self) -> str:
        """Return the unique registered specialist name."""

    @abstractmethod
    def build_system_prompt(self) -> str:
        """Return permanent domain instructions for this specialist."""

    def build_user_prompt(
        self,
        *,
        investigation: Investigation,
        objective: str,
        evidence_needed: list[str],
    ) -> str:
        """Build the initial investigation prompt."""

        state = {
            "incident": {
                "title": investigation.incident_title,
                "description": investigation.incident_description,
            },
            "objective": objective,
            "evidence_needed": evidence_needed,
            "existing_hypotheses": [
                hypothesis.model_dump(mode="json")
                for hypothesis in investigation.hypotheses
            ],
            "existing_evidence": [
                evidence.model_dump(mode="json")
                for evidence in investigation.evidence
            ],
        }

        return (
            "Investigate the following assigned objective.\n\n"
            f"{json.dumps(state, indent=2)}"
        )

    async def investigate(
        self,
        *,
        investigation: Investigation,
        objective: str,
        evidence_needed: list[str],
    ) -> SpecialistInvestigationResult:
        """Investigate one objective using AI-directed trusted tools."""

        system_prompt = self._build_complete_system_prompt()

        initial_prompt = self.build_user_prompt(
            investigation=investigation,
            objective=objective,
            evidence_needed=evidence_needed,
        )

        execution_history: list[dict[str, Any]] = []
        execution_trace: list[TrustedToolExecution] = []

        for _ in range(self.MAX_TOOL_STEPS):
            user_prompt = self._build_iteration_prompt(
                initial_prompt=initial_prompt,
                execution_history=execution_history,
            )

            step = await self._model_client.generate_structured(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_model=SpecialistStep,
            )

            step.validate_selected_payload()

            if step.step_type == SpecialistStepType.FINISH:
                if step.final_result is None:
                    raise RuntimeError(
                        "FINISH step did not contain final_result."
                    )

                step.final_result.execution_trace = execution_trace
                return step.final_result

            if step.step_type == SpecialistStepType.CAPABILITY_GAP:
                if step.capability_gap is None:
                    raise RuntimeError(
                        "CAPABILITY_GAP step did not contain "
                        "capability_gap."
                    )

                raise SpecialistCapabilityGapError(
                    specialist_name=self.name,
                    capability_gap=step.capability_gap,
                )

            if step.step_type == SpecialistStepType.CALL_TOOL:
                if step.tool_call is None:
                    raise RuntimeError(
                        "CALL_TOOL step did not contain tool_call."
                    )

                tool_result = await self._tool_catalog.execute(
                    tool_name=step.tool_call.tool_name,
                    arguments=step.tool_call.arguments,
                )

                trace_item = TrustedToolExecution(
                    step_number=len(execution_trace) + 1,
                    tool_name=step.tool_call.tool_name,
                    purpose=step.tool_call.purpose,
                    reasoning=step.reasoning,
                    arguments=step.tool_call.arguments,
                    result=tool_result,
                )
                execution_trace.append(trace_item)
                execution_history.append(
                    {
                        "step_number": trace_item.step_number,
                        "reasoning": trace_item.reasoning,
                        "tool_call": {
                            "tool_name": trace_item.tool_name,
                            "arguments": trace_item.arguments,
                            "purpose": trace_item.purpose,
                        },
                        "tool_result": trace_item.result,
                    }
                )

                continue

            raise RuntimeError(
                f"Unsupported specialist step type: "
                f"{step.step_type}"
            )

        raise RuntimeError(
            "Maximum specialist investigation steps exceeded."
        )

    def _build_complete_system_prompt(self) -> str:
        """Combine shared rules, domain instructions, and tools."""

        tool_catalog = self._tool_catalog.build_model_catalog()

        return f"""
You are an AI specialist operating inside a controlled enterprise
investigation platform.

You may reason about the incident, but you may access enterprise data
only through the trusted tools listed below.

You must return exactly one structured SpecialistStep.

AVAILABLE ACTIONS

1. CALL_TOOL
   Use when additional trusted data is required.

2. FINISH
   Use only when the available tool results are sufficient to produce
   factual evidence for the assigned objective.

3. CAPABILITY_GAP
   Use when the required investigation cannot be completed using the
   approved tools.

RULES

1. Never invent tool results or evidence.
2. Never claim that a system was queried unless a trusted tool result
   confirms it.
3. Use only tool names present in the trusted tool catalog.
4. Tool arguments must conform to the declared input schema.
5. Do not repeatedly execute the same tool with identical arguments
   unless there is a clear investigative reason.
6. Base final evidence only on available tool results and existing
   investigation evidence.
7. Prefer the next action that most reduces uncertainty.
8. Use CAPABILITY_GAP rather than pretending an unavailable tool or
   capability exists.
9. When selecting FINISH, include a complete final_result.
10. Evidence must be factual, concise, and traceable to trusted data.

SPECIALIST INSTRUCTIONS

{self.build_system_prompt()}

TRUSTED TOOL CATALOG

{tool_catalog}
""".strip()

    def _build_iteration_prompt(
        self,
        *,
        initial_prompt: str,
        execution_history: list[dict[str, Any]],
    ) -> str:
        """Build the prompt for one reasoning iteration."""

        return (
            f"{initial_prompt}\n\n"
            "TRUSTED TOOL EXECUTION HISTORY\n\n"
            f"{json.dumps(execution_history, indent=2, default=str)}"
            "\n\nChoose the single best next SpecialistStep."
        )