/**
 * Research sub-agent definition.
 *
 * This sub-agent specializes in web research using Tavily search
 * and strategic thinking for comprehensive information gathering.
 */

import type { SubAgent } from "deepagents";
import type { StructuredTool } from "@langchain/core/tools";

import { buildResearchPrompt } from "../prompts/index.js";
import { getEnvConfig } from "../config/index.js";
import { createTavilySearchTool, createThinkTool } from "../tools/research/index.js";

/**
 * Options for creating a research subagent.
 */
export interface ResearchSubagentOptions {
  /** Maximum search iterations */
  maxIterations?: number;

  /** Additional MCP tools to include */
  mcpTools?: StructuredTool[];

  /** Override model for this subagent */
  model?: string;
}

/**
 * Get configuration for the research sub-agent.
 *
 * @param options - Configuration options
 * @returns Sub-agent configuration for deepagent
 */
export function getResearchSubagentConfig(
  options: ResearchSubagentOptions = {}
): SubAgent {
  const envConfig = getEnvConfig();
  const { maxIterations = 5, mcpTools = [], model } = options;

  // Build the system prompt
  const instructions = buildResearchPrompt({ maxIterations });

  // Base tools for research
  const tools: StructuredTool[] = [
    createTavilySearchTool(),
    createThinkTool(),
    ...mcpTools,
  ];

  // Determine model: option > env var > default
  const subagentModel =
    model ||
    envConfig.researchModel ||
    envConfig.mediumModel;

  return {
    name: "research",
    description:
      "Delegate research to the sub-agent researcher. " +
      "Give this researcher one specific topic or question at a time. " +
      "The researcher will search the web and provide findings with citations.",
    systemPrompt: instructions,
    tools,
    model: subagentModel,
  };
}

/**
 * Create a research sub-agent for deepagent.
 *
 * Convenience wrapper around getResearchSubagentConfig.
 *
 * @param options - Configuration options
 * @returns Sub-agent configuration
 */
export function createResearchSubagent(
  options: ResearchSubagentOptions = {}
): SubAgent {
  return getResearchSubagentConfig(options);
}
