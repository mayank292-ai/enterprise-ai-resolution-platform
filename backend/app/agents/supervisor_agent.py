"""Supervisor responsible for selecting investigation actions."""

import json
from pydantic import BaseModel, Field

from app.models import (
    BusinessImpact,
    Investigation,
    Recommendation,
    RootCause,
    SupervisorAction,
    SupervisorActionType,
)
from app.agents.agent_registry import AgentRegistry
from app.agents.model_client import StructuredModelClient


class FinalInvestigationReport(BaseModel):
    """Verified final synthesis of an investigation."""

    root_cause: RootCause
    business_impact: BusinessImpact
    recommendations: list[Recommendation] = Field(
        default_factory=list
    )
    executive_summary: list[str] = Field(
        default_factory=list
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
    async def generate_final_report(
            self,
            investigation: Investigation,
        ) -> FinalInvestigationReport:
            """Synthesize the verified final investigation report."""

            system_prompt = self._build_final_report_system_prompt()
            user_prompt = self._build_final_report_prompt(
                investigation
            )

            return await self._model_client.generate_structured(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_model=FinalInvestigationReport,
            )
    @staticmethod
    def _build_final_report_system_prompt() -> str:
        """Build instructions for final evidence synthesis."""

        return """
    You are producing the final report for a completed enterprise
    incident investigation.

    Use only evidence and conclusions already present in the
    investigation state. Do not invent evidence, systems, values,
    timestamps, affected records, or financial impact.

    The report must:

    1. State one concise verified root cause.
    2. Reference only evidence IDs present in the investigation.
    3. Quantify business impact only where supported.
    4. Use zero for unknown numerical impact rather than estimating.
    5. Deduplicate overlapping specialist recommendations.
    6. Return only the most important remediation and prevention
    recommendations.
    7. Produce a concise executive summary of three to five bullets.
    8. Treat verified specialist conclusions as stronger than proposed
    or merely supported hypotheses.
    9. Do not describe an unresolved hypothesis as confirmed.
    10. Keep the report understandable to both technical and business
        stakeholders.
    """.strip()


    @staticmethod
    def _build_final_report_prompt(
        investigation: Investigation,
    ) -> str:
        """Build the complete state used for final synthesis."""

        state = {
            "incident": {
                "title": investigation.incident_title,
                "description": investigation.incident_description,
            },
            "classification": (
                investigation.classification.model_dump(mode="json")
                if investigation.classification
                else None
            ),
            "hypotheses": [
                item.model_dump(mode="json")
                for item in investigation.hypotheses
            ],
            "hypothesis_updates": [
                item.model_dump(mode="json")
                for item in investigation.hypothesis_updates
            ],
            "findings": [
                item.model_dump(mode="json")
                for item in investigation.findings
            ],
            "evidence": [
                item.model_dump(mode="json")
                for item in investigation.evidence
            ],
            "specialist_outcomes": [
                item.model_dump(mode="json")
                for item in investigation.specialist_outcomes
            ],
            "specialist_recommendations": (
                investigation.specialist_recommendations
            ),
            "open_questions": investigation.open_questions,
        }

        return (
            "Produce the verified final investigation report from the "
            "following state.\n\n"
            f"{json.dumps(state, indent=2)}"
        )
    
    
    def _build_system_prompt(self) -> str:
        """Build the permanent instructions supplied to the supervisor."""

        agent_catalog = (
            self._agent_registry.build_supervisor_catalog()
        )

        return f"""
You are the Supervisor Agent for an enterprise incident
investigation platform.

Your primary responsibility is to reduce the most important
remaining uncertainty in the investigation.

For every decision, identify the most important unresolved question
and choose the single action that most effectively resolves it.

Do not optimize for completing the investigation quickly. Optimize
for reaching a causally supported conclusion.

You coordinate specialist agents. You do not directly query
enterprise systems and you must not invent evidence.

AVAILABLE SPECIALIST AGENTS

{agent_catalog}

INVESTIGATION RULES

1. Select agents according to the evidence required, not merely
   according to keywords in the incident.

2. Begin by establishing the affected population and observable
   failure unless existing evidence already establishes them.

3. Use returned evidence, findings, hypothesis updates, specialist
   outcomes, recommendations, and open questions to revise or
   eliminate hypotheses.

4. Do not repeatedly assign the same objective when evidence for it
   already exists, unless meaningful new evidence is expected.

5. Before selecting an action, identify the single most important
   unresolved question.

6. Determine whether answering that question could materially change
   the proposed root cause, business impact, or remediation.

7. If the unresolved question is material and an available specialist
   can obtain evidence that answers it, select DELEGATE.

8. If the unresolved question is material and no available specialist
   can obtain the required evidence, select CAPABILITY_GAP.

9. Select VERIFY only when no material unresolved question remains and
   the current evidence supports:
   a. what failed,
   b. the resulting business impact, and
   c. the causal mechanism explaining why the failure occurred.

10. Do not treat correlation as causation. An observed error, affected
    component, timestamp, condition, event, or associated change is not
    by itself a root cause unless evidence explains how it produced the
    failure.

    For an incident reported after a release or deployment, a producer
    version correlation is not deployment evidence. Do not select VERIFY
    or COMPLETE until trusted change-history evidence identifies what the
    release changed and how that change caused the observed failure. If
    that evidence is material and no permanent specialist can obtain it,
    select CAPABILITY_GAP for the missing change-analysis capability.

11. Specialist recommendations are not evidence. However, a
    recommendation or open question that identifies missing material
    evidence means the investigation is not ready for verification.

12. Select COMPLETE only after verification has provided sufficient
    support and no material contradiction or unresolved question
    remains.

13. Never claim that a system was queried unless specialist evidence
    confirms it. Never invent evidence or specialist capabilities.

14. Do not invent agent names that are absent from the AVAILABLE
    SPECIALIST AGENTS catalog.

15. Return exactly one next action.

16. When delegating or verifying, agent_name and objective are required.

17. For CAPABILITY_GAP, propose the missing expertise that would most
    reduce the material uncertainty and provide a focused resume
    objective.

18. Set confidence according to how strongly the investigation state
    supports the selected next action.
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
            "findings": [
                item.model_dump(mode="json")
                for item in investigation.findings
            ],
            "hypothesis_updates": [
                item.model_dump(mode="json")
                for item in investigation.hypothesis_updates
            ],
            "specialist_outcomes": [
                item.model_dump(mode="json")
                for item in investigation.specialist_outcomes
            ],
            "specialist_recommendations": (
                investigation.specialist_recommendations
            ),
            "open_questions": investigation.open_questions,
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
            "Review the following investigation state. Identify the "
            "most important unresolved question, determine whether it is "
            "material, and choose the single best next action.\n\n"
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
