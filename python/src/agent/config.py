"""Agent configuration management.

This module contains agent-specific configuration that builds on top of
the core ptc_core configuration (sandbox, MCP).

LLM definitions are loaded from llms.json catalog.
Credentials are loaded from .env file.
"""

import asyncio
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import aiofiles
from pydantic import BaseModel, ConfigDict, Field

from src.ptc_core.config import (
    CoreConfig,
    DaytonaConfig,
    FilesystemConfig,
    LoggingConfig,
    MCPConfig,
    SecurityConfig,
)
from src.utils.config_loader import (
    configure_logging,
    create_daytona_config,
    create_filesystem_config,
    create_logging_config,
    create_mcp_config,
    create_security_config,
    load_dotenv_async,
    load_yaml_file,
    validate_required_sections,
)


class LLMDefinition(BaseModel):
    """Definition of an LLM from llms.json catalog."""

    model_id: str
    provider: str
    sdk: str  # e.g., "langchain_anthropic.ChatAnthropic"
    api_key_env: str  # Name of environment variable containing API key
    base_url: Optional[str] = None
    output_version: Optional[str] = None
    use_previous_response_id: Optional[bool] = False # Use only for OpenAI responses api endpoint
    parameters: Dict[str, Any] = Field(default_factory=dict)


class LLMConfig(BaseModel):
    """LLM configuration - references an LLM from llms.json."""

    name: str  # Name/alias from llms.json


class AgentConfig(BaseModel):
    """Agent-specific configuration.

    This config contains agent-related settings (LLM, security, logging)
    while using the core config for sandbox and MCP settings.
    """

    # Agent-specific configurations
    llm: LLMConfig
    security: SecurityConfig
    logging: LoggingConfig

    # Reference to core config (sandbox, MCP, filesystem)
    daytona: DaytonaConfig
    mcp: MCPConfig
    filesystem: FilesystemConfig

    # Tool configuration
    # If True, use custom filesystem tools (Read, Write, Edit, Glob, Grep)
    # If False, use deepagents' native middleware tools (read_file, write_file, etc.)
    use_custom_filesystem_tools: bool = True

    # Vision tool configuration
    # If True, enable view_image tool for viewing images (requires vision-capable model)
    enable_view_image: bool = True

    # Subagent configuration
    # List of enabled subagent names (available: research, general-purpose)
    subagents_enabled: List[str] = Field(default_factory=lambda: ["general-purpose"])

    # Note: deep-agent automatically enables middlewares (TodoList, Summarization, etc.)

    model_config = ConfigDict(arbitrary_types_allowed=True)

    # Runtime data (not from config files)
    llm_definition: LLMDefinition = Field(default=None, exclude=True)

    @classmethod
    async def load(
        cls,
        config_file: Optional[Path] = None,
        llms_file: Optional[Path] = None,
        env_file: Optional[Path] = None,
    ) -> "AgentConfig":
        """Load agent configuration from config.yaml, llms.json, and credentials from .env.

        Uses aiofiles for non-blocking I/O. Call with `await AgentConfig.load()`.

        Args:
            config_file: Optional path to config.yaml file (default: ./config.yaml)
            llms_file: Optional path to llms.json file (default: ./llms.json)
            env_file: Optional path to .env file (default: ./.env)

        Returns:
            Configured AgentConfig instance

        Raises:
            FileNotFoundError: If config.yaml or llms.json is not found
            ValueError: If required configuration is missing or invalid
            KeyError: If required fields are missing from config files
        """
        # Determine file paths
        if config_file is None or llms_file is None:
            cwd = await asyncio.to_thread(Path.cwd)
            if config_file is None:
                config_file = cwd / "config.yaml"
            if llms_file is None:
                llms_file = cwd / "llms.json"

        # Load environment variables for credentials
        await load_dotenv_async(env_file)

        # Load llms.json asynchronously
        if not llms_file.exists():
            raise FileNotFoundError(
                f"LLM catalog not found: {llms_file}\n"
                f"Please create llms.json with LLM definitions."
            )

        try:
            async with aiofiles.open(llms_file, "r") as f:
                llms_content = await f.read()
            llms_data = json.loads(llms_content)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse llms.json: {e}")

        if "llms" not in llms_data:
            raise ValueError(
                "llms.json must have 'llms' key containing LLM definitions."
            )

        llm_catalog = {
            name: LLMDefinition(**definition)
            for name, definition in llms_data["llms"].items()
        }

        # Load config.yaml asynchronously
        config_data = await load_yaml_file(config_file)

        # Validate that all required sections exist in config.yaml
        required_sections = ["llm", "daytona", "security", "mcp", "logging", "filesystem"]
        validate_required_sections(config_data, required_sections)

        # Load LLM configuration from config.yaml
        llm_data = config_data["llm"]

        # Handle both formats: simple string or dict with name
        if isinstance(llm_data, str):
            llm_name = llm_data
        elif isinstance(llm_data, dict) and "name" in llm_data:
            llm_name = llm_data["name"]
        else:
            raise ValueError(
                "llm section must be either a string (LLM name) or dict with 'name' field"
            )

        # Look up LLM definition from catalog
        if llm_name not in llm_catalog:
            available = ", ".join(llm_catalog.keys())
            raise ValueError(
                f"LLM '{llm_name}' not found in llms.json.\n"
                f"Available LLMs: {available}"
            )

        llm_definition = llm_catalog[llm_name]

        # Create LLM config
        llm_config = LLMConfig(name=llm_name)

        # Load configurations using shared factory functions
        daytona_config = create_daytona_config(config_data["daytona"])
        security_config = create_security_config(config_data["security"])
        mcp_config = create_mcp_config(config_data["mcp"])
        logging_config = create_logging_config(config_data["logging"])
        filesystem_config = create_filesystem_config(config_data["filesystem"])

        # Configure structlog to respect the log level from config
        configure_logging(logging_config.level)

        # Load Agent configuration (optional section)
        agent_data = config_data.get("agent", {})
        use_custom_filesystem_tools = agent_data.get("use_custom_filesystem_tools", True)
        enable_view_image = agent_data.get("enable_view_image", True)

        # Load Subagent configuration (optional section)
        subagents_data = config_data.get("subagents", {})
        subagents_enabled = subagents_data.get("enabled", ["general-purpose"])

        # Create config object
        # Note: deep-agent automatically enables middlewares (TodoList, Summarization, etc.)
        config = cls(
            llm=llm_config,
            security=security_config,
            logging=logging_config,
            daytona=daytona_config,
            mcp=mcp_config,
            filesystem=filesystem_config,
            use_custom_filesystem_tools=use_custom_filesystem_tools,
            enable_view_image=enable_view_image,
            subagents_enabled=subagents_enabled,
        )

        # Store runtime data
        config.llm_definition = llm_definition

        return config

    def validate_api_keys(self) -> None:
        """Validate that required API keys are present.

        Raises:
            ValueError: If required API keys are missing
        """
        missing_keys = []

        if not self.daytona.api_key:
            missing_keys.append("DAYTONA_API_KEY")

        # Check LLM API key
        api_key = os.getenv(self.llm_definition.api_key_env, "")
        if not api_key:
            missing_keys.append(self.llm_definition.api_key_env)

        if missing_keys:
            raise ValueError(
                f"Missing required credentials in .env file:\n"
                f"  - {chr(10).join(missing_keys)}\n"
                f"Please add these credentials to your .env file."
            )

    def get_llm_client(self):
        """Create and return appropriate LLM client based on llm_definition.

        Returns:
            LangChain LLM client instance

        Raises:
            ImportError: If SDK module cannot be imported
            AttributeError: If SDK class cannot be found
        """
        # Parse SDK string (e.g., "langchain_anthropic.ChatAnthropic")
        sdk_parts = self.llm_definition.sdk.rsplit(".", 1)
        if len(sdk_parts) != 2:
            raise ValueError(
                f"Invalid SDK format: {self.llm_definition.sdk}. "
                f"Expected 'module.ClassName'"
            )

        module_name, class_name = sdk_parts

        # Dynamically import the SDK module
        try:
            module = __import__(module_name, fromlist=[class_name])
        except ImportError as e:
            raise ImportError(
                f"Failed to import SDK module '{module_name}': {e}\n"
                f"Make sure the required package is installed."
            )

        # Get the class
        try:
            llm_class = getattr(module, class_name)
        except AttributeError:
            raise AttributeError(
                f"Class '{class_name}' not found in module '{module_name}'"
            )

        # Get API key from environment
        api_key = os.getenv(self.llm_definition.api_key_env, "")

        # Build kwargs for LLM client
        kwargs = {
            "model": self.llm_definition.model_id,
            **self.llm_definition.parameters,  # Pass through all parameters
        }

        # Add API key with provider-specific parameter name
        if self.llm_definition.provider == "anthropic":
            kwargs["anthropic_api_key"] = api_key
        elif self.llm_definition.provider == "openai":
            kwargs["openai_api_key"] = api_key
        else:
            # Generic fallback (most use 'api_key')
            kwargs["api_key"] = api_key

        # Add base_url if specified
        if self.llm_definition.base_url:
            kwargs["base_url"] = self.llm_definition.base_url

        # Add output_version if specified
        if self.llm_definition.output_version:
            kwargs["output_version"] = self.llm_definition.output_version

        # Add use_previous_response_id if specified
        if self.llm_definition.use_previous_response_id:
            kwargs["use_previous_response_id"] = self.llm_definition.use_previous_response_id

        # Instantiate and return client
        return llm_class(**kwargs)

    def to_core_config(self) -> CoreConfig:
        """Convert to CoreConfig for use with SessionManager.

        Returns:
            CoreConfig instance with sandbox/MCP settings
        """
        return CoreConfig(
            daytona=self.daytona,
            security=self.security,
            mcp=self.mcp,
            logging=self.logging,
            filesystem=self.filesystem,
        )
