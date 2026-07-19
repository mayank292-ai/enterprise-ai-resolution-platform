"""Run the Supervisor with a real Gemini model."""

import asyncio
from uuid import uuid4

from app.agents import (
    GeminiModelClient,
    SupervisorAgent,
    create_default_agent_registry,
)
from app.models import Investigation


async def main() -> None:
    """Ask the Supervisor to choose its first real action."""

    supervisor = SupervisorAgent(
        model_client=GeminiModelClient(),
        agent_registry=create_default_agent_registry(),
    )

    investigation = Investigation(
        workspace_id=uuid4(),
        incident_title=(
            "Cross-border settlement dashboard mismatch"
        ),
        incident_description=(
            "Treasury reports that several high-value "
            "cross-border payments are absent from the "
            "downstream settlement dashboard, although "
            "operations believes the original payment "
            "processing completed successfully."
        ),
    )

    action = await supervisor.choose_next_action(
        investigation
    )

    print(action.model_dump_json(indent=2))


if __name__ == "__main__":
    asyncio.run(main())