/**
 * Environment variable configuration for PTC Agent.
 *
 * Provides typed access to environment variables with defaults and validation.
 * All configuration can be set via environment variables for flexibility.
 */

/**
 * Model tier for configuring different capability levels.
 * - "powerful": High-capability model for complex reasoning
 * - "standard": Balanced model for general use
 * - "lightweight": Fast, efficient model for simple tasks
 */
export type ModelTier = "powerful" | "standard" | "lightweight";

/**
 * Get an environment variable with an optional default.
 */
function getEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] ?? defaultValue;
}

/**
 * Get a required environment variable, throwing if not set.
 */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

/**
 * Get a boolean environment variable.
 */
function getBoolEnv(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === "true" || value === "1";
}

/**
 * Get a numeric environment variable.
 */
function getNumEnv(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Environment configuration for PTC Agent.
 */
export interface PTCEnvConfig {
  // Model Configuration
  /** Default model to use (can be model ID or alias) */
  defaultModel: string;
  /** Powerful model for complex tasks */
  powerfulModel: string;
  /** Standard model for general use */
  standardModel: string;
  /** Lightweight model for simple tasks */
  lightweightModel: string;

  // API Keys
  /** Anthropic API key */
  anthropicApiKey?: string;
  /** OpenAI API key */
  openaiApiKey?: string;
  /** Google/Gemini API key */
  googleApiKey?: string;
  /** Daytona API key */
  daytonaApiKey?: string;

  // Agent Configuration
  /** Maximum recursion limit for agent */
  maxRecursionLimit: number;
  /** Enable vision/image capabilities */
  enableVision: boolean;
  /** Enable custom filesystem tools */
  enableCustomFilesystemTools: boolean;

  // Subagent Configuration
  /** Enabled subagent types */
  enabledSubagents: string[];
  /** Model to use for research subagent (defaults to standardModel) */
  researchModel?: string;
  /** Model to use for general-purpose subagent (defaults to standardModel) */
  generalPurposeModel?: string;

  // Logging
  /** Log level */
  logLevel: string;
}

/**
 * Load configuration from environment variables.
 *
 * Environment variables:
 * - PTC_DEFAULT_MODEL: Default model to use
 * - PTC_POWERFUL_MODEL: Model for complex tasks
 * - PTC_STANDARD_MODEL: Model for general use
 * - PTC_LIGHTWEIGHT_MODEL: Model for simple tasks
 * - ANTHROPIC_API_KEY: Anthropic API key
 * - OPENAI_API_KEY: OpenAI API key
 * - GOOGLE_API_KEY: Google/Gemini API key
 * - DAYTONA_API_KEY: Daytona sandbox API key
 * - PTC_MAX_RECURSION_LIMIT: Max recursion limit (default: 50)
 * - PTC_ENABLE_VISION: Enable vision capabilities (default: true)
 * - PTC_ENABLE_CUSTOM_FS_TOOLS: Enable custom filesystem tools (default: true)
 * - PTC_ENABLED_SUBAGENTS: Comma-separated list of subagents
 * - PTC_RESEARCH_MODEL: Model for research subagent
 * - PTC_GENERAL_PURPOSE_MODEL: Model for general-purpose subagent
 * - PTC_LOG_LEVEL: Log level (default: info)
 */
export function loadEnvConfig(): PTCEnvConfig {
  // Default model identifiers
  const defaultPowerful = "claude-sonnet-4-5-20250929";
  const defaultStandard = "claude-sonnet-4-5-20250929";
  const defaultLightweight = "claude-sonnet-4-5-20250929";

  const config: PTCEnvConfig = {
    // Model Configuration
    defaultModel: getEnv("PTC_DEFAULT_MODEL", defaultStandard)!,
    powerfulModel: getEnv("PTC_POWERFUL_MODEL", defaultPowerful)!,
    standardModel: getEnv("PTC_STANDARD_MODEL", defaultStandard)!,
    lightweightModel: getEnv("PTC_LIGHTWEIGHT_MODEL", defaultLightweight)!,

    // API Keys
    anthropicApiKey: getEnv("ANTHROPIC_API_KEY"),
    openaiApiKey: getEnv("OPENAI_API_KEY"),
    googleApiKey: getEnv("GOOGLE_API_KEY"),
    daytonaApiKey: getEnv("DAYTONA_API_KEY"),

    // Agent Configuration
    maxRecursionLimit: getNumEnv("PTC_MAX_RECURSION_LIMIT", 50),
    enableVision: getBoolEnv("PTC_ENABLE_VISION", true),
    enableCustomFilesystemTools: getBoolEnv("PTC_ENABLE_CUSTOM_FS_TOOLS", true),

    // Subagent Configuration
    enabledSubagents: (getEnv("PTC_ENABLED_SUBAGENTS", "general-purpose,research") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    researchModel: getEnv("PTC_RESEARCH_MODEL"),
    generalPurposeModel: getEnv("PTC_GENERAL_PURPOSE_MODEL"),

    // Logging
    logLevel: getEnv("PTC_LOG_LEVEL", "info")!,
  };

  return config;
}

/**
 * Get the model ID for a given tier.
 *
 * @param tier - Model tier to get
 * @param config - Environment configuration
 * @returns Model ID string
 */
export function getModelForTier(tier: ModelTier, config: PTCEnvConfig): string {
  switch (tier) {
    case "powerful":
      return config.powerfulModel;
    case "standard":
      return config.standardModel;
    case "lightweight":
      return config.lightweightModel;
    default:
      return config.defaultModel;
  }
}

/**
 * Validate that required API keys are present.
 *
 * @param config - Environment configuration
 * @throws Error if required keys are missing
 */
export function validateApiKeys(config: PTCEnvConfig): void {
  const hasAnthropicKey = !!config.anthropicApiKey;
  const hasOpenAIKey = !!config.openaiApiKey;
  const hasGoogleKey = !!config.googleApiKey;

  if (!hasAnthropicKey && !hasOpenAIKey && !hasGoogleKey) {
    throw new Error(
      "At least one LLM API key must be set: ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY"
    );
  }
}

// Export a singleton instance for convenience
let _envConfig: PTCEnvConfig | null = null;

/**
 * Get the environment configuration (cached after first load).
 */
export function getEnvConfig(): PTCEnvConfig {
  if (!_envConfig) {
    _envConfig = loadEnvConfig();
  }
  return _envConfig;
}

/**
 * Reset the cached environment configuration.
 * Useful for testing or reloading after env changes.
 */
export function resetEnvConfig(): void {
  _envConfig = null;
}
