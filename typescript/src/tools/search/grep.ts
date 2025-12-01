/**
 * Grep tool for content searching.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { BackendProtocol } from "../../backends/protocol.js";

/**
 * Factory function to create Grep tool.
 *
 * @param backend - Backend for filesystem operations
 * @returns Configured Grep tool function
 */
export function createGrepTool(backend: BackendProtocol) {
  return tool(
    async ({
      pattern,
      path,
      glob,
    }) => {
      try {
        const searchPath = path || null;
        const results = await backend.grepRaw(pattern, searchPath, glob);

        // Check if it's an error string
        if (typeof results === "string") {
          return `ERROR: ${results}`;
        }

        if (!results || results.length === 0) {
          return `No matches found for pattern '${pattern}'`;
        }

        // Format results
        const formatted = results.map((match) => `${match.path}:${match.line}: ${match.text}`);
        return `Matches for pattern '${pattern}':\n\n${formatted.join("\n")}`;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return `ERROR: Failed to grep content: ${errorMsg}`;
      }
    },
    {
      name: "grep",
      description: `Search for patterns in files using regex.

ALWAYS use Grep for search tasks. NEVER invoke grep or rg via Bash command.
This tool has been optimized for correct permissions and access.

Supports full regex syntax and file filtering.

Pattern Syntax (Regex):
    .       - Any character
    .*      - Zero or more of any character
    \\s     - Whitespace
    \\w     - Word character
    \\d     - Digit
    [...]   - Character class

Examples:
    Find files containing "PTCAgent":
    pattern = "PTCAgent"

    Search only Python files:
    pattern = "async def"
    glob = "*.py"`,
      schema: z.object({
        pattern: z.string().describe("Regex pattern to search for"),
        path: z
          .string()
          .optional()
          .describe("Directory or file to search in"),
        glob: z
          .string()
          .optional()
          .describe('File pattern filter (e.g., "*.py")'),
      }),
    }
  );
}

export type GrepTool = ReturnType<typeof createGrepTool>;
