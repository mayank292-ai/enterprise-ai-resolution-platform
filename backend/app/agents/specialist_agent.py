"""Common contract for executable specialist agents."""

from typing import Protocol

from app.models import (
    Investigation,
    SpecialistInvestigationResult,
)


class SpecialistAgent(Protocol):
    """Contract implemented by every executable specialist agent."""

    @property
    def name(self) -> str:
        """Return the unique registered name of the specialist."""

    async def investigate(
        self,
        *,
        investigation: Investigation,
        objective: str,
        evidence_needed: list[str],
    ) -> SpecialistInvestigationResult:
        """Investigate one objective and return a structured result."""