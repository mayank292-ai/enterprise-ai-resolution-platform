"""Deterministic investigation used for frontend development."""

from datetime import datetime, timezone
from uuid import UUID

from app.models import (
    AgentDecision,
    AgentExecutionStatus,
    BusinessImpact,
    CapabilityOpportunity,
    Evidence,
    EvidenceConfidence,
    Hypothesis,
    Investigation,
    InvestigationStatus,
    Recommendation,
    RootCause,
)


DEMO_WORKSPACE_ID = UUID(
    "11111111-1111-1111-1111-111111111111"
)


def create_demo_investigation() -> Investigation:
    """Return a completed payment investigation for UI development."""

    payment_evidence = Evidence(
        source="payment_events",
        title="Affected payment population identified",
        summary=(
            "Thirty-seven high-value cross-border payments "
            "were processed successfully but were not published "
            "to downstream settlement reporting."
        ),
        confidence=EvidenceConfidence.HIGH,
        data={
            "affected_count": 37,
            "affected_value": 182_450_000,
            "currency": "USD",
            "sample_payment_ids": [
                "PAY-20260718-1042",
                "PAY-20260718-1088",
                "PAY-20260718-1121",
            ],
        },
    )

    fx_evidence = Evidence(
        source="fx_conversion_service",
        title="FX enrichment was not completed",
        summary=(
            "All affected payments were missing the source-currency "
            "attribute required by the FX conversion service."
        ),
        confidence=EvidenceConfidence.HIGH,
        data={
            "failed_conversion_count": 37,
            "missing_attribute": "sourceCurrency",
        },
    )

    reference_evidence = Evidence(
        source="aminet_reference_data",
        title="Required exchange rates were available",
        summary=(
            "Valid rates existed for every required currency pair "
            "during the incident window."
        ),
        confidence=EvidenceConfidence.VERIFIED,
        data={
            "required_pairs": [
                "GBP/USD",
                "EUR/USD",
                "CHF/USD",
            ],
            "missing_pairs": [],
        },
    )

    dq_evidence = Evidence(
        source="data_quality_controls",
        title="Publication records failed mandatory validation",
        summary=(
            "The downstream publication control rejected all "
            "affected records because sourceCurrency was null."
        ),
        confidence=EvidenceConfidence.HIGH,
        data={
            "control_name": "FX_REQUIRED_ATTRIBUTES_COMPLETE",
            "failed_records": 37,
        },
    )

    change_evidence = Evidence(
        source="deployment_history",
        title="Failures began immediately after schema deployment",
        summary=(
            "Payment producer version 4.8 renamed sourceCurrency "
            "to instructedCurrency, but the downstream mapping "
            "continued reading the previous attribute."
        ),
        confidence=EvidenceConfidence.VERIFIED,
        data={
            "deployment_version": "4.8.0",
            "deployed_at": "2026-07-18T08:05:00Z",
            "old_attribute": "sourceCurrency",
            "new_attribute": "instructedCurrency",
        },
    )

    evidence = [
        payment_evidence,
        fx_evidence,
        reference_evidence,
        dq_evidence,
        change_evidence,
    ]

    decisions = [
        AgentDecision(
            agent_name="payment_investigation_agent",
            objective="Identify the affected payment population.",
            reason=(
                "The affected population and lifecycle divergence "
                "must be established first."
            ),
            status=AgentExecutionStatus.COMPLETED,
            evidence_ids=[payment_evidence.evidence_id],
            started_at=datetime(
                2026,
                7,
                18,
                13,
                1,
                tzinfo=timezone.utc,
            ),
            completed_at=datetime(
                2026,
                7,
                18,
                13,
                1,
                8,
                tzinfo=timezone.utc,
            ),
        ),
        AgentDecision(
            agent_name="fx_investigation_agent",
            objective="Inspect FX enrichment for affected payments.",
            reason=(
                "Payment processing completed, but downstream "
                "publication depends on completed conversion."
            ),
            status=AgentExecutionStatus.COMPLETED,
            evidence_ids=[fx_evidence.evidence_id],
            started_at=datetime(
                2026,
                7,
                18,
                13,
                1,
                9,
                tzinfo=timezone.utc,
            ),
            completed_at=datetime(
                2026,
                7,
                18,
                13,
                1,
                15,
                tzinfo=timezone.utc,
            ),
        ),
        AgentDecision(
            agent_name="reference_data_agent",
            objective="Confirm whether required exchange rates existed.",
            reason=(
                "Rate availability must be eliminated before "
                "concluding that payment attributes caused the failure."
            ),
            status=AgentExecutionStatus.COMPLETED,
            evidence_ids=[reference_evidence.evidence_id],
            started_at=datetime(
                2026,
                7,
                18,
                13,
                1,
                16,
                tzinfo=timezone.utc,
            ),
            completed_at=datetime(
                2026,
                7,
                18,
                13,
                1,
                21,
                tzinfo=timezone.utc,
            ),
        ),
        AgentDecision(
            agent_name="data_quality_agent",
            objective="Identify the validation blocking publication.",
            reason=(
                "FX evidence shows missing enrichment input, so "
                "downstream validation outcomes must be inspected."
            ),
            status=AgentExecutionStatus.COMPLETED,
            evidence_ids=[dq_evidence.evidence_id],
            started_at=datetime(
                2026,
                7,
                18,
                13,
                1,
                22,
                tzinfo=timezone.utc,
            ),
            completed_at=datetime(
                2026,
                7,
                18,
                13,
                1,
                28,
                tzinfo=timezone.utc,
            ),
        ),
        AgentDecision(
            agent_name="change_analysis_agent",
            objective="Correlate the failure with recent changes.",
            reason=(
                "The consistent missing attribute suggests a "
                "producer schema or mapping regression."
            ),
            status=AgentExecutionStatus.COMPLETED,
            evidence_ids=[change_evidence.evidence_id],
            started_at=datetime(
                2026,
                7,
                18,
                13,
                1,
                29,
                tzinfo=timezone.utc,
            ),
            completed_at=datetime(
                2026,
                7,
                18,
                13,
                1,
                36,
                tzinfo=timezone.utc,
            ),
        ),
    ]

    return Investigation(
        workspace_id=DEMO_WORKSPACE_ID,
        incident_title=(
            "Cross-border settlement dashboard mismatch"
        ),
        incident_description=(
            "Treasury reports that several high-value cross-border "
            "payments are absent from the downstream settlement "
            "dashboard, although core payment processing completed."
        ),
        status=InvestigationStatus.COMPLETED,
        hypotheses=[
            Hypothesis(
                statement=(
                    "Downstream publication failed after successful "
                    "payment processing."
                ),
                status="confirmed",
                supporting_evidence_ids=[
                    payment_evidence.evidence_id,
                    dq_evidence.evidence_id,
                ],
            ),
            Hypothesis(
                statement=(
                    "Reference exchange rates were unavailable."
                ),
                status="rejected",
                contradicting_evidence_ids=[
                    reference_evidence.evidence_id
                ],
            ),
            Hypothesis(
                statement=(
                    "A schema deployment introduced an incompatible "
                    "attribute mapping."
                ),
                status="confirmed",
                supporting_evidence_ids=[
                    change_evidence.evidence_id
                ],
            ),
        ],
        agent_decisions=decisions,
        evidence=evidence,
        root_cause=RootCause(
            title="Schema mapping regression blocked FX enrichment",
            explanation=(
                "Producer version 4.8 renamed sourceCurrency to "
                "instructedCurrency. The downstream mapping continued "
                "reading sourceCurrency, causing null enrichment input "
                "and rejection by the publication quality control."
            ),
            confidence=EvidenceConfidence.VERIFIED,
            evidence_ids=[
                fx_evidence.evidence_id,
                dq_evidence.evidence_id,
                change_evidence.evidence_id,
            ],
        ),
        business_impact=BusinessImpact(
            affected_records=37,
            affected_value=182_450_000,
            currency="USD",
            affected_systems=[
                "FX Conversion Service",
                "Settlement Dashboard",
                "Treasury Reconciliation",
            ],
            earliest_occurrence=datetime(
                2026,
                7,
                18,
                8,
                7,
                tzinfo=timezone.utc,
            ),
        ),
        recommendations=[
            Recommendation(
                title="Restore the compatible field mapping",
                description=(
                    "Map instructedCurrency to the downstream "
                    "source-currency contract and replay the affected "
                    "payment population."
                ),
                priority="critical",
                recommendation_type="remediation",
            ),
            Recommendation(
                title="Add schema compatibility validation",
                description=(
                    "Validate producer schema changes against downstream "
                    "required mappings before deployment."
                ),
                priority="high",
                recommendation_type="prevention",
            ),
        ],
        executive_summary=[
            (
                "Thirty-seven high-value cross-border payments worth "
                "USD 182.45 million were missing from settlement reporting."
            ),
            (
                "The payments completed core processing but failed "
                "downstream FX enrichment and publication."
            ),
            (
                "A schema rename introduced in producer version 4.8 "
                "was not reflected in the downstream mapping."
            ),
        ],
        capability_opportunity=CapabilityOpportunity(
            title="Schema Compatibility Guardian",
            problem_detected=(
                "Schema changes can be deployed without validating "
                "downstream field dependencies."
            ),
            proposed_capability=(
                "Automatically compare producer schema changes with "
                "registered downstream mappings before deployment."
            ),
            expected_benefit=(
                "Prevent mapping regressions and identify affected "
                "consumers before production release."
            ),
        ),
        completed_at=datetime.now(timezone.utc),
    )