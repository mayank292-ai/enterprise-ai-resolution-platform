"""List Gemini models available to the configured API key."""

import os

from google import genai


def main() -> None:
    """Print models that support content generation."""

    # api_key = os.getenv("GEMINI_API_KEY")

    # if not api_key:
    #     raise ValueError(
    #         "GEMINI_API_KEY must be configured."
    #     )

    PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
    LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

    client = genai.Client(
        vertexai=True,
        project=PROJECT_ID,
        location=LOCATION,
    )
    # client = genai.Client(api_key=api_key)

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