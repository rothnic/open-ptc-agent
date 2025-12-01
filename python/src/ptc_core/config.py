"""Configuration management for Open PTC Agent core infrastructure.

This module loads core configuration from config.yaml:
- Daytona sandbox settings
- MCP server configurations
- Filesystem access settings
- Security settings
- Logging settings

Credentials are loaded from .env file.
LLM configuration is handled separately in src/agent/config.py.
"""

import asyncio
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

from src.utils.config_loader import (
    create_daytona_config,
    create_filesystem_config,
    create_logging_config,
    create_mcp_config,
    create_security_config,
    load_dotenv_async,
    load_yaml_file,
    validate_required_sections,
)


class DaytonaConfig(BaseModel):
    """Daytona sandbox configuration."""

    api_key: str  # Loaded from .env
    base_url: str  # From config.yaml
    auto_stop_interval: int  # From config.yaml
    auto_archive_interval: int  # From config.yaml
    auto_delete_interval: int  # From config.yaml
    python_version: str  # From config.yaml

    # Snapshot configuration for faster sandbox initialization
    snapshot_enabled: bool = True  # From config.yaml (optional, default: True)
    snapshot_name: Optional[str] = None  # From config.yaml (optional)
    snapshot_auto_create: bool = True  # From config.yaml (optional, default: True)


class SecurityConfig(BaseModel):
    """Security configuration for code execution."""

    max_execution_time: int  # From config.yaml
    max_code_length: int  # From config.yaml
    max_file_size: int  # From config.yaml
    enable_code_validation: bool  # From config.yaml
    allowed_imports: List[str]  # From config.yaml
    blocked_patterns: List[str]  # From config.yaml


class MCPServerConfig(BaseModel):
    """Configuration for a single MCP server."""

    name: str
    enabled: bool = True  # Whether this server is enabled (default: True)
    description: str = ""  # What the MCP server does
    instruction: str = ""  # When/how to use this server
    transport: Literal["stdio", "sse", "http"] = "stdio"
    command: Optional[str] = None
    args: List[str] = Field(default_factory=list)
    env: Dict[str, str] = Field(default_factory=dict)
    url: Optional[str] = None  # For SSE/HTTP transports
    tool_exposure_mode: Optional[Literal["summary", "detailed"]] = None  # Per-server override


class MCPConfig(BaseModel):
    """MCP server configurations."""

    servers: List[MCPServerConfig]  # From config.yaml
    tool_discovery_enabled: bool  # From config.yaml
    lazy_load: Optional[bool] = True  # From config.yaml (optional)
    cache_duration: Optional[int] = None  # From config.yaml (optional)
    tool_exposure_mode: Literal["summary", "detailed"] = "summary"  # From config.yaml (optional)


class LoggingConfig(BaseModel):
    """Logging configuration."""

    level: str  # From config.yaml
    file: str  # From config.yaml


class FilesystemConfig(BaseModel):
    """Filesystem access configuration for first-class filesystem tools."""

    working_directory: str = "/home/daytona"  # Root for virtual path normalization
    allowed_directories: List[str]  # From config.yaml
    enable_path_validation: bool = True  # From config.yaml (optional, default: True)


class CoreConfig(BaseModel):
    """Core infrastructure configuration.

    Contains settings for sandbox, MCP servers, filesystem, security, and logging.
    LLM configuration is handled separately in src/agent/config.py.
    """

    model_config = ConfigDict(arbitrary_types_allowed=True)

    # Sub-configurations
    daytona: DaytonaConfig
    security: SecurityConfig
    mcp: MCPConfig
    logging: LoggingConfig
    filesystem: FilesystemConfig

    @classmethod
    async def load(
        cls,
        config_file: Optional[Path] = None,
        env_file: Optional[Path] = None,
    ) -> "CoreConfig":
        """Load core configuration from config.yaml and credentials from .env.

        Uses aiofiles for non-blocking I/O. Call with `await CoreConfig.load()`.

        Args:
            config_file: Optional path to config.yaml file (default: ./config.yaml)
            env_file: Optional path to .env file (default: ./.env)

        Returns:
            Configured CoreConfig instance

        Raises:
            FileNotFoundError: If config.yaml is not found
            ValueError: If required configuration is missing or invalid
            KeyError: If required fields are missing from config files
        """
        # Determine file paths
        if config_file is None:
            cwd = await asyncio.to_thread(Path.cwd)
            config_file = cwd / "config.yaml"

        # Load environment variables for credentials
        await load_dotenv_async(env_file)

        # Load config.yaml asynchronously
        config_data = await load_yaml_file(config_file)

        # Validate that all required sections exist in config.yaml
        required_sections = ["daytona", "security", "mcp", "logging", "filesystem"]
        validate_required_sections(config_data, required_sections)

        # Load configurations using shared factory functions
        daytona_config = create_daytona_config(config_data["daytona"])
        security_config = create_security_config(config_data["security"])
        mcp_config = create_mcp_config(config_data["mcp"])
        logging_config = create_logging_config(config_data["logging"])
        filesystem_config = create_filesystem_config(config_data["filesystem"])

        # Create config object
        config = cls(
            daytona=daytona_config,
            security=security_config,
            mcp=mcp_config,
            logging=logging_config,
            filesystem=filesystem_config,
        )

        return config

    def validate_api_keys(self) -> None:
        """Validate that required API keys are present.

        Raises:
            ValueError: If required API keys are missing
        """
        missing_keys = []

        if not self.daytona.api_key:
            missing_keys.append("DAYTONA_API_KEY")

        if missing_keys:
            raise ValueError(
                f"Missing required credentials in .env file:\n"
                f"  - {chr(10).join(missing_keys)}\n"
                f"Please add these credentials to your .env file."
            )
