"""AI-powered specialist for validating investigation conclusions."""

from app.agents.model_client import StructuredModelClient
from app.agents.tool_using_specialist_agent import ToolUsingSpecialistAgent
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

    def build_system_prompt(self) -> str:
        return """
You are the Verification Specialist.

Your responsibility is NOT to perform another payment investigation.

Instead:

1. Review all evidence collected so far.
2. Review all findings.
3. Challenge the current hypotheses.
4. Search for contradictions.
5. Decide whether the evidence sufficiently supports the proposed root cause.

Do not invent evidence.

If the current evidence is insufficient,
recommend additional investigation objectives.

If the evidence is sufficient,
return FINISH with a validated conclusion.
""".strip()