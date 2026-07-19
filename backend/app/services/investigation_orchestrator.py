"""Orchestration service for AI-driven investigations."""

from app.agents.agent_executor import AgentExecutor
from app.agents.supervisor_agent import SupervisorAgent
from app.models import (
    Investigation,
    InvestigationStatus,
    SpecialistInvestigationResult,
    SupervisorAction,
    SupervisorActionType,
)


class InvestigationOrchestrationResult:
    """Result of one supervisor and specialist execution cycle."""

    def __init__(
        self,
        *,
        action: SupervisorAction,
        specialist_result: SpecialistInvestigationResult | None,
    ) -> None:
        self.action = action
        self.specialist_result = specialist_result


class InvestigationOrchestrator:
    """Coordinate the supervisor and executable specialist agents."""

    def __init__(
        self,
        *,
        supervisor: SupervisorAgent,
        agent_executor: AgentExecutor,
    ) -> None:
        self._supervisor = supervisor
        self._agent_executor = agent_executor

    async def run_next_action(
        self,
        investigation: Investigation,
    ) -> InvestigationOrchestrationResult:
        """Select and execute the next investigation action."""

        investigation.status = InvestigationStatus.PLANNING

        try:
            action = await self._supervisor.choose_next_action(
                investigation
            )

            if action.action_type == SupervisorActionType.COMPLETE:
                investigation.status = InvestigationStatus.COMPLETED

                return InvestigationOrchestrationResult(
                    action=action,
                    specialist_result=None,
                )

            if action.action_type == SupervisorActionType.VERIFY:
                investigation.status = InvestigationStatus.VERIFYING
            else:
                investigation.status = InvestigationStatus.INVESTIGATING

            specialist_result = await self._agent_executor.execute(
                investigation=investigation,
                action=action,
            )

            return InvestigationOrchestrationResult(
                action=action,
                specialist_result=specialist_result,
            )

        except Exception as exc:
            investigation.status = InvestigationStatus.FAILED
            investigation.error_message = str(exc)
            raise