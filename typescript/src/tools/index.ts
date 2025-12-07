/**
 * PTC Agent Tools Module.
 *
 * This module provides all the tools used by the PTC agent, organized
 * in a structure mirroring the Python implementation:
 *
 * - bash/ - Shell command execution
 * - code_execution/ - Python code execution in sandbox
 * - filesystem/ - File read/write/edit operations
 * - research/ - Web search and thinking tools
 * - search/ - File pattern matching (glob/grep)
 */

// Bash tools
export { createExecuteBashTool, type ExecuteBashTool } from "./bash/index.js";

// Code execution tools
export {
  createExecuteCodeTool,
  type ExecuteCodeTool,
} from "./code_execution/index.js";

// Filesystem tools
export {
  createFilesystemTools,
  type FilesystemTools,
} from "./filesystem/index.js";

// Research tools
export {
  createTavilySearchTool,
  type TavilySearchTool,
  createThinkTool,
  type ThinkTool,
} from "./research/index.js";

// Search tools
export {
  createGlobTool,
  type GlobTool,
  createGrepTool,
  type GrepTool,
} from "./search/index.js";

// Convenience type for all tools
import type { ExecuteBashTool } from "./bash/index.js";
import type { ExecuteCodeTool } from "./code_execution/index.js";
import type { FilesystemTools } from "./filesystem/index.js";
import type { TavilySearchTool } from "./research/index.js";
import type { ThinkTool } from "./research/index.js";
import type { GlobTool } from "./search/index.js";
import type { GrepTool } from "./search/index.js";

export interface PTCTools {
  bash: ExecuteBashTool;
  executeCode: ExecuteCodeTool;
  readFile: FilesystemTools["readFile"];
  writeFile: FilesystemTools["writeFile"];
  editFile: FilesystemTools["editFile"];
  tavilySearch: TavilySearchTool;
  think: ThinkTool;
  glob: GlobTool;
  grep: GrepTool;
}

import type { SandboxBackendProtocol, BackendProtocol } from "../backends/protocol.js";
import { createExecuteBashTool } from "./bash/index.js";
import { createExecuteCodeTool } from "./code_execution/index.js";
import { createFilesystemTools } from "./filesystem/index.js";
import { createTavilySearchTool, createThinkTool } from "./research/index.js";
import { createGlobTool, createGrepTool } from "./search/index.js";

/**
 * Create all PTC tools with the given backend.
 *
 * @param options - Tool creation options
 * @returns Object containing all PTC tools
 */
export function createAllTools(options: {
  /** Sandbox backend for code/bash execution */
  sandboxBackend: SandboxBackendProtocol;
  /** Backend for filesystem operations (defaults to sandboxBackend) */
  filesystemBackend?: BackendProtocol;
  /** Enable cloud storage for images */
  storageEnabled?: boolean;
}): PTCTools {
  const {
    sandboxBackend,
    filesystemBackend = sandboxBackend,
    storageEnabled = false,
  } = options;

  const { readFile, writeFile, editFile } = createFilesystemTools(filesystemBackend);

  return {
    bash: createExecuteBashTool(sandboxBackend),
    executeCode: createExecuteCodeTool(sandboxBackend, { storageEnabled }),
    readFile,
    writeFile,
    editFile,
    tavilySearch: createTavilySearchTool(),
    think: createThinkTool(),
    glob: createGlobTool(filesystemBackend),
    grep: createGrepTool(filesystemBackend),
  };
}
