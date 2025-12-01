/**
 * PTC Agent - Main agent using deepagents with Programmatic Tool Calling pattern.
 *
 * This module creates a PTC agent that:
 * - Uses deepagent's createDeepAgent for orchestration
 * - Integrates Daytona sandbox via DaytonaBackend
 * - Provides MCP tools through execute_code
 * - Supports sub-agent delegation for specialized tasks
 *
 * Configuration is driven by environment variables for flexibility:
 * - PTC_DEFAULT_MODEL: Default model to use
 * - PTC_MODEL_SMALL: Model for simple, fast tasks
 * - PTC_MODEL_MEDIUM: Model for general use
 * - PTC_MODEL_LARGE: Model for complex reasoning tasks
 * - PTC_RESEARCH_MODEL: Override model for research subagent
 * - PTC_GENERAL_PURPOSE_MODEL: Override model for general-purpose subagent
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
import { getEnvConfig, type PTCEnvConfig, type ModelTier } from "./config/index.js";
import {
  buildSystemPrompt,
  buildResearchPrompt,
  buildGeneralPurposePrompt,
} from "./prompts/index.js";

/**
 * Configuration for PTC Agent.
 */
export interface PTCAgentConfig {
  /**
   * The LLM model to use. Can be:
   * - A model ID string (e.g., "claude-sonnet-4-5-20250929")
   * - A ModelTier ("small", "medium", "large") to use configured models
   * - A BaseLanguageModel instance
   *
   * Defaults to the PTC_DEFAULT_MODEL environment variable or "claude-sonnet-4-5-20250929".
   */
  model?: BaseLanguageModel | string | ModelTier;

  /** Custom system prompt for the agent (combined with base PTC prompt) */
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

  /** Enable cloud storage for image uploads (default: from env) */
  storageEnabled?: boolean;
}

/**
 * Configuration for subagent creation.
 */
export interface SubagentConfig {
  /** List of subagent types to create */
  names: string[];

  /** Tools to provide to all subagents */
  tools?: StructuredTool[];

  /** Override model for specific subagents */
  modelOverrides?: {
    research?: string;
    "general-purpose"?: string;
  };

  /** Max iterations for research subagent */
  researchMaxIterations?: number;

  /** Max iterations for general-purpose subagent */
  generalPurposeMaxIterations?: number;

  /** Enable storage for subagents */
  storageEnabled?: boolean;
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
 * Resolve a model specification to a model string.
 *
 * @param model - Model specification (string, tier, or instance)
 * @param config - Environment configuration
 * @returns Resolved model string or instance
 */
function resolveModel(
  model: BaseLanguageModel | string | ModelTier | undefined,
  config: PTCEnvConfig
): BaseLanguageModel | string {
  if (!model) {
    return config.defaultModel;
  }

  if (typeof model !== "string") {
    return model as BaseLanguageModel;
  }

  // Check if it's a tier name
  if (model === "small" || model === "medium" || model === "large") {
    switch (model) {
      case "small":
        return config.smallModel;
      case "medium":
        return config.mediumModel;
      case "large":
        return config.largeModel;
    }
  }

  // Return as-is (model ID string)
  return model;
}

/**
 * Create a PTC Agent with the specified configuration.
 *
 * This function creates a deep agent configured for Programmatic Tool Calling (PTC).
 * It combines deepagents capabilities with Daytona sandbox integration.
 *
 * Model configuration is driven by environment variables:
 * - PTC_DEFAULT_MODEL: Default model (used if no model specified)
 * - PTC_MODEL_SMALL: Model for "small" tier (fast, simple tasks)
 * - PTC_MODEL_MEDIUM: Model for "medium" tier (general use)
 * - PTC_MODEL_LARGE: Model for "large" tier (complex reasoning)
 *
 * @param config - Agent configuration
 * @returns A configured deep agent ready for invocation
 *
 * @example
 * ```typescript
 * import { createPTCAgent } from "@open-ptc-agent/typescript";
 *
 * // Use default model from environment
 * const agent = createPTCAgent({
 *   tools: [executeCodeTool],
 * });
 *
 * // Use a specific model tier
 * const largeAgent = createPTCAgent({
 *   model: "large",
 *   tools: [executeCodeTool],
 * });
 *
 * // Use a specific model ID
 * const customAgent = createPTCAgent({
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
  const envConfig = getEnvConfig();

  const {
    model,
    systemPrompt,
    tools = [],
    middleware = [],
    subagents = [],
    backend,
    checkpointer,
    store,
    name,
    storageEnabled = false,
  } = config;

  // Resolve model from config or environment
  const resolvedModel = resolveModel(model, envConfig);

  // Build system prompt with PTC-specific instructions
  const baseSystemPrompt = buildSystemPrompt({
    storageEnabled,
    includeTaskWorkflow: true,
  });

  // Combine custom prompt with base prompt
  const ptcSystemPrompt = systemPrompt
    ? `${systemPrompt}\n\n${baseSystemPrompt}`
    : baseSystemPrompt;

  // Create the deep agent with PTC configuration
  return createDeepAgent({
    model: resolvedModel,
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
 * Create subagent configurations for PTC agent.
 *
 * Uses environment variables for model configuration:
 * - PTC_RESEARCH_MODEL: Override model for research subagent
 * - PTC_GENERAL_PURPOSE_MODEL: Override model for general-purpose subagent
 *
 * Falls back to PTC_MODEL_MEDIUM if not specified.
 *
 * @param config - Subagent configuration
 * @returns Array of SubAgent configurations
 */
export function createPTCSubagents(config: SubagentConfig): SubAgent[] {
  const envConfig = getEnvConfig();
  const {
    names,
    tools = [],
    modelOverrides = {},
    researchMaxIterations = 5,
    generalPurposeMaxIterations = 15,
    storageEnabled = false,
  } = config;

  const subagents: SubAgent[] = [];

  for (const name of names) {
    switch (name) {
      case "research": {
        // Determine model: override > env var > default (medium)
        const researchModel =
          modelOverrides.research ||
          envConfig.researchModel ||
          envConfig.mediumModel;

        subagents.push({
          name: "research",
          description:
            "Use this agent for conducting thorough research on complex topics. It has access to web search and can synthesize information from multiple sources.",
          systemPrompt: buildResearchPrompt({
            maxIterations: researchMaxIterations,
          }),
          tools,
          model: researchModel,
        });
        break;
      }

      case "general-purpose": {
        // Determine model: override > env var > default (medium)
        const generalModel =
          modelOverrides["general-purpose"] ||
          envConfig.generalPurposeModel ||
          envConfig.mediumModel;

        subagents.push({
          name: "general-purpose",
          description:
            "General-purpose agent for executing code, file operations, and multi-step tasks. Use this for complex tasks that require isolated context.",
          systemPrompt: buildGeneralPurposePrompt({
            maxIterations: generalPurposeMaxIterations,
            storageEnabled,
          }),
          tools,
          model: generalModel,
        });
        break;
      }

      default:
        console.warn(`Unknown subagent name: ${name}`);
    }
  }

  return subagents;
}

// Re-export types for convenience
export type { SubAgent } from "deepagents";
export type { ModelTier } from "./config/index.js";
