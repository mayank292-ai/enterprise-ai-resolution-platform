"""Orchestration service for AI-driven investigations."""

from datetime import datetime, timezone

from app.agents.agent_executor import AgentExecutor
from app.agents.supervisor_agent import SupervisorAgent
from app.agents.tool_using_specialist_agent import (
    SpecialistCapabilityGapError,
)
from app.models import (
    CapabilityGap,
    CapabilityGapStatus,
    Investigation,
    InvestigationStatus,
    SpecialistCapabilityGap,
    SpecialistInvestigationResult,
    SupervisorAction,
    SupervisorActionType,
    SupervisorConfidence,
)


class InvestigationOrchestrationResult:
    """Result of an investigation orchestration run."""

    def __init__(
        self,
        *,
        action: SupervisorAction,
        specialist_result: SpecialistInvestigationResult | None,
        executed_actions: list[SupervisorAction] | None = None,
        specialist_results: (
            list[SpecialistInvestigationResult] | None
        ) = None,
        completed: bool = False,
        paused: bool = False,
        reached_iteration_limit: bool = False,
    ) -> None:
        # Keep these two fields for compatibility with existing callers.
        self.action = action
        self.specialist_result = specialist_result

        self.executed_actions = executed_actions or [action]
        self.specialist_results = specialist_results or []
        self.completed = completed
        self.paused = paused
        self.reached_iteration_limit = reached_iteration_limit

    @property
    def executed_action_count(self) -> int:
        """Return the number of supervisor actions executed."""

        return len(self.executed_actions)


class InvestigationOrchestrator:
    """Coordinate the supervisor and executable specialist agents."""

    DEFAULT_MAX_ITERATIONS = 10

    def __init__(
        self,
        *,
        supervisor: SupervisorAgent,
        agent_executor: AgentExecutor,
        max_iterations: int = DEFAULT_MAX_ITERATIONS,
    ) -> None:
        if max_iterations < 1:
            raise ValueError(
                "max_iterations must be greater than zero."
            )

        self._supervisor = supervisor
        self._agent_executor = agent_executor
        self._max_iterations = max_iterations

    async def run(
        self,
        investigation: Investigation,
    ) -> InvestigationOrchestrationResult:
        """Run supervisor-specialist cycles until completion or pause."""

        executed_actions: list[SupervisorAction] = []
        specialist_results: list[
            SpecialistInvestigationResult
        ] = []

        last_action: SupervisorAction | None = None
        last_specialist_result: (
            SpecialistInvestigationResult | None
        ) = None

        investigation.error_message = None

        try:
            for _ in range(self._max_iterations):
                investigation.status = (
                    InvestigationStatus.PLANNING
                )
                investigation.updated_at = self._now()

                action = await self._supervisor.choose_next_action(
                    investigation
                )

                last_action = action
                executed_actions.append(action)

                if (
                    action.action_type
                    == SupervisorActionType.CAPABILITY_GAP
                ):
                    self._pause_for_capability_gap(
                        investigation=investigation,
                        action=action,
                    )

                    return InvestigationOrchestrationResult(
                        action=action,
                        specialist_result=(
                            last_specialist_result
                        ),
                        executed_actions=executed_actions,
                        specialist_results=specialist_results,
                        completed=False,
                        paused=True,
                    )

                if (
                    action.action_type
                    == SupervisorActionType.COMPLETE
                ):
                    await self._generate_final_report(investigation)
                    self._complete_investigation(investigation)

                    return InvestigationOrchestrationResult(
                        action=action,
                        specialist_result=(
                            last_specialist_result
                        ),
                        executed_actions=executed_actions,
                        specialist_results=specialist_results,
                        completed=True,
                    )

                investigation.status = (
                    InvestigationStatus.VERIFYING
                    if action.action_type
                    == SupervisorActionType.VERIFY
                    else InvestigationStatus.INVESTIGATING
                )
                investigation.updated_at = self._now()

                try:
                    specialist_result = (
                        await self._agent_executor.execute(
                            investigation=investigation,
                            action=action,
                        )
                    )
                except SpecialistCapabilityGapError as exc:
                    gap_action = (
                        self._build_specialist_capability_gap_action(
                            specialist_name=exc.specialist_name,
                            capability_gap=exc.capability_gap,
                        )
                    )
                    executed_actions.append(gap_action)
                    self._pause_for_capability_gap(
                        investigation=investigation,
                        action=gap_action,
                    )

                    return InvestigationOrchestrationResult(
                        action=gap_action,
                        specialist_result=last_specialist_result,
                        executed_actions=executed_actions,
                        specialist_results=specialist_results,
                        completed=False,
                        paused=True,
                    )

                last_specialist_result = specialist_result
                specialist_results.append(specialist_result)

            if last_action is None:
                raise RuntimeError(
                    "The supervisor did not produce an action."
                )

            investigation.status = (
                InvestigationStatus.INVESTIGATING
            )
            investigation.updated_at = self._now()

            return InvestigationOrchestrationResult(
                action=last_action,
                specialist_result=last_specialist_result,
                executed_actions=executed_actions,
                specialist_results=specialist_results,
                completed=False,
                reached_iteration_limit=True,
            )

        except Exception as exc:
            self._fail_investigation(
                investigation=investigation,
                error_message=str(exc),
            )
            raise

    async def resume_after_capability(
        self,
        investigation: Investigation,
    ) -> InvestigationOrchestrationResult:
        """Execute the provisioned capability and continue orchestration."""

        capability_gap = investigation.pending_capability_gap

        if capability_gap is None:
            raise ValueError(
                "Investigation has no capability gap to resume."
            )

        if (
            capability_gap.status
            != CapabilityGapStatus.READY
        ):
            raise ValueError(
                "Capability must be ready before the investigation "
                "can resume."
            )

        investigation.status = (
            InvestigationStatus.INVESTIGATING
        )
        investigation.updated_at = self._now()
        investigation.error_message = None

        provisioned_action = SupervisorAction(
            action_type=SupervisorActionType.DELEGATE,
            agent_name=capability_gap.proposed_agent_name,
            objective=capability_gap.resume_objective,
            reason=(
                "Execute the newly approved and provisioned "
                "capability required to continue the investigation."
            ),
            confidence=SupervisorConfidence.HIGH,
            evidence_needed=[
                (
                    "Trusted evidence resolving the approved "
                    "capability gap."
                )
            ],
        )

        try:
            try:
                specialist_result = (
                    await self._agent_executor.execute(
                        investigation=investigation,
                        action=provisioned_action,
                    )
                )
            except SpecialistCapabilityGapError:
                # The demo provisions capabilities from a fixed mock tool
                # catalog. A second capability request would therefore create
                # an approval loop without adding executable functionality.
                # Enforce one dynamic expansion and move deterministically to
                # verification using all evidence gathered so far.
                return await self._verify_and_complete_after_capability(
                    investigation=investigation,
                    executed_actions=[provisioned_action],
                    specialist_results=[],
                )

            # The missing capability has now been executed.
            investigation.pending_capability_gap = None
            investigation.updated_at = self._now()

            continuation = await self.run(investigation)

            if continuation.paused:
                # The continuation supervisor can also request another
                # capability after the provisioned specialist succeeds.
                # The demo contract permits one visible approval only, so
                # route this path to the same deterministic verification
                # fallback used for a direct specialist capability gap.
                return await self._verify_and_complete_after_capability(
                    investigation=investigation,
                    executed_actions=[
                        provisioned_action,
                        *continuation.executed_actions,
                    ],
                    specialist_results=[
                        specialist_result,
                        *continuation.specialist_results,
                    ],
                )

            return InvestigationOrchestrationResult(
                action=continuation.action,
                specialist_result=(
                    continuation.specialist_result
                ),
                executed_actions=[
                    provisioned_action,
                    *continuation.executed_actions,
                ],
                specialist_results=[
                    specialist_result,
                    *continuation.specialist_results,
                ],
                completed=continuation.completed,
                paused=continuation.paused,
                reached_iteration_limit=(
                    continuation.reached_iteration_limit
                ),
            )

        except Exception as exc:
            self._fail_investigation(
                investigation=investigation,
                error_message=str(exc),
            )
            raise

    async def _verify_and_complete_after_capability(
        self,
        *,
        investigation: Investigation,
        executed_actions: list[SupervisorAction],
        specialist_results: list[SpecialistInvestigationResult],
    ) -> InvestigationOrchestrationResult:
        """Apply the demo's one-approval fallback and complete verification."""

        investigation.pending_capability_gap = None
        investigation.status = InvestigationStatus.VERIFYING
        investigation.updated_at = self._now()

        verification_action = SupervisorAction(
            action_type=SupervisorActionType.VERIFY,
            agent_name="verification_agent",
            objective=(
                "Verify all validated investigation findings and determine "
                "the most strongly supported root cause."
            ),
            reason=(
                "The required investigation evidence has been collected. "
                "Proceed to final verification to determine the strongest "
                "supported conclusion based on the available evidence."
            ),
            confidence=SupervisorConfidence.HIGH,
            evidence_needed=[
                (
                    "Independent verification of the strongest supported "
                    "findings using the evidence already collected."
                )
            ],
        )
        verification_result = await self._agent_executor.execute(
            investigation=investigation,
            action=verification_action,
        )

        await self._generate_final_report(investigation)
        self._complete_investigation(investigation)

        return InvestigationOrchestrationResult(
            action=verification_action,
            specialist_result=verification_result,
            executed_actions=[
                *executed_actions,
                verification_action,
            ],
            specialist_results=[
                *specialist_results,
                verification_result,
            ],
            completed=True,
            paused=False,
        )

    async def run_next_action(
        self,
        investigation: Investigation,
    ) -> InvestigationOrchestrationResult:
        """Execute one supervisor action."""

        investigation.error_message = None
        investigation.status = InvestigationStatus.PLANNING
        investigation.updated_at = self._now()

        try:
            action = await self._supervisor.choose_next_action(
                investigation
            )

            if (
                action.action_type
                == SupervisorActionType.CAPABILITY_GAP
            ):
                self._pause_for_capability_gap(
                    investigation=investigation,
                    action=action,
                )

                return InvestigationOrchestrationResult(
                    action=action,
                    specialist_result=None,
                    completed=False,
                    paused=True,
                )

            if (
                action.action_type
                == SupervisorActionType.COMPLETE
            ):
                await self._generate_final_report(investigation)
                self._complete_investigation(investigation)

                return InvestigationOrchestrationResult(
                    action=action,
                    specialist_result=None,
                    completed=True,
                )

            investigation.status = (
                InvestigationStatus.VERIFYING
                if action.action_type
                == SupervisorActionType.VERIFY
                else InvestigationStatus.INVESTIGATING
            )
            investigation.updated_at = self._now()

            try:
                specialist_result = (
                    await self._agent_executor.execute(
                        investigation=investigation,
                        action=action,
                    )
                )
            except SpecialistCapabilityGapError as exc:
                gap_action = (
                    self._build_specialist_capability_gap_action(
                        specialist_name=exc.specialist_name,
                        capability_gap=exc.capability_gap,
                    )
                )
                self._pause_for_capability_gap(
                    investigation=investigation,
                    action=gap_action,
                )

                return InvestigationOrchestrationResult(
                    action=gap_action,
                    specialist_result=None,
                    completed=False,
                    paused=True,
                )

            return InvestigationOrchestrationResult(
                action=action,
                specialist_result=specialist_result,
                specialist_results=[specialist_result],
            )

        except Exception as exc:
            self._fail_investigation(
                investigation=investigation,
                error_message=str(exc),
            )
            raise

    @staticmethod
    def _build_specialist_capability_gap_action(
        *,
        specialist_name: str,
        capability_gap: SpecialistCapabilityGap,
    ) -> SupervisorAction:
        """Convert a specialist gap into a supervisor-compatible action."""

        normalized_name = "".join(
            character if character.isalnum() else "_"
            for character in capability_gap.name.lower()
        ).strip("_")

        while "__" in normalized_name:
            normalized_name = normalized_name.replace("__", "_")

        proposed_agent_name = (
            normalized_name
            if normalized_name.endswith("_agent")
            else f"{normalized_name}_agent"
        )

        title = capability_gap.name.replace("_", " ").title()
        required_tools = list(capability_gap.suggested_tools)
        expected_outputs = list(capability_gap.expected_outputs)

        return SupervisorAction(
            action_type=SupervisorActionType.CAPABILITY_GAP,
            agent_name=None,
            objective=None,
            reason=(
                f"Specialist '{specialist_name}' cannot complete its "
                "assigned objective with the currently approved tools. "
                f"{capability_gap.reason}"
            ),
            confidence=SupervisorConfidence.HIGH,
            evidence_needed=expected_outputs,
            capability_gap={
                "title": title,
                "missing_capability": capability_gap.description,
                "reason": capability_gap.reason,
                "proposed_agent_name": proposed_agent_name,
                "proposed_agent_description": (
                    capability_gap.description
                ),
                "required_tools": required_tools,
                "resume_objective": (
                    "Use the newly approved capability to resolve the "
                    f"missing prerequisite '{capability_gap.name}' for "
                    f"the objective previously assigned to "
                    f"{specialist_name}."
                ),
            },
        )

    @staticmethod
    def _pause_for_capability_gap(
        *,
        investigation: Investigation,
        action: SupervisorAction,
    ) -> None:
        """Pause the investigation for capability approval."""

        proposal = action.capability_gap

        if proposal is None:
            raise ValueError(
                "Capability-gap action must contain a proposal."
            )

        investigation.pending_capability_gap = CapabilityGap(
            title=proposal.title,
            missing_capability=proposal.missing_capability,
            reason=proposal.reason,
            proposed_agent_name=proposal.proposed_agent_name,
            proposed_agent_description=(
                proposal.proposed_agent_description
            ),
            required_tools=proposal.required_tools,
            resume_objective=proposal.resume_objective,
        )

        investigation.status = (
            InvestigationStatus
            .AWAITING_CAPABILITY_APPROVAL
        )
        investigation.updated_at = (
            InvestigationOrchestrator._now()
        )

    async def _generate_final_report(
        self,
        investigation: Investigation,
    ) -> None:
        """Generate and persist the final investigation synthesis."""

        final_report = await self._supervisor.generate_final_report(
            investigation
        )

        investigation.root_cause = final_report.root_cause
        investigation.business_impact = (
            final_report.business_impact
        )
        investigation.recommendations = (
            final_report.recommendations
        )
        investigation.executive_summary = (
            final_report.executive_summary
        )
        investigation.updated_at = self._now()


    @staticmethod
    def _complete_investigation(
        investigation: Investigation,
    ) -> None:
        """Mark an investigation as successfully completed."""

        completed_at = InvestigationOrchestrator._now()

        investigation.status = InvestigationStatus.COMPLETED
        investigation.completed_at = completed_at
        investigation.updated_at = completed_at
        investigation.error_message = None

    @staticmethod
    def _fail_investigation(
        *,
        investigation: Investigation,
        error_message: str,
    ) -> None:
        """Mark an investigation as failed."""

        investigation.status = InvestigationStatus.FAILED
        investigation.error_message = error_message
        investigation.updated_at = (
            InvestigationOrchestrator._now()
        )

    @staticmethod
    def _now() -> datetime:
        """Return the current timezone-aware UTC timestamp."""

        return datetime.now(timezone.utc)
