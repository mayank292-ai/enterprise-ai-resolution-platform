"""Run one real AI-powered payment investigation."""

import asyncio
import json
from uuid import uuid4

from app.agents.agent_executor import AgentExecutor
from app.agents.agent_registry import (
    create_payment_agent_registry,
)
from app.agents.gemini_model_client import GeminiModelClient
from app.agents.specialist_agent_registry import (
    create_default_specialist_registry,
)
from app.agents.supervisor_agent import SupervisorAgent
from app.models import Investigation
from app.services.investigation_orchestrator import (
    InvestigationOrchestrator,
)


async def main() -> None:
    """Run the payment investigation vertical slice."""

    model_client = GeminiModelClient()

    supervisor_registry = create_payment_agent_registry()

    specialist_registry = create_default_specialist_registry(
        model_client=model_client,
    )

    supervisor = SupervisorAgent(
        model_client=model_client,
        agent_registry=supervisor_registry,
    )

    executor = AgentExecutor(
        specialist_registry=specialist_registry,
    )

    orchestrator = InvestigationOrchestrator(
        supervisor=supervisor,
        agent_executor=executor,
    )

    investigation = Investigation(
        workspace_id=uuid4(),
        incident_title=(
            "Payments completed processing but failed downstream "
            "publication"
        ),
        incident_description=(
            "Operations observed that several payments completed core "
            "payment processing, but downstream publication outcomes "
            "show failures. Determine the affected payment population, "
            "identify meaningful patterns, and establish the most likely "
            "explanation using the available trusted payment data."
        ),
    )

    print_section(
        "INCIDENT",
        {
            "investigation_id": str(
                investigation.investigation_id
            ),
            "title": investigation.incident_title,
            "description": investigation.incident_description,
        },
    )

    orchestration_result = await orchestrator.run_next_action(
        investigation
    )

    print_section(
        "SUPERVISOR ACTION",
        orchestration_result.action.model_dump(
            mode="json"
        ),
    )

    if orchestration_result.specialist_result is not None:
        print_section(
            "SPECIALIST RESULT",
            orchestration_result.specialist_result.model_dump(
                mode="json"
            ),
        )

    print_section(
        "FINAL INVESTIGATION STATE",
        investigation.model_dump(mode="json"),
    )


def print_section(
    title: str,
    content: object,
) -> None:
    """Print one formatted runner section."""

    print("\n")
    print("=" * 80)
    print(title)
    print("=" * 80)

    print(
        json.dumps(
            content,
            indent=2,
            default=str,
        )
    )


if __name__ == "__main__":
    asyncio.run(main())