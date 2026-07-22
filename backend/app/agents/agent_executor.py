"""Execution engine for specialist-agent assignments."""

from datetime import datetime, timezone

from app.agents.specialist_agent_registry import (
    SpecialistAgentRegistry,
)
from app.agents.tool_using_specialist_agent import (
    SpecialistCapabilityGapError,
)
from app.models import (
    AgentDecision,
    AgentExecutionStatus,
    Evidence,
    HypothesisUpdateStatus,
    Investigation,
    SpecialistAssignmentOutcome,
    SpecialistInvestigationResult,
    SupervisorAction,
    SupervisorActionType,
)


class AgentExecutor:
    """Execute Supervisor actions using registered specialists."""

    def __init__(
        self,
        *,
        specialist_registry: SpecialistAgentRegistry,
    ) -> None:
        self._specialist_registry = specialist_registry

    async def execute(
        self,
        *,
        investigation: Investigation,
        action: SupervisorAction,
    ) -> SpecialistInvestigationResult:
        """Execute one delegated or verification action."""

        if action.action_type not in {
            SupervisorActionType.DELEGATE,
            SupervisorActionType.VERIFY,
        }:
            raise ValueError(
                "AgentExecutor can execute only "
                "DELEGATE or VERIFY actions."
            )

        if not action.agent_name:
            raise ValueError(
                "Supervisor action must include agent_name."
            )

        if not action.objective:
            raise ValueError(
                "Supervisor action must include objective."
            )

        specialist = self._specialist_registry.get(
            action.agent_name
        )

        if specialist is None:
            raise ValueError(
                "No executable implementation is registered "
                f"for agent '{action.agent_name}'."
            )

        decision = AgentDecision(
            agent_name=action.agent_name,
            objective=action.objective,
            reason=action.reason,
            status=AgentExecutionStatus.RUNNING,
            started_at=datetime.now(timezone.utc),
        )

        investigation.agent_decisions.append(decision)

        try:
            result = await specialist.investigate(
                investigation=investigation,
                objective=action.objective,
                evidence_needed=action.evidence_needed,
            )
        except SpecialistCapabilityGapError:
            # A capability gap is a valid orchestration outcome. The
            # orchestrator will convert it into a governed pause.
            decision.status = AgentExecutionStatus.COMPLETED
            decision.completed_at = datetime.now(timezone.utc)
            investigation.updated_at = datetime.now(
                timezone.utc
            )
            raise
        except Exception:
            decision.status = AgentExecutionStatus.FAILED
            decision.completed_at = datetime.now(timezone.utc)
            investigation.updated_at = datetime.now(
                timezone.utc
            )
            raise

        normalized_evidence = [
            Evidence(
                source=item.source,
                title=item.title,
                summary=item.summary,
                confidence=item.confidence,
                data=item.data,
            )
            for item in result.evidence
        ]

        result.evidence = normalized_evidence

        investigation.evidence.extend(
            normalized_evidence
        )

        decision.evidence_ids = [
            item.evidence_id
            for item in normalized_evidence
        ]

        for trace_item in result.execution_trace:
            trace_item.agent_name = action.agent_name
            trace_item.decision_id = decision.decision_id

        for hypothesis_update in result.hypothesis_updates:
            if (
                action.agent_name != "verification_agent"
                and hypothesis_update.status
                == HypothesisUpdateStatus.CONFIRMED
            ):
                hypothesis_update.status = (
                    HypothesisUpdateStatus.SUPPORTED
                )

                hypothesis_update.confidence = min(
                    hypothesis_update.confidence,
                    0.95,
                )

                hypothesis_update.reasoning = (
                    f"{hypothesis_update.reasoning} "
                    "This conclusion remains supported rather "
                    "than confirmed until independently verified."
                )

        investigation.findings.extend(
            result.findings
        )

        investigation.hypothesis_updates.extend(
            result.hypothesis_updates
        )

        investigation.open_questions.extend(
            question
            for question in result.open_questions
            if question not in investigation.open_questions
        )

        investigation.specialist_recommendations.extend(
            recommendation
            for recommendation in result.recommendations
            if recommendation
            not in investigation.specialist_recommendations
        )

        investigation.tool_execution_trace.extend(
            result.execution_trace
        )

        outcome_confidence = result.confidence

        if action.agent_name != "verification_agent":
            outcome_confidence = min(
                outcome_confidence,
                0.95,
            )

        investigation.specialist_outcomes.append(
            SpecialistAssignmentOutcome(
                decision_id=decision.decision_id,
                agent_name=action.agent_name,
                summary=result.summary,
                confidence=outcome_confidence,
            )
        )

        decision.tool_execution_ids = [
            item.execution_id
            for item in result.execution_trace
        ]

        decision.status = AgentExecutionStatus.COMPLETED
        decision.completed_at = datetime.now(timezone.utc)
        investigation.updated_at = datetime.now(
            timezone.utc
        )

        return result