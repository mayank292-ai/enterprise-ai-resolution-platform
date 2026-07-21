"""Gemini implementation of the structured model client."""

import asyncio
import json
import os
import random
from typing import TypeVar

from google import genai
from google.genai import errors, types
from pydantic import BaseModel, ValidationError


ResponseModel = TypeVar(
    "ResponseModel",
    bound=BaseModel,
)

_TRANSIENT_STATUS_CODES = {
    429,
    500,
    502,
    503,
    504,
}


class GeminiModelClient:
    """Generate validated structured responses using Gemini."""

    def __init__(
        self,
        *,
        api_key: str | None = None,
        model_name: str | None = None,
        max_attempts: int | None = None,
        initial_retry_delay_seconds: float | None = None,
    ) -> None:
        resolved_api_key = api_key or os.getenv(
            "GEMINI_API_KEY"
        )

        if not resolved_api_key:
            raise ValueError(
                "GEMINI_API_KEY must be configured."
            )

        self._model_name = model_name or os.getenv(
            "GEMINI_MODEL",
            "gemini-3.5-flash",
        )

        self._max_attempts = (
            max_attempts
            if max_attempts is not None
            else int(
                os.getenv(
                    "GEMINI_MAX_ATTEMPTS",
                    "5",
                )
            )
        )

        self._initial_retry_delay_seconds = (
            initial_retry_delay_seconds
            if initial_retry_delay_seconds is not None
            else float(
                os.getenv(
                    "GEMINI_INITIAL_RETRY_DELAY_SECONDS",
                    "2",
                )
            )
        )

        if self._max_attempts < 1:
            raise ValueError(
                "GEMINI_MAX_ATTEMPTS must be at least 1."
            )

        if self._initial_retry_delay_seconds < 0:
            raise ValueError(
                "GEMINI_INITIAL_RETRY_DELAY_SECONDS "
                "cannot be negative."
            )

        self._client = genai.Client(
            api_key=resolved_api_key,
        )

    async def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        response_model: type[ResponseModel],
    ) -> ResponseModel:
        """Generate and validate a structured model response."""

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.1,
            response_mime_type="application/json",
            response_json_schema=(
                response_model.model_json_schema()
            ),
        )

        response_text = await self._generate_content(
            user_prompt=user_prompt,
            config=config,
        )

        try:
            response_data = json.loads(response_text)
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                "Gemini returned invalid JSON."
            ) from exc

        try:
            return response_model.model_validate(
                response_data
            )
        except ValidationError as exc:
            raise RuntimeError(
                "Gemini returned JSON that did not match "
                f"{response_model.__name__}."
            ) from exc

    async def _generate_content(
        self,
        *,
        user_prompt: str,
        config: types.GenerateContentConfig,
    ) -> str:
        """Call Gemini with retries for transient API failures."""

        for attempt in range(1, self._max_attempts + 1):
            try:
                response = (
                    await self._client.aio.models.generate_content(
                        model=self._model_name,
                        contents=user_prompt,
                        config=config,
                    )
                )

                if not response.text:
                    raise RuntimeError(
                        "Gemini returned an empty response."
                    )

                return response.text

            except errors.APIError as exc:
                status_code = exc.code

                should_retry = (
                    status_code in _TRANSIENT_STATUS_CODES
                    and attempt < self._max_attempts
                )

                if not should_retry:
                    raise

                delay_seconds = self._retry_delay_seconds(
                    attempt
                )

                print(
                    "Gemini request failed with transient "
                    f"status {status_code}. Retrying in "
                    f"{delay_seconds:.1f} seconds "
                    f"({attempt}/{self._max_attempts})."
                )

                await asyncio.sleep(delay_seconds)

        raise RuntimeError(
            "Gemini request failed after all retry attempts."
        )

    def _retry_delay_seconds(
        self,
        attempt: int,
    ) -> float:
        """Calculate exponential backoff with light jitter."""

        base_delay = (
            self._initial_retry_delay_seconds
            * (2 ** (attempt - 1))
        )

        jitter = random.uniform(
            0,
            min(1.0, base_delay * 0.25),
        )

        return base_delay + jitter