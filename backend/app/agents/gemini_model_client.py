"""Gemini client for generating validated structured responses via Vertex AI."""

from __future__ import annotations

import asyncio
import json
import logging
import os
import random
from typing import Any, TypeVar

from google import genai
from google.genai import errors, types
from pydantic import BaseModel, ValidationError


logger = logging.getLogger(__name__)

ResponseModel = TypeVar(
    "ResponseModel",
    bound=BaseModel,
)

_TRANSIENT_STATUS_CODES = {
    408,  # Request Timeout
    429,  # Too Many Requests
    500,  # Internal Server Error
    502,  # Bad Gateway
    503,  # Service Unavailable
    504,  # Gateway Timeout
}


class GeminiModelClient:
    """Generate validated structured responses using Gemini through Vertex AI."""

    def __init__(
        self,
        *,
        project_id: str | None = None,
        location: str | None = None,
        model_name: str | None = None,
        max_attempts: int | None = None,
        initial_retry_delay_seconds: float | None = None,
        structured_max_attempts: int | None = None,
        request_timeout_seconds: float | None = None,
    ) -> None:
        """Initialize the Gemini Vertex AI client.

        Args:
            project_id:
                Google Cloud project ID. When omitted, the value is read from
                GOOGLE_CLOUD_PROJECT or GCP_PROJECT_ID.

            location:
                Vertex AI region. When omitted, the value is read from
                GOOGLE_CLOUD_LOCATION. Defaults to us-central1.

            model_name:
                Gemini model ID. When omitted, the value is read from
                GEMINI_MODEL.

            max_attempts:
                Maximum number of attempts for transient API failures.

            initial_retry_delay_seconds:
                Initial delay used for exponential retry backoff.

            structured_max_attempts:
                Maximum number of attempts to produce valid structured JSON.

            request_timeout_seconds:
                Timeout for each Gemini request.
        """
        resolved_project_id = (
            project_id
            or os.getenv("GOOGLE_CLOUD_PROJECT")
            or os.getenv("GCP_PROJECT_ID")
        )

        if not resolved_project_id:
            raise ValueError(
                "Google Cloud project is not configured. "
                "Set GOOGLE_CLOUD_PROJECT or pass project_id."
            )

        resolved_location = (
            location
            or os.getenv("GOOGLE_CLOUD_LOCATION")
            or "us-central1"
        )

        self._project_id = resolved_project_id
        self._location = resolved_location

        self._model_name = (
            model_name
            or os.getenv("GEMINI_MODEL")
            or "gemini-3.5-flash"
        )

        self._max_attempts = (
            max_attempts
            if max_attempts is not None
            else self._read_int_environment_variable(
                name="GEMINI_MAX_ATTEMPTS",
                default=5,
            )
        )

        self._structured_max_attempts = (
            structured_max_attempts
            if structured_max_attempts is not None
            else self._read_int_environment_variable(
                name="GEMINI_STRUCTURED_MAX_ATTEMPTS",
                default=3,
            )
        )

        self._initial_retry_delay_seconds = (
            initial_retry_delay_seconds
            if initial_retry_delay_seconds is not None
            else self._read_float_environment_variable(
                name="GEMINI_INITIAL_RETRY_DELAY_SECONDS",
                default=2.0,
            )
        )

        self._request_timeout_seconds = (
            request_timeout_seconds
            if request_timeout_seconds is not None
            else self._read_float_environment_variable(
                name="GEMINI_REQUEST_TIMEOUT_SECONDS",
                default=120.0,
            )
        )

        self._validate_configuration()

        self._client = genai.Client(
            vertexai=True,
            project=self._project_id,
            location=self._location,
        )

        logger.info(
            "Gemini Vertex AI client initialized. "
            "project=%s location=%s model=%s",
            self._project_id,
            self._location,
            self._model_name,
        )

    async def generate_structured(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        response_model: type[ResponseModel],
    ) -> ResponseModel:
        """Generate, repair, and validate a structured Gemini response.

        Gemini is instructed to return JSON conforming to the supplied
        Pydantic response model. Invalid JSON or schema validation failures
        are retried with a corrective prompt.

        Args:
            system_prompt:
                System-level instructions for Gemini.

            user_prompt:
                User request and trusted investigation context.

            response_model:
                Pydantic model that defines the required response schema.

        Returns:
            A validated instance of response_model.

        Raises:
            RuntimeError:
                When Gemini does not return valid structured output after all
                configured attempts.
        """
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.1,
            response_mime_type="application/json",
            response_json_schema=response_model.model_json_schema(),
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

            logger.debug(
                "Raw Gemini response received. attempt=%s response=%s",
                attempt,
                response_text,
            )

            try:
                response_data = json.loads(response_text)

                normalized_response_data = self._normalize_strings(
                    response_data
                )

                return response_model.model_validate(
                    normalized_response_data
                )

            except json.JSONDecodeError as exc:
                last_error = exc

                failure_reason = (
                    "The previous response was incomplete or invalid JSON. "
                    f"JSON parser error: {exc}"
                )

                logger.warning(
                    "Gemini returned invalid JSON. "
                    "structured_attempt=%s/%s error=%s",
                    attempt,
                    self._structured_max_attempts,
                    exc,
                )

            except ValidationError as exc:
                last_error = exc

                failure_reason = (
                    "The previous JSON did not match the required "
                    f"{response_model.__name__} schema. "
                    f"Validation error: {exc}"
                )

                logger.warning(
                    "Gemini response failed Pydantic validation. "
                    "structured_attempt=%s/%s model=%s error=%s",
                    attempt,
                    self._structured_max_attempts,
                    response_model.__name__,
                    exc,
                )

            if attempt >= self._structured_max_attempts:
                break

            current_prompt = self._build_structured_repair_prompt(
                original_prompt=user_prompt,
                failure_reason=failure_reason,
                previous_response=response_text,
            )

            delay_seconds = min(
                1.0,
                self._retry_delay_seconds(attempt),
            )

            await asyncio.sleep(delay_seconds)

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
        last_error: Exception | None = None

        for attempt in range(
            1,
            self._max_attempts + 1,
        ):
            try:
                response = await asyncio.wait_for(
                    self._client.aio.models.generate_content(
                        model=self._model_name,
                        contents=user_prompt,
                        config=config,
                    ),
                    timeout=self._request_timeout_seconds,
                )

                response_text = response.text

                if not response_text:
                    raise RuntimeError(
                        "Gemini returned an empty response."
                    )

                return response_text.strip()

            except asyncio.TimeoutError as exc:
                last_error = exc

                if attempt >= self._max_attempts:
                    raise RuntimeError(
                        "Gemini request timed out after "
                        f"{self._max_attempts} attempts."
                    ) from exc

                delay_seconds = self._retry_delay_seconds(
                    attempt
                )

                logger.warning(
                    "Gemini request timed out after %.1f seconds. "
                    "Retrying in %.1f seconds. attempt=%s/%s",
                    self._request_timeout_seconds,
                    delay_seconds,
                    attempt,
                    self._max_attempts,
                )

                await asyncio.sleep(delay_seconds)

            except errors.APIError as exc:
                last_error = exc

                status_code = self._get_api_error_status_code(
                    exc
                )

                should_retry = (
                    status_code in _TRANSIENT_STATUS_CODES
                    and attempt < self._max_attempts
                )

                if not should_retry:
                    logger.exception(
                        "Gemini API request failed. "
                        "status=%s attempt=%s/%s",
                        status_code,
                        attempt,
                        self._max_attempts,
                    )
                    raise

                delay_seconds = self._retry_delay_seconds(
                    attempt
                )

                logger.warning(
                    "Gemini request failed with transient status %s. "
                    "Retrying in %.1f seconds. attempt=%s/%s",
                    status_code,
                    delay_seconds,
                    attempt,
                    self._max_attempts,
                )

                await asyncio.sleep(delay_seconds)

            except Exception as exc:
                last_error = exc

                logger.exception(
                    "Unexpected Gemini request failure. "
                    "attempt=%s/%s",
                    attempt,
                    self._max_attempts,
                )

                raise

        raise RuntimeError(
            "Gemini request failed after all retry attempts."
        ) from last_error

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
        """Collapse excessive whitespace in generated strings."""
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
        """Calculate exponential backoff with light random jitter."""
        base_delay = (
            self._initial_retry_delay_seconds
            * (2 ** (attempt - 1))
        )

        maximum_jitter = min(
            1.0,
            base_delay * 0.25,
        )

        jitter = random.uniform(
            0.0,
            maximum_jitter,
        )

        return base_delay + jitter

    def _validate_configuration(self) -> None:
        """Validate retry and timeout configuration."""
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
                "GEMINI_INITIAL_RETRY_DELAY_SECONDS cannot be negative."
            )

        if self._request_timeout_seconds <= 0:
            raise ValueError(
                "GEMINI_REQUEST_TIMEOUT_SECONDS must be greater than zero."
            )

    @staticmethod
    def _read_int_environment_variable(
        *,
        name: str,
        default: int,
    ) -> int:
        """Read an integer environment variable with a clear error."""
        raw_value = os.getenv(name)

        if raw_value is None:
            return default

        try:
            return int(raw_value)
        except ValueError as exc:
            raise ValueError(
                f"{name} must be a valid integer. "
                f"Received: {raw_value!r}"
            ) from exc

    @staticmethod
    def _read_float_environment_variable(
        *,
        name: str,
        default: float,
    ) -> float:
        """Read a floating-point environment variable with a clear error."""
        raw_value = os.getenv(name)

        if raw_value is None:
            return default

        try:
            return float(raw_value)
        except ValueError as exc:
            raise ValueError(
                f"{name} must be a valid number. "
                f"Received: {raw_value!r}"
            ) from exc

    @staticmethod
    def _get_api_error_status_code(
        error: errors.APIError,
    ) -> int | None:
        """Safely extract the HTTP status code from a Gemini API error."""
        status_code = getattr(
            error,
            "code",
            None,
        )

        if isinstance(status_code, int):
            return status_code

        try:
            return int(status_code)
        except (TypeError, ValueError):
            return None