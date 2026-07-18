"""Gemini Developer API implementation of the model client."""

import json
import os
from typing import TypeVar

from google import genai
from google.genai import types
from pydantic import BaseModel


ResponseModel = TypeVar(
    "ResponseModel",
    bound=BaseModel,
)


class GeminiModelClient:
    """Generate structured responses using the Gemini Developer API."""

    def __init__(
        self,
        *,
        api_key: str | None = None,
        model_name: str | None = None,
    ) -> None:
        resolved_api_key = (
            api_key
            or os.getenv("GEMINI_API_KEY")
        )

        if not resolved_api_key:
            raise ValueError(
                "GEMINI_API_KEY must be configured."
            )

        self._model_name = (
            model_name
            or os.getenv(
                "GEMINI_MODEL",
                "gemini-flash-latest",
            )
        )

        self._client = genai.Client(
            api_key=resolved_api_key
        )

    async def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        response_model: type[ResponseModel],
    ) -> ResponseModel:
        """Generate and validate a structured model response."""

        response = await self._client.aio.models.generate_content(
            model=self._model_name,
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.1,
                response_mime_type="application/json",
                response_schema=response_model,
            ),
        )

        if not response.text:
            raise RuntimeError(
                "Gemini returned an empty response."
            )

        try:
            response_data = json.loads(response.text)
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                "Gemini returned invalid JSON."
            ) from exc

        return response_model.model_validate(
            response_data
        )