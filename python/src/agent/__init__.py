"""
Agent package - AI agent implementations using deepagent.

This package provides the PTC (Programmatic Tool Calling) agent pattern:
- Uses deepagent for orchestration and sub-agent delegation
- Integrates Daytona sandbox via DaytonaBackend
- MCP tools accessed through execute_code tool

Structure:
- agent.py: Main PTCAgent using deepagent
- backends/: Custom backends (DaytonaBackend)
- prompts/: Prompt templates (base, research)
- tools/: Custom tools (execute_code, research)
- langchain_tools/: LangChain @tool implementations (Bash, Read, Write, Edit, Glob, Grep)
- subagents/: Sub-agent definitions
"""

from .agent import PTCAgent, PTCExecutor, create_ptc_agent
from .backends import DaytonaBackend
from .config import AgentConfig
from .subagents import create_research_subagent
from src.utils.config_loader import configure_logging

__all__ = [
    "AgentConfig",
    "configure_logging",
    "PTCAgent",
    "PTCExecutor",
    "create_ptc_agent",
    "DaytonaBackend",
    "create_research_subagent",
]
