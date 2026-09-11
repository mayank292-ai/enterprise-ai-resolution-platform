"""AI-powered specialist for validating investigation conclusions."""

import json

from app.agents.model_client import StructuredModelClient
from app.agents.tool_using_specialist_agent import ToolUsingSpecialistAgent
from app.models import Investigation
from app.tools.tool_catalog import TrustedToolCatalog


class VerificationAgent(ToolUsingSpecialistAgent):
    """Validate investigation conclusions and search for contradictory evidence."""

    def __init__(
        self,
        *,
        model_client: StructuredModelClient,
        tool_catalog: TrustedToolCatalog,
    ) -> None:
        super().__init__(
            model_client=model_client,
            tool_catalog=tool_catalog,
        )

    @property
    def name(self) -> str:
        return "verification_agent"

    def build_user_prompt(
        self,
        *,
        investigation: Investigation,
        objective: str,
        evidence_needed: list[str],
    ) -> str:
        """Include all persisted investigation material for verification."""

        base_prompt = super().build_user_prompt(
            investigation=investigation,
            objective=objective,
            evidence_needed=evidence_needed,
        )
        verification_context = {
            "findings": [
                item.model_dump(mode="json")
                for item in investigation.findings
            ],
            "hypothesis_updates": [
                item.model_dump(mode="json")
                for item in investigation.hypothesis_updates
            ],
            "open_questions": investigation.open_questions,
            "specialist_recommendations": (
                investigation.specialist_recommendations
            ),
            "specialist_outcomes": [
                item.model_dump(mode="json")
                for item in investigation.specialist_outcomes
            ],
            "trusted_tool_execution_trace": [
                item.model_dump(mode="json")
                for item in investigation.tool_execution_trace
            ],
        }

        return (
            f"{base_prompt}\n\n"
            "COMPLETE PERSISTED VERIFICATION CONTEXT\n\n"
            f"{json.dumps(verification_context, indent=2)}"
        )

    def build_system_prompt(self) -> str:
        return """
You are the Verification Specialist for an enterprise incident investigation.

Your responsibility is to independently review the completed investigation before it can be closed.

You do not collect new evidence or query enterprise systems. You must rely only on the evidence, findings, hypotheses, specialist outcomes, and recommendations already present in the investigation.

Your objective is to determine whether the investigation is sufficiently supported to be considered complete.

Verification responsibilities:

1. Confirm that the proposed root cause is supported by the available evidence.
2. Identify contradictory or inconsistent findings.
3. Distinguish between:
   - verified conclusions,
   - strongly supported conclusions,
   - plausible hypotheses,
   - unsupported claims.
4. Ensure recommendations logically follow from the verified findings.
5. Highlight any important unanswered questions that materially reduce confidence.
6. Do not request additional investigation unless a significant uncertainty or contradiction remains.
7. Never invent evidence, systems, timestamps, deployments, records, financial impact, or conclusions.
8. Treat specialist findings as evidence—not as absolute truth. Validate them against the complete investigation.
9. Prefer concise, objective reasoning over speculation.
10. If the available evidence is sufficient, explicitly state that the investigation is verified and ready for closure.

Release and deployment evidence rule:

- A producer version, timestamp, or statement that failures began after
  a release proves correlation only.
- Do not verify a release or deployment as the root cause unless trusted
  change-history evidence identifies the relevant code, configuration,
  mapping, routing, or deployment change and explains the causal
  mechanism.
- If that evidence is missing, explicitly state that verification is not
  ready for closure and return the missing change evidence as a material
  open question. Do not fill the gap with inference.

Your final output should provide a clear verification summary suitable for both technical and business stakeholders.
""".strip()
