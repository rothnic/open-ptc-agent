/**
 * General-purpose sub-agent definition.
 *
 * This sub-agent has access to all main tools (execute_code, filesystem tools)
 * and MCP tools, enabling complex task delegation from the main agent.
 */

import type { SubAgent } from "deepagents";
import type { StructuredTool } from "@langchain/core/tools";

import { buildGeneralPurposePrompt } from "../prompts/index.js";
import { getEnvConfig } from "../config/index.js";

/** Default maximum iterations for general-purpose subagent */
const DEFAULT_MAX_ITERATIONS = 15;

/**
 * Options for creating a general-purpose subagent.
 */
export interface GeneralSubagentOptions {
  /** Maximum execution iterations */
  maxIterations?: number;

  /** Additional tools to include */
  additionalTools?: StructuredTool[];

  /** Whether to include MCP tool documentation in prompt */
  includeMcpDocs?: boolean;

  /** How to format tool docs ("full" or "summary") */
  toolExposureMode?: "full" | "summary";

  /** Custom filesystem tools */
  filesystemTools?: StructuredTool[];

  /** Vision tools for multimodal capabilities */
  visionTools?: StructuredTool[];

  /** Enable storage for image uploads */
  storageEnabled?: boolean;

  /** Override model for this subagent */
  model?: string;
}

/**
 * Get configuration for the general-purpose sub-agent.
 *
 * @param tools - Base tools for the subagent
 * @param options - Configuration options
 * @returns Sub-agent configuration for deepagent
 */
export function getGeneralSubagentConfig(
  tools: StructuredTool[],
  options: GeneralSubagentOptions = {}
): SubAgent {
  const envConfig = getEnvConfig();
  const {
    maxIterations = DEFAULT_MAX_ITERATIONS,
    additionalTools = [],
    filesystemTools = [],
    visionTools = [],
    storageEnabled = false,
    model,
  } = options;

  // Build the system prompt
  const instructions = buildGeneralPurposePrompt({
    maxIterations,
    storageEnabled,
  });

  // Combine all tools
  const allTools = [
    ...tools,
    ...filesystemTools,
    ...visionTools,
    ...additionalTools,
  ];

  // Determine model: option > env var > default
  const subagentModel =
    model ||
    envConfig.generalPurposeModel ||
    envConfig.mediumModel;

  return {
    name: "general-purpose",
    description:
      "Delegate complex tasks to the general-purpose sub-agent. " +
      "This agent has access to all filesystem tools (read, write, edit, glob, grep, bash) " +
      "and can execute Python code with MCP tools. Use for multi-step operations, " +
      "data processing, file manipulation, or any task requiring full tool access.",
    systemPrompt: instructions,
    tools: allTools,
    model: subagentModel,
  };
}

/**
 * Create a general-purpose sub-agent for deepagent.
 *
 * Convenience wrapper around getGeneralSubagentConfig.
 *
 * @param tools - Base tools for the subagent
 * @param options - Configuration options
 * @returns Sub-agent configuration
 */
export function createGeneralSubagent(
  tools: StructuredTool[],
  options: GeneralSubagentOptions = {}
): SubAgent {
  return getGeneralSubagentConfig(tools, options);
}
