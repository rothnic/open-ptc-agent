/**
 * Open PTC Agent - TypeScript Implementation
 *
 * A TypeScript implementation of Programmatic Tool Calling (PTC) with LangChainJS.
 * This package provides the same capabilities as the Python implementation,
 * leveraging the deepagents library for deep agent functionality.
 *
 * Configuration is driven by environment variables:
 * - PTC_DEFAULT_MODEL: Default model to use
 * - PTC_POWERFUL_MODEL: Model for complex tasks
 * - PTC_STANDARD_MODEL: Model for general use
 * - PTC_LIGHTWEIGHT_MODEL: Model for simple tasks
 * - PTC_RESEARCH_MODEL: Override model for research subagent
 * - PTC_GENERAL_PURPOSE_MODEL: Override model for general-purpose subagent
 *
 * @packageDocumentation
 */

// Main agent export
export {
  createPTCAgent,
  createPTCSubagents,
  type PTCAgentConfig,
  type PTCAgentExecuteOptions,
  type SubagentConfig,
  type SubAgent,
  type ModelTier,
} from "./agent.js";

// Configuration exports
export {
  loadEnvConfig,
  getEnvConfig,
  resetEnvConfig,
  getModelForTier,
  validateApiKeys,
  requireEnv,
  type PTCEnvConfig,
} from "./config/index.js";

// Prompt exports
export {
  buildSystemPrompt,
  buildResearchPrompt,
  buildGeneralPurposePrompt,
  getCurrentDate,
  WORKSPACE_PATHS,
  TOOL_DISCOVERY,
  OUTPUT_GUIDELINES,
  CITATION_RULES,
  SUBAGENT_COORDINATION,
  DATA_PROCESSING,
  IMAGE_UPLOAD,
} from "./prompts/index.js";

// Backend exports
export {
  StateBackend,
  DaytonaBackend,
  type DaytonaSandbox,
  type BackendProtocol,
  type SandboxBackendProtocol,
  type BackendFactory,
  type SandboxBackendFactory,
  type StateAndStore,
  type FileInfo,
  type FileData,
  type GrepMatch,
  type WriteResult,
  type EditResult,
  type ExecutionResult,
  // Utility functions
  createFileData,
  updateFileData,
  fileDataToString,
  formatReadResponse,
  performStringReplacement,
  grepMatchesFromFiles,
  globSearchFiles,
  sanitizeToolCallId,
  formatLsOutput,
  parseFilePath,
} from "./backends/index.js";

// Middleware exports
export {
  createFilesystemMiddleware,
  createSubAgentMiddleware,
  type FilesystemMiddlewareOptions,
  type SubAgentMiddlewareOptions,
} from "./middleware/index.js";

// Re-export core deepagents functionality for convenience
export { createDeepAgent, type CreateDeepAgentParams } from "deepagents";
