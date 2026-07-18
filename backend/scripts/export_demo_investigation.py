"""Export the demo investigation for frontend mock development."""

from pathlib import Path

from app.services.demo_investigation import (
    create_demo_investigation,
)


def main() -> None:
    """Write the frontend investigation fixture."""

    repository_root = Path(__file__).resolve().parents[2]

    output_path = (
        repository_root
        / "frontend"
        / "src"
        / "mocks"
        / "investigation.json"
    )

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    investigation = create_demo_investigation()

    output_path.write_text(
        investigation.model_dump_json(indent=2),
        encoding="utf-8",
    )

    print(f"Created: {output_path}")


if __name__ == "__main__":
    main()