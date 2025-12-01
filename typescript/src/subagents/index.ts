/**
 * PTC Agent Subagents Module.
 *
 * This module provides subagent configurations for the PTC agent,
 * mirroring the Python implementation:
 *
 * - general - General-purpose task execution agent
 * - research - Web research and information gathering agent
 */

export {
  getGeneralSubagentConfig,
  createGeneralSubagent,
  type GeneralSubagentOptions,
} from "./general.js";

export {
  getResearchSubagentConfig,
  createResearchSubagent,
  type ResearchSubagentOptions,
} from "./research.js";
