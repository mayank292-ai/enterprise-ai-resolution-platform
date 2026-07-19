"""Registry and execution layer for trusted agent tools."""

import inspect
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any


ToolFunction = Callable[..., Any]


@dataclass(frozen=True)
class ToolDefinition:
    """Description of one trusted tool available to an AI agent."""

    name: str
    description: str
    input_schema: dict[str, Any]

    def to_prompt_dict(self) -> dict[str, Any]:
        """Return the model-facing tool description."""

        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.input_schema,
        }


@dataclass(frozen=True)
class RegisteredTool:
    """Trusted tool definition and its executable function."""

    definition: ToolDefinition
    function: ToolFunction


class TrustedToolCatalog:
    """Stores and safely executes approved agent tools."""

    def __init__(self) -> None:
        self._tools: dict[str, RegisteredTool] = {}

    def register(
        self,
        *,
        definition: ToolDefinition,
        function: ToolFunction,
    ) -> None:
        """Register one trusted executable tool."""

        if definition.name in self._tools:
            raise ValueError(
                f"Tool '{definition.name}' is already registered."
            )

        self._tools[definition.name] = RegisteredTool(
            definition=definition,
            function=function,
        )

    def contains(
        self,
        tool_name: str,
    ) -> bool:
        """Return whether a trusted tool is registered."""

        return tool_name in self._tools

    def list_definitions(self) -> list[ToolDefinition]:
        """Return model-facing definitions for all trusted tools."""

        return [
            registered_tool.definition
            for registered_tool in self._tools.values()
        ]

    def build_model_catalog(self) -> list[dict[str, Any]]:
        """Return serializable tool definitions for the model."""

        return [
            definition.to_prompt_dict()
            for definition in self.list_definitions()
        ]

    async def execute(
        self,
        *,
        tool_name: str,
        arguments: dict[str, Any],
    ) -> Any:
        """Validate and execute one registered trusted tool."""

        registered_tool = self._tools.get(tool_name)

        if registered_tool is None:
            raise ValueError(
                f"Unknown or unapproved tool '{tool_name}'."
            )

        try:
            result = registered_tool.function(**arguments)
        except TypeError as exc:
            raise ValueError(
                f"Invalid arguments for tool '{tool_name}': "
                f"{exc}"
            ) from exc

        if inspect.isawaitable(result):
            return await result

        return result