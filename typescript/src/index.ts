/**
 * Open PTC Agent - TypeScript Implementation
 *
 * A TypeScript implementation of Programmatic Tool Calling (PTC) with LangChainJS.
 * This package provides the same capabilities as the Python implementation,
 * leveraging the deepagents library for deep agent functionality.
 *
 * Configuration is driven by environment variables:
 * - PTC_DEFAULT_MODEL: Default model to use
 * - PTC_MODEL_SMALL: Model for simple, fast tasks
 * - PTC_MODEL_MEDIUM: Model for general use
 * - PTC_MODEL_LARGE: Model for complex reasoning tasks
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
  loadSharedPrompt,
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
  TASK_WORKFLOW,
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

// Tools exports
export {
  // Bash tools
  createExecuteBashTool,
  type ExecuteBashTool,
  // Code execution tools
  createExecuteCodeTool,
  type ExecuteCodeTool,
  // Filesystem tools
  createFilesystemTools,
  type FilesystemTools,
  // Research tools
  createTavilySearchTool,
  type TavilySearchTool,
  createThinkTool,
  type ThinkTool,
  // Search tools
  createGlobTool,
  type GlobTool,
  createGrepTool,
  type GrepTool,
  // All tools helper
  createAllTools,
  type PTCTools,
} from "./tools/index.js";

// Subagents exports
export {
  getGeneralSubagentConfig,
  createGeneralSubagent,
  type GeneralSubagentOptions,
  getResearchSubagentConfig,
  createResearchSubagent,
  type ResearchSubagentOptions,
} from "./subagents/index.js";

// Core exports
export {
  MCPRegistry,
  getMCPRegistry,
  resetMCPRegistry,
  type MCPTool,
  type MCPServerConfig,
  validateCommand,
  validatePath,
  sanitizeInput,
  DEFAULT_SECURITY_CONFIG,
  DEFAULT_ALLOWED_DIRECTORIES,
  DEFAULT_WORKING_DIRECTORY,
  type SecurityConfig,
} from "./core/index.js";

// Utils exports
export {
  type StorageUploader,
  type UploadOptions,
  type UploadResult,
  detectContentType,
  getStorageProvider,
  isStorageEnabled,
  getStorageUploader,
  S3Uploader,
  createS3UploaderFromEnv,
  type S3Config,
  R2Uploader,
  createR2UploaderFromEnv,
  type R2Config,
} from "./utils/index.js";

// Re-export core deepagents functionality for convenience
export { createDeepAgent, type CreateDeepAgentParams } from "deepagents";
