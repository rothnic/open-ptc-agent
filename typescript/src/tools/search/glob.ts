/**
 * Glob tool for file pattern matching.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { BackendProtocol } from "../../backends/protocol.js";

/**
 * Factory function to create Glob tool.
 *
 * @param backend - Backend for filesystem operations
 * @returns Configured Glob tool function
 */
export function createGlobTool(backend: BackendProtocol) {
  return tool(
    async ({ pattern, path }) => {
      try {
        const searchPath = path || "/";
        const matches = await backend.globInfo(pattern, searchPath);

        if (!matches || matches.length === 0) {
          return `No files matching pattern '${pattern}' found in '${searchPath}'`;
        }

        const paths = matches.map((f) => f.path);
        const result = `Found ${paths.length} file(s) matching '${pattern}':\n${paths.join("\n")}`;
        return result;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return `ERROR: Failed to glob files: ${errorMsg}`;
      }
    },
    {
      name: "glob",
      description: `Fast file pattern matching tool for finding files by name patterns.

Works with any codebase size. Supports glob patterns like "**/*.js", "src/**/*.ts", "*.py".
Returns matching file paths sorted by modification time.

Use this tool when you need to find files by name patterns. For content-based searches,
use the Grep tool instead.

Pattern Syntax:
    *       - Match anything except /
    **      - Match zero or more directories
    ?       - Match single character
    [...]   - Character range
    {a,b}   - Match either pattern

Examples:
    Find all Python files recursively:
    pattern = "**/*.py"

    Find all TypeScript files in src directory:
    pattern = "src/**/*.ts"

    Find all config files:
    pattern = "**/*.{yaml,yml,json}"

    Find test files:
    pattern = "**/test_*.py"`,
      schema: z.object({
        pattern: z
          .string()
          .describe('Glob pattern to match files against (e.g., "**/*.py", "src/**/*.ts")'),
        path: z
          .string()
          .optional()
          .describe("Optional directory to search in (defaults to root)"),
      }),
    }
  );
}

export type GlobTool = ReturnType<typeof createGlobTool>;
