"""Gemini implementation of the structured model client."""

import asyncio
import json
import os
import random
from typing import Any, TypeVar

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
        structured_max_attempts: int | None = None,
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

        self._structured_max_attempts = (
            structured_max_attempts
            if structured_max_attempts is not None
            else int(
                os.getenv(
                    "GEMINI_STRUCTURED_MAX_ATTEMPTS",
                    "3",
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

        if self._structured_max_attempts < 1:
            raise ValueError(
                "GEMINI_STRUCTURED_MAX_ATTEMPTS must be at least 1."
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
        """Generate, repair, and validate a structured model response."""

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.1,
            response_mime_type="application/json",
            response_json_schema=(
                response_model.model_json_schema()
            ),
        )

        current_prompt = user_prompt
        last_response_text = ""
        last_error: Exception | None = None

        for attempt in range(
            1,
            self._structured_max_attempts + 1,
        ):
            response_text = await self._generate_content(
                user_prompt=current_prompt,
                config=config,
            )
            last_response_text = response_text

            print("\n===== RAW GEMINI RESPONSE =====")
            print(response_text)
            print("===== END RAW RESPONSE =====\n")

            try:
                response_data = json.loads(response_text)
                response_data = self._normalize_strings(
                    response_data
                )
                return response_model.model_validate(
                    response_data
                )

            except json.JSONDecodeError as exc:
                last_error = exc
                failure_reason = (
                    "The previous response was incomplete or invalid JSON. "
                    f"JSON parser error: {exc}"
                )

            except ValidationError as exc:
                last_error = exc
                failure_reason = (
                    "The previous JSON did not match the required "
                    f"{response_model.__name__} schema. "
                    f"Validation error: {exc}"
                )

            if attempt >= self._structured_max_attempts:
                break

            print(
                "Gemini returned an invalid structured response. "
                f"Retrying ({attempt}/"
                f"{self._structured_max_attempts})."
            )

            current_prompt = self._build_structured_repair_prompt(
                original_prompt=user_prompt,
                failure_reason=failure_reason,
                previous_response=response_text,
            )

            await asyncio.sleep(
                min(
                    1.0,
                    self._retry_delay_seconds(attempt),
                )
            )

        response_preview = last_response_text[:2000]

        raise RuntimeError(
            "Gemini failed to return a valid structured response "
            f"after {self._structured_max_attempts} attempts. "
            f"Last response preview:\n{response_preview}"
        ) from last_error

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

    def _build_structured_repair_prompt(
        self,
        *,
        original_prompt: str,
        failure_reason: str,
        previous_response: str,
    ) -> str:
        """Build a corrective prompt after malformed structured output."""

        response_preview = previous_response[:4000]

        return (
            f"{original_prompt}\n\n"
            "IMPORTANT STRUCTURED OUTPUT CORRECTION\n\n"
            f"{failure_reason}\n\n"
            "Return the answer again as exactly one complete JSON object "
            "matching the required response schema.\n"
            "Do not use Markdown code fences.\n"
            "Do not include commentary before or after the JSON object.\n"
            "Do not truncate any string or JSON structure.\n"
            "Do not add excessive blank space or repeated whitespace inside "
            "string values.\n"
            "Keep reasoning and purpose fields concise.\n"
            "Preserve only facts supported by the original prompt and trusted "
            "tool history.\n\n"
            "PREVIOUS INVALID RESPONSE PREVIEW\n"
            f"{response_preview}"
        )

    def _normalize_strings(
        self,
        value: Any,
    ) -> Any:
        """Collapse excessive whitespace in model-generated strings."""

        if isinstance(value, str):
            return " ".join(value.split())

        if isinstance(value, list):
            return [
                self._normalize_strings(item)
                for item in value
            ]

        if isinstance(value, dict):
            return {
                key: self._normalize_strings(item)
                for key, item in value.items()
            }

        return value

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