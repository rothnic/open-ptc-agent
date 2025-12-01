"""Agent middleware components.

This module provides middleware for:
- Background/async subagent execution
- Vision/image handling for multimodal LLMs
"""

from src.agent.middleware.background import (
    BackgroundTask,
    BackgroundTaskRegistry,
    BackgroundSubagentMiddleware,
    BackgroundSubagentOrchestrator,
    ToolCallCounterMiddleware,
    create_wait_tool,
    create_check_task_progress_tool,
)
from src.agent.middleware.view_image_middleware import (
    ViewImageMiddleware,
    create_view_image_tool,
    validate_image_url,
)

__all__ = [
    # Background subagent execution
    "BackgroundTask",
    "BackgroundTaskRegistry",
    "BackgroundSubagentMiddleware",
    "BackgroundSubagentOrchestrator",
    "ToolCallCounterMiddleware",
    "create_wait_tool",
    "create_check_task_progress_tool",
    # Vision/image handling
    "ViewImageMiddleware",
    "create_view_image_tool",
    "validate_image_url",
]
