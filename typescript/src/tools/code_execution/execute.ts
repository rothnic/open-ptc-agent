/**
 * Execute code tool for running Python code in the PTC sandbox.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { SandboxBackendProtocol } from "../../backends/protocol.js";

/** Image extensions to detect for cloud storage upload */
const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".gif",
  ".webp",
  ".bmp",
  ".tiff",
]);

/**
 * Factory function to create execute_code tool with injected dependencies.
 *
 * @param sandbox - Sandbox backend for code execution
 * @param options - Optional configuration
 * @returns Configured execute_code tool function
 */
export function createExecuteCodeTool(
  sandbox: SandboxBackendProtocol,
  options: {
    /** Enable image upload to cloud storage */
    storageEnabled?: boolean;
    /** Custom timeout in seconds */
    timeout?: number;
  } = {}
) {
  const { storageEnabled = false, timeout = 120 } = options;

  return tool(
    async ({ code }) => {
      try {
        // Execute code in sandbox
        const result = await sandbox.executeCode(code, timeout);

        if (result.success) {
          // Format success response
          const parts: string[] = ["SUCCESS"];

          if (result.stdout) {
            parts.push(result.stdout);
          }

          if (result.files_created && result.files_created.length > 0) {
            parts.push(`Files created: ${result.files_created.join(", ")}`);
          }

          // Handle image uploads if storage is enabled
          if (storageEnabled && result.files_created) {
            const uploadedImages: string[] = [];
            for (const filePath of result.files_created) {
              const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase();
              if (IMAGE_EXTENSIONS.has(ext)) {
                // Note: Actual upload would be handled by storage module
                uploadedImages.push(`![${filePath}](uploaded-image-url)`);
              }
            }
            if (uploadedImages.length > 0) {
              parts.push("\nUploaded images:");
              parts.push(...uploadedImages);
            }
          }

          return parts.join("\n");
        } else {
          // Format error response
          const errorOutput = result.stderr || result.stdout || "Execution failed";
          return `ERROR\n${errorOutput}`;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return `ERROR: ${errorMsg}`;
      }
    },
    {
      name: "execute_code",
      description: `Execute Python code in the sandbox environment.

Use this tool for complex operations that require Python logic, data processing,
or interactions with MCP tools (tavily, github, etc.).

The code executes in an isolated sandbox with:
- MCP tools available via: from tools.{server_name} import {tool_name}
- Workspace directories: results/, data/, tools/, code/
- Python standard library and common packages (pandas, requests, etc.)

Path Guidelines:
    Use RELATIVE paths for standard directories:
    with open('results/output.json', 'w') as f:  # Correct
    with open('data/temp.json', 'w') as f:      # Correct

    NEVER use absolute paths like '/results/' or '/workspace/' - they won't work!

Example:
    code = '''
    from tools.tavily import tavily_search
    import json

    results = tavily_search(query="AI agents", max_results=5)
    filtered = [r for r in results if r.get('score', 0) > 0.7]

    with open('results/output.json', 'w') as f:
        json.dump(filtered, f, indent=2)

    print(f"Saved {len(filtered)} high-quality results")
    '''`,
      schema: z.object({
        code: z
          .string()
          .describe(
            "Complete Python code to execute. Must be self-contained. Print a summary of results (not full data) to stdout."
          ),
      }),
    }
  );
}

export type ExecuteCodeTool = ReturnType<typeof createExecuteCodeTool>;
