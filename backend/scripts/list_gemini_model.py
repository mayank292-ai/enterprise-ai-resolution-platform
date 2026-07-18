"""List Gemini models available to the configured API key."""

import os

from google import genai


def main() -> None:
    """Print models that support content generation."""

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY must be configured."
        )

    client = genai.Client(api_key=api_key)

    for model in client.models.list():
        actions = getattr(
            model,
            "supported_actions",
            [],
        ) or []

        if "generateContent" in actions:
            print(model.name)


if __name__ == "__main__":
    main()