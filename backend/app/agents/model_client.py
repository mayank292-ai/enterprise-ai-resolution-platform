"""Provider-independent interface for structured language-model calls."""

from typing import Protocol, TypeVar

from pydantic import BaseModel


ResponseModel = TypeVar(
    "ResponseModel",
    bound=BaseModel,
)


class StructuredModelClient(Protocol):
    """Contract required by agents that use a language model."""

    async def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        response_model: type[ResponseModel],
    ) -> ResponseModel:
        """Generate and validate a structured model response."""