/**
 * Subagent middleware for delegating tasks to specialized agents.
 *
 * Re-exports the subagent middleware from deepagents with PTC-specific extensions.
 */

// Re-export from deepagents for compatibility
export {
  createSubAgentMiddleware,
  type SubAgentMiddlewareOptions,
  type SubAgent,
} from "deepagents";
