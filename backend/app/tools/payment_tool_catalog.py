"""Trusted tool catalog for payment investigations."""

from app.tools.payment_tools import PaymentTools
from app.tools.tool_catalog import (
    ToolDefinition,
    TrustedToolCatalog,
)


def create_payment_tool_catalog(
    *,
    payment_tools: PaymentTools,
) -> TrustedToolCatalog:
    """Create the approved payment-investigation tool catalog."""

    catalog = TrustedToolCatalog()

    catalog.register(
        definition=ToolDefinition(
            name="search_payments",
            description=(
                "Search payments using optional payment-status and "
                "currency filters. Returns matching payment records, "
                "record count, total value, and payment IDs."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "statuses": {
                        "type": ["array", "null"],
                        "items": {
                            "type": "string",
                        },
                        "description": (
                            "Optional payment statuses to include."
                        ),
                    },
                    "currencies": {
                        "type": ["array", "null"],
                        "items": {
                            "type": "string",
                        },
                        "description": (
                            "Optional currency codes to include."
                        ),
                    },
                },
                "additionalProperties": False,
            },
        ),
        function=payment_tools.search_payments,
    )

    catalog.register(
        definition=ToolDefinition(
            name="inspect_payment_lifecycle",
            description=(
                "Inspect all lifecycle events for one payment and "
                "identify any failed processing stages."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "payment_id": {
                        "type": "string",
                        "description": (
                            "Unique payment identifier."
                        ),
                    },
                },
                "required": [
                    "payment_id",
                ],
                "additionalProperties": False,
            },
        ),
        function=payment_tools.inspect_payment_lifecycle,
    )

    catalog.register(
        definition=ToolDefinition(
            name="inspect_settlement_status",
            description=(
                "Inspect settlement state and downstream publication "
                "status for one payment."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "payment_id": {
                        "type": "string",
                        "description": (
                            "Unique payment identifier."
                        ),
                    },
                },
                "required": [
                    "payment_id",
                ],
                "additionalProperties": False,
            },
        ),
        function=payment_tools.inspect_settlement_status,
    )

    catalog.register(
        definition=ToolDefinition(
            name="compare_payment_cohorts",
            description=(
                "Compare failed-publication and successful-publication "
                "payment cohorts. Returns aggregate summaries and factual "
                "differences such as producer versions and missing "
                "source-currency values."
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "failed_publication_status": {
                        "type": "string",
                        "default": "FAILED",
                        "description": (
                            "Publication status representing the "
                            "failed cohort."
                        ),
                    },
                    "successful_publication_status": {
                        "type": "string",
                        "default": "PUBLISHED",
                        "description": (
                            "Publication status representing the "
                            "successful cohort."
                        ),
                    },
                },
                "additionalProperties": False,
            },
        ),
        function=payment_tools.compare_payment_cohorts,
    )

    return catalog
