/**
 * DaytonaBackend - Implements BackendProtocol for Daytona sandbox.
 *
 * This backend delegates all filesystem and execution operations to a Daytona sandbox,
 * enabling deepagent's built-in tools to work with Daytona sandboxes.
 */

import type {
  SandboxBackendProtocol,
  EditResult,
  ExecutionResult,
  FileData,
  FileInfo,
  GrepMatch,
  WriteResult,
} from "./protocol.js";
import { createFileData } from "./utils.js";

/**
 * Interface for Daytona sandbox operations.
 *
 * This interface defines the expected methods that a Daytona SDK sandbox should provide.
 * Implementations should wrap the actual Daytona SDK client.
 */
export interface DaytonaSandbox {
  /** List directory contents */
  listDirectory(path: string): Promise<Array<{ path?: string; name?: string; type?: string; is_dir?: boolean; size?: number; modified_at?: string }>>;

  /** Read file content */
  readFile(path: string): Promise<string | null>;

  /** Read file with line range */
  readFileRange(path: string, offset: number, limit: number): Promise<string | null>;

  /** Write content to file */
  writeFile(path: string, content: string): Promise<boolean>;

  /** Edit file with string replacement */
  editFile(
    path: string,
    oldString: string,
    newString: string,
    replaceAll: boolean
  ): Promise<{ success: boolean; error?: string; occurrences?: number }>;

  /** Search file contents with regex pattern */
  grepContent(options: {
    pattern: string;
    path: string;
    outputMode?: string;
    glob?: string | null;
    showLineNumbers?: boolean;
  }): Promise<string | Array<{ path: string; line: number; text: string } | string>>;

  /** Find files matching glob pattern */
  globFiles(pattern: string, path: string): Promise<string[]>;

  /** Execute Python code */
  execute(code: string, timeout?: number): Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
    execution_id: string;
    files_created: string[];
    files_modified: string[];
    duration: number;
    code_hash: string;
  }>;

  /** Execute bash command */
  executeBash(command: string, workingDir?: string, timeout?: number): Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
    exit_code: number;
  }>;

  /** Create directory */
  createDirectory(path: string): Promise<boolean>;

  /** Get working directory */
  getWorkDir(): string;
}

/**
 * Backend that implements BackendProtocol using Daytona sandbox.
 *
 * Provides a unified interface for deepagent's FilesystemMiddleware to interact
 * with Daytona sandboxes. All operations are delegated to the sandbox instance.
 *
 * Similar to deepagent's FilesystemBackend, supports virtual_mode for path normalization.
 */
export class DaytonaBackend implements SandboxBackendProtocol {
  private sandbox: DaytonaSandbox;
  private rootDir: string;
  private virtualMode: boolean;

  /**
   * Initialize Daytona backend.
   *
   * @param sandbox - Daytona sandbox instance for all operations
   * @param rootDir - Root directory for virtual filesystem (default: /home/daytona)
   * @param virtualMode - If true, normalize paths relative to rootDir
   */
  constructor(
    sandbox: DaytonaSandbox,
    rootDir: string = "/home/daytona",
    virtualMode: boolean = true
  ) {
    this.sandbox = sandbox;
    this.rootDir = rootDir.replace(/\/$/, "");
    this.virtualMode = virtualMode;
  }

  /**
   * Normalize path relative to rootDir when virtualMode is enabled.
   *
   * Converts virtual paths to absolute sandbox paths:
   *   "/" -> "/home/daytona"
   *   "/research_request.md" -> "/home/daytona/research_request.md"
   *   "." -> "/home/daytona"
   *   "data/file.txt" -> "/home/daytona/data/file.txt"
   *   "/home/daytona/file.txt" -> "/home/daytona/file.txt" (unchanged)
   */
  private normalizePath(path: string): string {
    if (!this.virtualMode) {
      return path;
    }

    if (path === null || path === undefined || path === "" || path === "." || path === "/") {
      return this.rootDir;
    }

    const trimmedPath = path.trim();

    // Already absolute and in allowed directories - keep as is
    if (trimmedPath.startsWith("/home/daytona") || trimmedPath.startsWith("/tmp")) {
      return trimmedPath;
    }

    // Virtual absolute path: /foo -> /home/daytona/foo
    if (trimmedPath.startsWith("/")) {
      return `${this.rootDir}${trimmedPath}`;
    }

    // Relative path: foo -> /home/daytona/foo
    return `${this.rootDir}/${trimmedPath}`;
  }

  /**
   * List directory contents with file information.
   */
  async lsInfo(path: string = "."): Promise<FileInfo[]> {
    try {
      const normalizedPath = this.normalizePath(path);
      const entries = await this.sandbox.listDirectory(normalizedPath);

      const result: FileInfo[] = [];
      for (const entry of entries) {
        const fileInfo: FileInfo = {
          path: entry.path || entry.name || "",
          is_dir: entry.is_dir ?? entry.type === "directory",
        };
        if (entry.size !== undefined) {
          fileInfo.size = entry.size;
        }
        if (entry.modified_at !== undefined) {
          fileInfo.modified_at = entry.modified_at;
        }
        result.push(fileInfo);
      }

      return result;
    } catch (e) {
      console.error(`Failed to list directory ${path}:`, e);
      return [];
    }
  }

  /**
   * Read file content with optional range.
   */
  async read(
    filePath: string,
    offset: number = 0,
    limit: number = 2000
  ): Promise<string> {
    try {
      const normalizedPath = this.normalizePath(filePath);
      let content: string | null;

      if (offset > 0 || limit !== 2000) {
        content = await this.sandbox.readFileRange(normalizedPath, offset, limit);
      } else {
        content = await this.sandbox.readFile(normalizedPath);
      }

      if (content === null) {
        return `Error: File '${filePath}' not found`;
      }
      return content;
    } catch (e) {
      console.error(`Failed to read file ${filePath}:`, e);
      return `Error: File '${filePath}' not found`;
    }
  }

  /**
   * Read file content as raw FileData.
   */
  async readRaw(filePath: string): Promise<FileData> {
    const normalizedPath = this.normalizePath(filePath);
    const content = await this.sandbox.readFile(normalizedPath);

    if (content === null) {
      throw new Error(`File '${filePath}' not found`);
    }

    return createFileData(content);
  }

  /**
   * Write content to file.
   */
  async write(filePath: string, content: string): Promise<WriteResult> {
    try {
      const normalizedPath = this.normalizePath(filePath);
      const success = await this.sandbox.writeFile(normalizedPath, content);

      if (success) {
        // filesUpdate=null for external backends (not state-based)
        return { path: normalizedPath, filesUpdate: null };
      }
      return { error: `Failed to write to '${normalizedPath}'` };
    } catch (e) {
      console.error(`Failed to write file ${filePath}:`, e);
      return { error: String(e) };
    }
  }

  /**
   * Edit file using exact string replacement.
   */
  async edit(
    filePath: string,
    oldString: string,
    newString: string,
    replaceAll: boolean = false
  ): Promise<EditResult> {
    try {
      const normalizedPath = this.normalizePath(filePath);
      const result = await this.sandbox.editFile(
        normalizedPath,
        oldString,
        newString,
        replaceAll
      );

      if (result.success) {
        return {
          path: normalizedPath,
          filesUpdate: null, // External backend, not state-based
          occurrences: result.occurrences ?? 1,
        };
      }
      return { error: result.error || "Edit failed" };
    } catch (e) {
      console.error(`Failed to edit file ${filePath}:`, e);
      return { error: String(e) };
    }
  }

  /**
   * Search file contents with regex pattern.
   */
  async grepRaw(
    pattern: string,
    path: string | null = null,
    glob: string | null = null
  ): Promise<GrepMatch[] | string> {
    try {
      const searchPath = path ? this.normalizePath(path) : this.rootDir;
      const result = await this.sandbox.grepContent({
        pattern,
        path: searchPath,
        outputMode: "content",
        glob,
        showLineNumbers: true,
      });

      // Convert to GrepMatch format: list of {path, line, text}
      if (typeof result === "string") {
        const matches: GrepMatch[] = [];
        for (const line of result.trim().split("\n")) {
          if (line && line.includes(":")) {
            const parts = line.split(":", 3);
            if (parts.length >= 3) {
              try {
                matches.push({
                  path: parts[0],
                  line: parseInt(parts[1], 10),
                  text: parts[2],
                });
              } catch {
                matches.push({
                  path: parts[0],
                  line: 0,
                  text: parts.slice(1).join(":"),
                });
              }
            }
          }
        }
        return matches;
      } else if (Array.isArray(result)) {
        const matches: GrepMatch[] = [];
        for (const m of result) {
          if (typeof m === "string") {
            if (m.includes(":")) {
              const parts = m.split(":", 3);
              if (parts.length >= 3) {
                try {
                  matches.push({
                    path: parts[0],
                    line: parseInt(parts[1], 10),
                    text: parts[2],
                  });
                } catch {
                  matches.push({
                    path: parts[0],
                    line: 0,
                    text: parts.slice(1).join(":"),
                  });
                }
              }
            }
          } else if (typeof m === "object" && m !== null) {
            matches.push({
              path: m.path || "",
              line: m.line || 0,
              text: m.text || "",
            });
          }
        }
        return matches;
      }
      return [];
    } catch (e) {
      console.error("Failed to grep content:", e);
      return [];
    }
  }

  /**
   * Find files matching glob pattern.
   */
  async globInfo(pattern: string, path: string = "/"): Promise<FileInfo[]> {
    try {
      const normalizedPath = this.normalizePath(path);
      const filePaths = await this.sandbox.globFiles(pattern, normalizedPath);
      return filePaths.map((fp) => ({ path: fp }));
    } catch (e) {
      console.error("Failed to glob files:", e);
      return [];
    }
  }

  /**
   * Execute Python code in sandbox.
   */
  async executeCode(code: string, timeout?: number): Promise<ExecutionResult> {
    try {
      const result = await this.sandbox.execute(code, timeout);
      return {
        success: result.success,
        stdout: result.stdout,
        stderr: result.stderr,
        execution_id: result.execution_id,
        files_created: result.files_created,
        files_modified: result.files_modified,
        duration: result.duration,
        code_hash: result.code_hash,
      };
    } catch (e) {
      console.error("Failed to execute code:", e);
      return {
        success: false,
        stdout: "",
        stderr: String(e),
        execution_id: "error",
        files_created: [],
        files_modified: [],
        duration: 0,
        code_hash: "",
      };
    }
  }

  /**
   * Execute bash command in sandbox.
   */
  async executeBash(
    command: string,
    workingDir: string = "/home/daytona",
    timeout: number = 60
  ): Promise<ExecutionResult> {
    try {
      const result = await this.sandbox.executeBash(command, workingDir, timeout);
      return {
        success: result.success,
        stdout: result.stdout,
        stderr: result.stderr,
        execution_id: "bash",
        files_created: [],
        files_modified: [],
        duration: 0,
        code_hash: "",
      };
    } catch (e) {
      console.error("Failed to execute bash command:", e);
      return {
        success: false,
        stdout: "",
        stderr: String(e),
        execution_id: "error",
        files_created: [],
        files_modified: [],
        duration: 0,
        code_hash: "",
      };
    }
  }

  /**
   * Create a directory.
   */
  async createDirectory(dirpath: string): Promise<boolean> {
    try {
      const normalizedPath = this.normalizePath(dirpath);
      return await this.sandbox.createDirectory(normalizedPath);
    } catch (e) {
      console.error(`Failed to create directory ${dirpath}:`, e);
      return false;
    }
  }

  /**
   * Get the sandbox working directory.
   */
  getWorkDir(): string {
    return this.sandbox.getWorkDir();
  }
}
