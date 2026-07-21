"""Construct and own the application runtime."""

from dataclasses import dataclass

from app.agents.agent_executor import AgentExecutor
from app.agents.agent_registry import (
    AgentRegistry,
    create_payment_agent_registry,
)
from app.agents.gemini_model_client import GeminiModelClient
from app.agents.model_client import StructuredModelClient
from app.agents.specialist_agent_registry import (
    SpecialistAgentRegistry,
    create_default_specialist_registry,
)
from app.agents.supervisor_agent import SupervisorAgent
from app.services.capability_provisioning_service import (
    CapabilityProvisioningService,
)
from app.services.investigation_orchestrator import (
    InvestigationOrchestrator,
)
from app.services.investigation_service import InvestigationService


@dataclass(slots=True)
class ApplicationRuntime:
    """Own shared application services and AI components."""

    investigation_service: InvestigationService
    orchestrator: InvestigationOrchestrator
    capability_provisioning_service: (
        CapabilityProvisioningService
    )
    supervisor_registry: AgentRegistry
    specialist_registry: SpecialistAgentRegistry


def create_runtime() -> ApplicationRuntime:
    """Create the shared application runtime."""

    model_client: StructuredModelClient = GeminiModelClient()

    # Temporary restricted supervisor registry.
    # Replace with create_default_agent_registry() once all default
    # advertised agents have executable implementations.
    supervisor_registry = create_payment_agent_registry()

    specialist_registry = create_default_specialist_registry(
        model_client=model_client,
    )

    supervisor = SupervisorAgent(
        model_client=model_client,
        agent_registry=supervisor_registry,
    )

    agent_executor = AgentExecutor(
        specialist_registry=specialist_registry,
    )

    orchestrator = InvestigationOrchestrator(
        supervisor=supervisor,
        agent_executor=agent_executor,
    )

    capability_provisioning_service = (
        CapabilityProvisioningService(
            model_client=model_client,
            supervisor_registry=supervisor_registry,
            specialist_registry=specialist_registry,
        )
    )

    return ApplicationRuntime(
        investigation_service=InvestigationService(),
        orchestrator=orchestrator,
        capability_provisioning_service=(
            capability_provisioning_service
        ),
        supervisor_registry=supervisor_registry,
        specialist_registry=specialist_registry,
    )