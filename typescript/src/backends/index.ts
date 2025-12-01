/**
 * Backend implementations for file system and sandbox operations.
 *
 * Provides different backend implementations for storing and accessing files:
 * - StateBackend: In-memory storage using LangGraph state
 * - DaytonaBackend: External storage using Daytona sandbox
 */

export {
  StateBackend,
} from "./state.js";

export {
  DaytonaBackend,
  type DaytonaSandbox,
} from "./daytona.js";

export {
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
} from "./utils.js";

export type {
  BackendProtocol,
  SandboxBackendProtocol,
  BackendFactory,
  SandboxBackendFactory,
  StateAndStore,
  FileInfo,
  FileData,
  GrepMatch,
  WriteResult,
  EditResult,
  ExecutionResult,
} from "./protocol.js";
