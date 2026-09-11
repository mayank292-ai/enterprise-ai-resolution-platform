"""Tests for the verification specialist."""

from unittest.mock import Mock
from uuid import uuid4

from app.agents.verification_agent import VerificationAgent
from app.models import Investigation
from app.models.investigation_outputs import (
    HypothesisUpdate,
    HypothesisUpdateStatus,
    InvestigationFinding,
    SpecialistAssignmentOutcome,
    TrustedToolExecution,
)


def test_verification_prompt_includes_persisted_context() -> None:
    """Verification should receive the findings it must validate."""

    decision_id = uuid4()
    investigation = Investigation(
        workspace_id=uuid4(),
        incident_title="Payments remain pending",
        incident_description=(
            "Payments fail publication after a producer release."
        ),
        findings=[
            InvestigationFinding(
                title="Publication failure",
                explanation=(
                    "Version 4.8.0 timed out while 4.7.2 succeeded."
                ),
            )
        ],
        hypothesis_updates=[
            HypothesisUpdate(
                statement="The publication failure blocks settlement.",
                status=HypothesisUpdateStatus.SUPPORTED,
                confidence=0.9,
                reasoning="Affected lifecycles fail at publication.",
            )
        ],
        open_questions=[
            "Which deployment change caused the timeout?"
        ],
        specialist_recommendations=[
            "Inspect the producer deployment change."
        ],
        specialist_outcomes=[
            SpecialistAssignmentOutcome(
                decision_id=decision_id,
                agent_name="payment_investigation_agent",
                summary="Three affected payments were identified.",
                confidence=0.9,
            )
        ],
        tool_execution_trace=[
            TrustedToolExecution(
                step_number=1,
                agent_name="payment_investigation_agent",
                decision_id=decision_id,
                tool_name="compare_payment_cohorts",
                purpose="Compare successful and failed payments.",
                reasoning="Identify the differentiating producer version.",
                result={
                    "failed_version": "4.8.0",
                    "successful_version": "4.7.2",
                },
            )
        ],
    )
    agent = VerificationAgent(
        model_client=Mock(),
        tool_catalog=Mock(),
    )

    prompt = agent.build_user_prompt(
        investigation=investigation,
        objective="Verify the strongest supported conclusion.",
        evidence_needed=["Independent verification"],
    )

    assert "COMPLETE PERSISTED VERIFICATION CONTEXT" in prompt
    assert "Publication failure" in prompt
    assert "The publication failure blocks settlement." in prompt
    assert "Inspect the producer deployment change." in prompt
    assert "Three affected payments were identified." in prompt
    assert "compare_payment_cohorts" in prompt
    assert '"failed_version": "4.8.0"' in prompt
