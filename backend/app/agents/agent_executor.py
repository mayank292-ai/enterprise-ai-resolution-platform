"""Execution engine for specialist-agent assignments."""

from datetime import datetime, timezone

from app.agents.specialist_agent_registry import (
    SpecialistAgentRegistry,
)
from app.models import (
    AgentDecision,
    AgentExecutionStatus,
    Evidence,
    Investigation,
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
    ) -> list[Evidence]:
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
            evidence = await specialist.investigate(
                investigation=investigation,
                objective=action.objective,
                evidence_needed=action.evidence_needed,
            )
        except Exception:
            decision.status = AgentExecutionStatus.FAILED
            decision.completed_at = datetime.now(timezone.utc)
            investigation.updated_at = datetime.now(timezone.utc)
            raise

        investigation.evidence.extend(evidence)

        decision.evidence_ids = [
            item.evidence_id
            for item in evidence
        ]
        decision.status = AgentExecutionStatus.COMPLETED
        decision.completed_at = datetime.now(timezone.utc)
        investigation.updated_at = datetime.now(timezone.utc)

        return evidence