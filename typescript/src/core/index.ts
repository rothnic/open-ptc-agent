/**
 * PTC Core Module.
 *
 * This module provides core functionality for the PTC agent,
 * mirroring the Python ptc_core package:
 *
 * - mcp_registry - MCP server and tool management
 * - security - Security validation and utilities
 */

export {
  MCPRegistry,
  getMCPRegistry,
  resetMCPRegistry,
  type MCPTool,
  type MCPServerConfig,
} from "./mcp_registry.js";

export {
  validateCommand,
  validatePath,
  sanitizeInput,
  DEFAULT_SECURITY_CONFIG,
  type SecurityConfig,
} from "./security.js";
