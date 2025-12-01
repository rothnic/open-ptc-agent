/**
 * PTC Agent - Main agent using deepagents with Programmatic Tool Calling pattern.
 *
 * This module creates a PTC agent that:
 * - Uses deepagent's createDeepAgent for orchestration
 * - Integrates Daytona sandbox via DaytonaBackend
 * - Provides MCP tools through execute_code
 * - Supports sub-agent delegation for specialized tasks
 */

import {
  createDeepAgent,
  type SubAgent,
} from "deepagents";
import {
  type AgentMiddleware,
  type StructuredTool,
} from "langchain";
import type { BaseLanguageModel } from "@langchain/core/language_models/base";
import type {
  BaseCheckpointSaver,
  BaseStore,
} from "@langchain/langgraph-checkpoint";

import type { BackendProtocol } from "./backends/protocol.js";

/**
 * Configuration for PTC Agent.
 */
export interface PTCAgentConfig {
  /** The LLM model to use (model name string or LanguageModelLike instance) */
  model?: BaseLanguageModel | string;

  /** Custom system prompt for the agent */
  systemPrompt?: string;

  /** Tools the agent should have access to */
  tools?: StructuredTool[];

  /** Custom middleware to apply */
  middleware?: AgentMiddleware[];

  /** List of subagent specifications for task delegation */
  subagents?: SubAgent[];

  /** Backend for filesystem operations */
  backend?: BackendProtocol | ((config: { state: unknown; store?: BaseStore }) => BackendProtocol);

  /** Optional checkpointer for persisting agent state */
  checkpointer?: BaseCheckpointSaver | boolean;

  /** Optional store for persisting long-term memories */
  store?: BaseStore;

  /** The name of the agent */
  name?: string;
}

/**
 * PTC Agent execution options.
 */
export interface PTCAgentExecuteOptions {
  /** Recursion limit for the agent */
  recursionLimit?: number;

  /** Thread ID for conversation persistence */
  threadId?: string;
}

/**
 * Create a PTC Agent with the specified configuration.
 *
 * This function creates a deep agent configured for Programmatic Tool Calling (PTC).
 * It combines deepagents capabilities with Daytona sandbox integration.
 *
 * @param config - Agent configuration
 * @returns A configured deep agent ready for invocation
 *
 * @example
 * ```typescript
 * import { createPTCAgent } from "@open-ptc-agent/typescript";
 *
 * const agent = createPTCAgent({
 *   model: "claude-sonnet-4-5-20250929",
 *   systemPrompt: "You are a helpful coding assistant.",
 *   tools: [executeCodeTool],
 * });
 *
 * const result = await agent.invoke({
 *   messages: [{ role: "user", content: "Write a Python script" }],
 * });
 * ```
 */
export function createPTCAgent(config: PTCAgentConfig = {}) {
  const {
    model = "claude-sonnet-4-5-20250929",
    systemPrompt,
    tools = [],
    middleware = [],
    subagents = [],
    backend,
    checkpointer,
    store,
    name,
  } = config;

  // Build system prompt with PTC-specific instructions
  const ptcSystemPrompt = buildPTCSystemPrompt(systemPrompt);

  // Create the deep agent with PTC configuration
  return createDeepAgent({
    model,
    systemPrompt: ptcSystemPrompt,
    tools,
    middleware,
    subagents,
    backend,
    checkpointer,
    store,
    name,
  });
}

/**
 * Build the system prompt for PTC agent.
 *
 * Combines custom system prompt with PTC-specific instructions.
 *
 * @param customPrompt - Optional custom system prompt
 * @returns Complete system prompt for PTC agent
 */
function buildPTCSystemPrompt(customPrompt?: string): string {
  const basePrompt = `You are a Programmatic Tool Calling (PTC) agent. Your primary mode of operation is to write and execute Python code to accomplish tasks.

## Key Principles

1. **Code-First Approach**: Prefer writing Python code to accomplish tasks rather than making individual tool calls.

2. **MCP Tool Access**: You have access to MCP (Model Context Protocol) tools that are exposed as Python functions. Import and use these tools in your code.

3. **Data Processing**: Process data in code rather than returning large datasets to the conversation. Only return summaries and key insights.

4. **File Management**: Write results to files in the sandbox filesystem. Use the /results directory for outputs.

## Tool Usage

- Use the \`execute_code\` tool to run Python code
- Import MCP tools from the \`tools\` module: \`from tools.{server_name} import {function_name}\`
- Use standard Python libraries for data processing (pandas, numpy, etc.)

## Best Practices

- Break complex tasks into smaller code blocks
- Handle errors gracefully with try/except
- Write intermediate results to files for large datasets
- Use clear variable names and add comments for complex logic`;

  if (customPrompt) {
    return `${customPrompt}\n\n${basePrompt}`;
  }

  return basePrompt;
}

/**
 * Create subagent configurations for PTC agent.
 *
 * @param names - List of subagent names to include
 * @param tools - Tools to provide to subagents
 * @returns Array of SubAgent configurations
 */
export function createPTCSubagents(
  names: string[],
  tools: StructuredTool[] = []
): SubAgent[] {
  const subagents: SubAgent[] = [];

  for (const name of names) {
    switch (name) {
      case "research":
        subagents.push({
          name: "research",
          description:
            "Use this agent for conducting thorough research on complex topics. It has access to web search and can synthesize information from multiple sources.",
          systemPrompt: `You are a research specialist. Your job is to:
1. Search for relevant information using available tools
2. Analyze and synthesize findings
3. Provide well-organized research summaries with citations

Focus on accuracy and cite your sources.`,
          tools,
        });
        break;

      case "general-purpose":
        subagents.push({
          name: "general-purpose",
          description:
            "General-purpose agent for executing code, file operations, and multi-step tasks. Use this for complex tasks that require isolated context.",
          systemPrompt: `You are a general-purpose agent with full capabilities. Execute code, manipulate files, and complete multi-step tasks efficiently.`,
          tools,
        });
        break;

      default:
        console.warn(`Unknown subagent name: ${name}`);
    }
  }

  return subagents;
}

// Re-export types for convenience
export type { SubAgent } from "deepagents";
