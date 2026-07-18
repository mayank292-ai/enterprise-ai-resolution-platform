"""Common contract for executable specialist agents."""

from typing import Protocol

from app.models import Evidence, Investigation


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
    ) -> list[Evidence]:
        """Investigate one objective and return factual evidence."""