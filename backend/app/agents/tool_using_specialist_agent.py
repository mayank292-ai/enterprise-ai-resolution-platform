"""Reusable base class for AI specialists using trusted tools."""

import json
import re
from abc import ABC, abstractmethod
from typing import Any

from app.agents.model_client import StructuredModelClient
from app.models import (
    Investigation,
    SpecialistCapabilityGap,
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
        capability_gap: SpecialistCapabilityGap,
    ) -> None:
        self.specialist_name = specialist_name
        self.capability_gap = capability_gap

        super().__init__(
            f"Specialist '{specialist_name}' requires unavailable "
            f"capability '{capability_gap.name}'."
        )


class ToolUsingSpecialistAgent(ABC):
    """Reusable AI specialist that investigates using trusted tools."""

    MAX_TOOL_STEPS = 20
    MAX_TOOL_REPAIR_ATTEMPTS = 2

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

            print(f"\n===== Running specialist: {self.name} =====")

            step = await self._model_client.generate_structured(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_model=SpecialistStep,
            )

            print(step.model_dump())

            if (
                step.step_type == SpecialistStepType.FINISH
                and step.final_result is None
            ):
                print(
                    f"Repairing incomplete FINISH response from "
                    f"{self.name}."
                )

                repair_prompt = (
                    f"{user_prompt}\n\n"
                    "IMPORTANT CORRECTION\n\n"
                    "Your previous response selected FINISH but omitted "
                    "the mandatory final_result.\n\n"
                    "Return exactly one corrected SpecialistStep.\n"
                    "Keep step_type as FINISH and provide a complete "
                    "final_result based only on the existing investigation "
                    "evidence and trusted tool execution history.\n\n"
                    "The final_result must include at least:\n"
                    '- "summary": a concise factual conclusion\n'
                    '- "confidence": a number between 0.0 and 1.0\n\n'
                    "Populate findings, evidence, hypothesis_updates, "
                    "open_questions, recommendations, and tools_used when "
                    "supported by the available information.\n\n"
                    "Do not call another tool.\n"
                    "Do not return final_result as null."
                )

                step = await self._model_client.generate_structured(
                    system_prompt=system_prompt,
                    user_prompt=repair_prompt,
                    response_model=SpecialistStep,
                )

                print("Repaired specialist response:")
                print(step.model_dump())

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

                active_step = step
                tool_result: Any | None = None
                execution_error: str | None = None

                for repair_attempt in range(
                    self.MAX_TOOL_REPAIR_ATTEMPTS + 1
                ):
                    if active_step.tool_call is None:
                        break

                    active_step.tool_call.purpose = self._truncate_text(
                        active_step.tool_call.purpose
                    )
                    active_step.reasoning = self._truncate_text(
                        active_step.reasoning
                    )

                    active_step.tool_call.arguments = (
                        self._recover_obvious_arguments(
                            tool_name=active_step.tool_call.tool_name,
                            arguments=active_step.tool_call.arguments,
                            reasoning=active_step.reasoning,
                            purpose=active_step.tool_call.purpose,
                            prompt=user_prompt,
                            execution_error=execution_error,
                        )
                    )

                    previous_result = self._find_previous_tool_result(
                        execution_history=execution_history,
                        tool_name=active_step.tool_call.tool_name,
                        arguments=active_step.tool_call.arguments,
                    )

                    if previous_result is not None:
                        print(
                            "Reusing previous result for duplicate tool "
                            f"call: {active_step.tool_call.tool_name}"
                        )
                        tool_result = previous_result
                        break

                    try:
                        tool_result = await self._tool_catalog.execute(
                            tool_name=active_step.tool_call.tool_name,
                            arguments=active_step.tool_call.arguments,
                        )
                        break

                    except (TypeError, ValueError) as exc:
                        execution_error = str(exc)

                        if (
                            repair_attempt
                            >= self.MAX_TOOL_REPAIR_ATTEMPTS
                        ):
                            break

                        print(
                            f"Repairing invalid tool arguments from "
                            f"{self.name}: {exc}"
                        )

                        repair_prompt = self._build_tool_repair_prompt(
                            user_prompt=user_prompt,
                            step=active_step,
                            execution_error=execution_error,
                        )

                        repaired_step = (
                            await self._model_client.generate_structured(
                                system_prompt=system_prompt,
                                user_prompt=repair_prompt,
                                response_model=SpecialistStep,
                            )
                        )

                        print("Repaired tool call:")
                        print(repaired_step.model_dump())

                        repaired_step.validate_selected_payload()

                        if (
                            repaired_step.step_type
                            != SpecialistStepType.CALL_TOOL
                            or repaired_step.tool_call is None
                        ):
                            execution_error = (
                                "Tool-call repair did not return a valid "
                                "CALL_TOOL step."
                            )
                            break

                        if (
                            repaired_step.tool_call.tool_name
                            != active_step.tool_call.tool_name
                        ):
                            execution_error = (
                                "Tool-call repair changed the tool from "
                                f"'{active_step.tool_call.tool_name}' to "
                                f"'{repaired_step.tool_call.tool_name}'."
                            )
                            break

                        active_step = repaired_step

                if tool_result is None:
                    failed_tool_call = (
                        active_step.tool_call.model_dump(mode="json")
                        if active_step.tool_call is not None
                        else None
                    )

                    execution_history.append(
                        {
                            "step_number": len(execution_trace) + 1,
                            "reasoning": self._truncate_text(
                                active_step.reasoning
                            ),
                            "tool_call": failed_tool_call,
                            "tool_error": execution_error
                            or "Tool execution failed.",
                            "instruction": (
                                "Do not repeat the same invalid call. "
                                "Choose corrected arguments, another trusted "
                                "tool, FINISH with available evidence, or "
                                "CAPABILITY_GAP if the objective cannot be "
                                "completed with the approved tools."
                            ),
                        }
                    )
                    continue

                step = active_step

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

    def _build_tool_repair_prompt(
        self,
        *,
        user_prompt: str,
        step: SpecialistStep,
        execution_error: str,
    ) -> str:
        """Build a constrained prompt for repairing one tool call."""

        tool_catalog = self._tool_catalog.build_model_catalog()
        invalid_call = (
            step.tool_call.model_dump(mode="json")
            if step.tool_call is not None
            else None
        )

        return (
            f"{user_prompt}\n\n"
            "IMPORTANT TOOL-CALL CORRECTION\n\n"
            "The previous tool call could not be executed because its "
            "arguments were invalid.\n\n"
            f"Invalid tool call:\n"
            f"{json.dumps(invalid_call, indent=2, default=str)}\n\n"
            f"Execution error:\n{execution_error}\n\n"
            "TRUSTED TOOL CATALOG AND INPUT SCHEMAS\n\n"
            f"{tool_catalog}\n\n"
            "Return exactly one corrected SpecialistStep.\n"
            "Keep step_type as CALL_TOOL.\n"
            "Keep exactly the same tool name.\n"
            "Populate every required argument declared by that tool's "
            "input schema.\n"
            "Use only exact values already present in the investigation, "
            "existing evidence, previous trusted tool results, execution "
            "history, or the previous reasoning.\n"
            "Do not invent values.\n"
            "Do not put reasoning or descriptive prose inside arguments.\n"
            "Keep purpose concise.\n"
            "Do not return an empty arguments object when required inputs "
            "exist.\n"
            "Do not return FINISH or CAPABILITY_GAP."
        )

    @staticmethod
    def _recover_obvious_arguments(
        *,
        tool_name: str,
        arguments: dict[str, Any],
        reasoning: str,
        purpose: str,
        prompt: str,
        execution_error: str | None,
    ) -> dict[str, Any]:
        """Recover unambiguous identifiers omitted by the model."""

        repaired = dict(arguments or {})
        searchable_text = "\n".join(
            value
            for value in (
                reasoning,
                purpose,
                prompt,
                execution_error or "",
            )
            if value
        )
        error_text = (execution_error or "").lower()

        payment_id_tools = {
            "inspect_payment_lifecycle",
            "compare_source_and_canonical_record",
        }
        run_id_tools = {
            "inspect_pipeline_run",
            "inspect_task_failures",
            "compare_expected_and_processed_records",
        }

        needs_payment_id = (
            tool_name in payment_id_tools
            or "payment_id" in error_text
        )
        needs_run_id = (
            tool_name in run_id_tools
            or "run_id" in error_text
        )

        if needs_payment_id and "payment_id" not in repaired:
            payment_match = re.search(
                r"\bPAY-\d{8}-\d+\b",
                searchable_text,
            )
            if payment_match:
                repaired["payment_id"] = payment_match.group(0)

        if needs_run_id and "run_id" not in repaired:
            run_match = re.search(
                r"\bRUN-[A-Z0-9][A-Z0-9-]*\b",
                searchable_text,
            )
            if run_match:
                repaired["run_id"] = run_match.group(0)

        version_matches = re.findall(
            r"\b\d+\.\d+(?:\.\d+)?\b",
            searchable_text,
        )
        unique_versions = list(dict.fromkeys(version_matches))

        if tool_name == "compare_schema_versions":
            if (
                "old_version" not in repaired
                and len(unique_versions) >= 1
            ):
                repaired["old_version"] = unique_versions[0]

            if (
                "new_version" not in repaired
                and len(unique_versions) >= 2
            ):
                repaired["new_version"] = unique_versions[1]

        elif (
            tool_name
            in {
                "get_schema_definition",
                "inspect_field_mapping",
                "inspect_version_change",
            }
            or "required keyword-only argument: 'version'" in error_text
            or "required argument: version" in error_text
        ):
            if "version" not in repaired and unique_versions:
                repaired["version"] = unique_versions[-1]

        return repaired

    @staticmethod
    def _find_previous_tool_result(
        *,
        execution_history: list[dict[str, Any]],
        tool_name: str,
        arguments: dict[str, Any],
    ) -> Any | None:
        """Return a prior result for an identical successful tool call."""

        normalized_arguments = json.dumps(
            arguments,
            sort_keys=True,
            default=str,
        )

        for history_item in reversed(execution_history):
            previous_call = history_item.get("tool_call") or {}
            previous_result = history_item.get("tool_result")

            if previous_result is None:
                continue

            previous_arguments = json.dumps(
                previous_call.get("arguments", {}),
                sort_keys=True,
                default=str,
            )

            if (
                previous_call.get("tool_name") == tool_name
                and previous_arguments == normalized_arguments
            ):
                return previous_result

        return None

    @staticmethod
    def _truncate_text(
        value: str,
        *,
        limit: int = 2000,
    ) -> str:
        """Prevent malformed model text from bloating later prompts."""

        if len(value) <= limit:
            return value

        return f"{value[:limit]}... [truncated]"

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

4. Tool arguments must exactly conform to the declared input schema.

   Every required input parameter must be provided.

   Never omit a required argument.

   If a required value already exists in the investigation, existing
   evidence, previous tool results, or execution history, copy that
   exact value into the tool arguments.

   Examples include payment_id, schema version, producer version,
   mapping name, system name, or release version.

   Do not invent argument values.

   Do not leave the arguments object empty unless the selected tool
   declares no required input parameters.

5. Do not repeatedly execute the same tool with identical arguments
   unless there is a clear investigative reason.

6. Base final evidence only on available tool results and existing
   investigation evidence.

7. Prefer the next action that most reduces uncertainty.

8. Use CAPABILITY_GAP rather than pretending an unavailable tool or
   capability exists.

9. When selecting FINISH, final_result is mandatory.

   Never return FINISH with final_result set to null.

   A valid FINISH response must follow this structure:

   {{
     "step_type": "finish",
     "reasoning": "Explain why the assigned objective is complete.",
     "final_result": {{
       "summary": "Concise factual conclusion for the assigned objective.",
       "confidence": 0.9,
       "findings": [],
       "evidence": [],
       "hypothesis_updates": [],
       "open_questions": [],
       "recommendations": [],
       "tools_used": [],
       "execution_trace": []
     }},
     "tool_call": null,
     "capability_gap": null
   }}

   The summary and confidence fields must always be populated.

   Populate the remaining final_result fields when supported by
   existing evidence or trusted tool results.

   FINISH means that this specialist has completed only its assigned
   objective. It does not mean that the overall investigation is
   complete. The supervisor will decide whether another specialist
   must be executed.

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