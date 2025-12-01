/**
 * Middleware for providing filesystem tools to an agent.
 *
 * Re-exports the filesystem middleware from deepagents with PTC-specific extensions.
 * This module provides ls, read_file, write_file, edit_file, glob, and grep tools.
 */

// Re-export from deepagents for compatibility
export {
  createFilesystemMiddleware,
  type FilesystemMiddlewareOptions,
} from "deepagents";

// Re-export file data type
export type { FileData } from "../backends/protocol.js";
