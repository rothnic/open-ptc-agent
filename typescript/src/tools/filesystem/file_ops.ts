/**
 * File operation tools: read, write, edit.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { BackendProtocol } from "../../backends/protocol.js";

/**
 * Factory function to create all filesystem tools (Read, Write, Edit).
 *
 * @param backend - Backend for file operations
 * @returns Object with readFile, writeFile, editFile tools
 */
export function createFilesystemTools(backend: BackendProtocol) {
  const readFile = tool(
    async ({ filePath, offset, limit }) => {
      try {
        const content = await backend.read(filePath, offset, limit);

        if (!content || content.startsWith("ERROR:")) {
          return content || `ERROR: File not found: ${filePath}`;
        }

        return content;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return `ERROR: Failed to read file: ${errorMsg}`;
      }
    },
    {
      name: "read_file",
      description: `Reads a file from the local filesystem.

You can access any file directly by using this tool. Returns file contents with
line numbers in cat -n format (starting at line 1).

By default, it reads up to 2000 lines starting from the beginning of the file.
You can optionally specify a line offset and limit (especially handy for long files).

Example:
    Read entire file:
    file_path = "config.yaml"

    Read specific lines (line 100-150):
    file_path = "src/agent.py"
    offset = 100
    limit = 50`,
      schema: z.object({
        filePath: z
          .string()
          .describe("Path to the file (relative to working directory or absolute)"),
        offset: z
          .number()
          .optional()
          .describe("Line number to start reading from (1-indexed, optional)"),
        limit: z
          .number()
          .optional()
          .describe("Number of lines to read (optional)"),
      }),
    }
  );

  const writeFile = tool(
    async ({ filePath, content }) => {
      try {
        const result = await backend.write(filePath, content);

        if (!result.error) {
          return `Wrote ${content.length} bytes to ${filePath}`;
        } else {
          return `ERROR: ${result.error}`;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return `ERROR: Failed to write file: ${errorMsg}`;
      }
    },
    {
      name: "write_file",
      description: `Writes a file to the local filesystem.

This tool will overwrite the existing file if there is one at the provided path.
ALWAYS prefer editing existing files with Edit tool over Write. Never write new files
unless explicitly required.

If this is an existing file, you MUST use the Read tool first to read the file's contents.

Example:
    Create a new file:
    file_path = "results/summary.txt"
    content = "Analysis complete. Found 42 matches."`,
      schema: z.object({
        filePath: z
          .string()
          .describe("Path to the file (relative to working directory or absolute)"),
        content: z.string().describe("Complete content to write to the file"),
      }),
    }
  );

  const editFile = tool(
    async ({ filePath, oldString, newString, replaceAll = false }) => {
      try {
        const result = await backend.edit(filePath, oldString, newString, replaceAll);

        if (!result.error) {
          const count = result.occurrences || 1;
          return replaceAll
            ? `Replaced ${count} occurrence(s) in ${filePath}`
            : `Successfully edited ${filePath}`;
        } else {
          return `ERROR: ${result.error}`;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return `ERROR: Failed to edit file: ${errorMsg}`;
      }
    },
    {
      name: "edit_file",
      description: `Performs exact string replacements in files.

You must use the Read tool at least once before editing. This tool will error if you
attempt an edit without reading the file.

When editing text from Read tool output, ensure you preserve the exact indentation
(tabs/spaces) as it appears AFTER the line number prefix.

ALWAYS prefer editing existing files in the codebase. NEVER write new files unless explicitly required.

The edit will FAIL if old_string is not unique in the file. Either provide a larger string
with more surrounding context to make it unique or use replace_all to change every instance.

Example:
    Single replacement:
    file_path = "src/agent.py"
    old_string = "def old_function():\\n    pass"
    new_string = "def old_function():\\n    return True"

    Replace all occurrences:
    file_path = "src/agent.py"
    old_string = "old_var_name"
    new_string = "new_var_name"
    replace_all = True`,
      schema: z.object({
        filePath: z
          .string()
          .describe("Path to the file (relative to working directory or absolute)"),
        oldString: z
          .string()
          .describe("The exact text to replace (must exist and be unique unless replace_all=True)"),
        newString: z
          .string()
          .describe("The text to replace it with (must be different from old_string)"),
        replaceAll: z
          .boolean()
          .optional()
          .default(false)
          .describe("Replace all occurrences (default: false)"),
      }),
    }
  );

  return { readFile, writeFile, editFile };
}

export type FilesystemTools = ReturnType<typeof createFilesystemTools>;
