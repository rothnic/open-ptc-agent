/**
 * Open PTC Agent - TypeScript Implementation
 *
 * A TypeScript implementation of Programmatic Tool Calling (PTC) with LangChainJS.
 * This package provides the same capabilities as the Python implementation,
 * leveraging the deepagents library for deep agent functionality.
 *
 * @packageDocumentation
 */

// Main agent export
export {
  createPTCAgent,
  createPTCSubagents,
  type PTCAgentConfig,
  type PTCAgentExecuteOptions,
  type SubAgent,
} from "./agent.js";

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
