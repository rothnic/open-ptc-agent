/**
 * Execute bash commands in the sandbox.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { SandboxBackendProtocol } from "../../backends/protocol.js";

/** Default timeout in milliseconds (2 minutes) */
const DEFAULT_TIMEOUT_MS = 120000;

/** Default working directory for sandbox */
const DEFAULT_WORKING_DIR = "/home/daytona";

/**
 * Factory function to create Bash tool with injected dependencies.
 *
 * @param sandbox - Sandbox backend for bash command execution
 * @returns Configured Bash tool function
 */
export function createExecuteBashTool(sandbox: SandboxBackendProtocol) {
  return tool(
    async ({
      command,
      timeout = DEFAULT_TIMEOUT_MS,
      workingDir = DEFAULT_WORKING_DIR,
    }) => {
      try {
        // Convert timeout from milliseconds to seconds for sandbox
        const timeoutSeconds = timeout / 1000;

        // Execute bash command in sandbox
        const result = await sandbox.executeBash(command, workingDir, timeoutSeconds);

        if (result.success) {
          const { stdout = "", stderr = "" } = result;
          // Combine stdout and stderr for complete output
          let output = stdout;
          if (stderr) {
            output += output ? `\n${stderr}` : stderr;
          }
          return output || "Command completed successfully";
        } else {
          const stderr = result.stderr || "Command execution failed";
          return `ERROR: Command failed\n${stderr}`;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return `ERROR: Failed to execute bash command: ${errorMsg}`;
      }
    },
    {
      name: "Bash",
      description: `Executes bash commands in a persistent shell session with proper handling and security measures.

IMPORTANT: This tool is for terminal operations like git, npm, docker, etc.
DO NOT use it for file operations (reading, writing, editing, searching, finding files)
- use the specialized tools for those instead.

Path Handling:
    IMPORTANT: Always quote paths with spaces using double quotes
    cd "/Users/name/My Documents"      # Correct
    python "/path/with spaces/script.py"  # Correct

Workspace Paths:
    Working directory: /home/daytona
    Standard directories: /home/daytona/{results,data,tools,code}/

    Accessing workspace files:
    ls /home/daytona/results/              # Correct - absolute path
    cat /home/daytona/data/output.json    # Correct - absolute path
    ls results/                            # Correct - relative to working_dir

    NEVER use root-level paths like /results/ or /data/ - they don't exist!

Use THIS tool for:
- Terminal operations (git, npm, docker)
- Directory operations (ls, mkdir, rmdir)
- File operations (cp, mv, chmod, rm)
- System commands and utilities (grep, sed, awk)
- Building and testing

DO NOT use for file operations - use specialized tools instead:
- Reading files → Use Read tool
- Writing files → Use Write tool
- Editing files → Use Edit tool
- Finding files by pattern → Use Glob tool
- Searching file contents → Use Grep tool`,
      schema: z.object({
        command: z.string().describe("The bash command to execute"),
        description: z
          .string()
          .optional()
          .describe(
            "Clear, concise description of what this command does (5-10 words)"
          ),
        timeout: z
          .number()
          .optional()
          .default(120000)
          .describe(
            "Timeout in milliseconds (max 600000 = 10 minutes, default 120000 = 2 minutes)"
          ),
        workingDir: z
          .string()
          .optional()
          .default("/home/daytona")
          .describe("Working directory for command execution"),
      }),
    }
  );
}

export type ExecuteBashTool = ReturnType<typeof createExecuteBashTool>;
