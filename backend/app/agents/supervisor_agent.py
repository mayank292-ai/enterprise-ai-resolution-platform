"""Supervisor responsible for selecting investigation actions."""

import json

from app.agents.agent_registry import AgentRegistry
from app.agents.model_client import StructuredModelClient
from app.models import (
    Investigation,
    SupervisorAction,
    SupervisorActionType,
)


class SupervisorAgent:
    """Plans and controls an enterprise incident investigation."""

    def __init__(
        self,
        *,
        model_client: StructuredModelClient,
        agent_registry: AgentRegistry,
    ) -> None:
        self._model_client = model_client
        self._agent_registry = agent_registry

    async def choose_next_action(
        self,
        investigation: Investigation,
    ) -> SupervisorAction:
        """Select the next investigation action using current evidence."""

        system_prompt = self._build_system_prompt()
        user_prompt = self._build_investigation_prompt(
            investigation
        )

        action = await self._model_client.generate_structured(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_model=SupervisorAction,
        )

        self._validate_action(action)

        return action

    def _build_system_prompt(self) -> str:
        """Build the permanent instructions supplied to the supervisor."""

        agent_catalog = (
            self._agent_registry.build_supervisor_catalog()
        )

        return f"""
You are the Supervisor Agent for an enterprise incident
investigation platform.

Your responsibility is to determine the single best next action
based on the incident, hypotheses, prior decisions, and evidence.

You coordinate specialist agents. You do not directly query
enterprise systems and you must not invent evidence.

AVAILABLE SPECIALIST AGENTS

{agent_catalog}

INVESTIGATION RULES

1. Select agents according to the evidence required, not merely
   according to keywords in the incident.
2. Begin by establishing the affected population and observable
   failure unless existing evidence already establishes it.
3. Use returned evidence to revise or eliminate hypotheses.
4. Do not repeatedly assign the same objective when evidence for
   it already exists.
5. Prefer the action that most reduces uncertainty.
6. Select VERIFY only when a likely root cause and impact are
   already supported by evidence.
7. Select COMPLETE only after verification has provided sufficient
   support and no major contradiction remains.
8. Never claim that a system was queried unless evidence from a
   specialist confirms it.

9. Return exactly one next action.

10. When delegating or verifying, agent_name and objective are
    required.

11. Set confidence according to how strongly the current
    investigation state supports the selected next action.

12. If the investigation requires a capability that does not exist
    in the available specialist catalog, return
    CAPABILITY_GAP instead of inventing a new specialist.

13. Do not invent agent names that are not present in the
    AVAILABLE SPECIALIST AGENTS catalog.

14. Prefer VERIFY instead of collecting redundant evidence when
    sufficient evidence already supports a likely root cause.

15. Avoid assigning the same objective more than once unless new
    evidence is expected.
""".strip()

    def _build_investigation_prompt(
        self,
        investigation: Investigation,
    ) -> str:
        """Build the current investigation state for the model."""

        state = {
            "incident": {
                "title": investigation.incident_title,
                "description": (
                    investigation.incident_description
                ),
            },
            "classification": (
                investigation.classification.model_dump(
                    mode="json"
                )
                if investigation.classification
                else None
            ),
            "hypotheses": [
                hypothesis.model_dump(mode="json")
                for hypothesis in investigation.hypotheses
            ],
            "previous_agent_decisions": [
                decision.model_dump(mode="json")
                for decision in investigation.agent_decisions
            ],
            "available_evidence": [
                evidence.model_dump(mode="json")
                for evidence in investigation.evidence
            ],
            "current_root_cause": (
                investigation.root_cause.model_dump(
                    mode="json"
                )
                if investigation.root_cause
                else None
            ),
            "current_business_impact": (
                investigation.business_impact.model_dump(
                    mode="json"
                )
                if investigation.business_impact
                else None
            ),
        }

        return (
            "Review the following investigation state and choose "
            "the single best next action.\n\n"
            f"{json.dumps(state, indent=2)}"
        )

    def _validate_action(
        self,
        action: SupervisorAction,
    ) -> None:
        """Validate the action against registered capabilities."""

        if action.action_type == SupervisorActionType.COMPLETE:
            return

        if (
            action.action_type
            == SupervisorActionType.CAPABILITY_GAP
        ):
            if action.capability_gap is None:
                raise ValueError(
                    "Supervisor must provide a capability gap proposal."
                )

            return

        if not action.agent_name:
            raise ValueError(
                "Supervisor must provide an agent_name when "
                "delegating or verifying."
            )

        if not action.objective:
            raise ValueError(
                "Supervisor must provide an objective when "
                "delegating or verifying."
            )

        if not self._agent_registry.contains(
            action.agent_name
        ):
            raise ValueError(
                "Supervisor selected an unknown agent: "
                f"'{action.agent_name}'."
            )

        if (
            action.action_type == SupervisorActionType.VERIFY
            and action.agent_name != "verification_agent"
        ):
            raise ValueError(
                "VERIFY actions must use verification_agent."
            )