/**
 * Unit tests for environment configuration.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  loadEnvConfig,
  getEnvConfig,
  resetEnvConfig,
  getModelForTier,
  validateApiKeys,
} from "../../src/config/env.js";

describe("Environment Configuration", () => {
  // Store original env values
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset config cache before each test
    resetEnvConfig();
  });

  afterEach(() => {
    // Restore original env values
    process.env = { ...originalEnv };
    resetEnvConfig();
  });

  describe("loadEnvConfig", () => {
    it("should load default values when no env vars set", () => {
      // Clear relevant env vars
      delete process.env.PTC_DEFAULT_MODEL;
      delete process.env.PTC_MODEL_SMALL;
      delete process.env.PTC_MODEL_MEDIUM;
      delete process.env.PTC_MODEL_LARGE;

      const config = loadEnvConfig();

      expect(config.defaultModel).toBe("claude-sonnet-4-5-20250929");
      expect(config.smallModel).toBe("claude-sonnet-4-5-20250929");
      expect(config.mediumModel).toBe("claude-sonnet-4-5-20250929");
      expect(config.largeModel).toBe("claude-sonnet-4-5-20250929");
    });

    it("should load custom model values from env", () => {
      process.env.PTC_DEFAULT_MODEL = "custom-default";
      process.env.PTC_MODEL_SMALL = "custom-small";
      process.env.PTC_MODEL_MEDIUM = "custom-medium";
      process.env.PTC_MODEL_LARGE = "custom-large";

      const config = loadEnvConfig();

      expect(config.defaultModel).toBe("custom-default");
      expect(config.smallModel).toBe("custom-small");
      expect(config.mediumModel).toBe("custom-medium");
      expect(config.largeModel).toBe("custom-large");
    });

    it("should load subagent model overrides", () => {
      process.env.PTC_RESEARCH_MODEL = "research-model";
      process.env.PTC_GENERAL_PURPOSE_MODEL = "general-model";

      const config = loadEnvConfig();

      expect(config.researchModel).toBe("research-model");
      expect(config.generalPurposeModel).toBe("general-model");
    });

    it("should parse boolean values correctly", () => {
      process.env.PTC_ENABLE_VISION = "true";
      process.env.PTC_ENABLE_CUSTOM_FS_TOOLS = "false";

      const config = loadEnvConfig();

      expect(config.enableVision).toBe(true);
      expect(config.enableCustomFilesystemTools).toBe(false);
    });

    it("should parse numeric values correctly", () => {
      process.env.PTC_MAX_RECURSION_LIMIT = "100";

      const config = loadEnvConfig();

      expect(config.maxRecursionLimit).toBe(100);
    });

    it("should parse enabled subagents list", () => {
      process.env.PTC_ENABLED_SUBAGENTS = "research,general-purpose,custom";

      const config = loadEnvConfig();

      expect(config.enabledSubagents).toEqual([
        "research",
        "general-purpose",
        "custom",
      ]);
    });

    it("should load API keys from env", () => {
      process.env.ANTHROPIC_API_KEY = "anthropic-key";
      process.env.OPENAI_API_KEY = "openai-key";
      process.env.GOOGLE_API_KEY = "google-key";
      process.env.DAYTONA_API_KEY = "daytona-key";

      const config = loadEnvConfig();

      expect(config.anthropicApiKey).toBe("anthropic-key");
      expect(config.openaiApiKey).toBe("openai-key");
      expect(config.googleApiKey).toBe("google-key");
      expect(config.daytonaApiKey).toBe("daytona-key");
    });
  });

  describe("getEnvConfig", () => {
    it("should cache config after first load", () => {
      process.env.PTC_DEFAULT_MODEL = "first-model";
      const firstConfig = getEnvConfig();

      process.env.PTC_DEFAULT_MODEL = "second-model";
      const secondConfig = getEnvConfig();

      // Should return cached value
      expect(secondConfig.defaultModel).toBe("first-model");
      expect(firstConfig.defaultModel).toBe(secondConfig.defaultModel);
    });

    it("should return fresh config after reset", () => {
      process.env.PTC_DEFAULT_MODEL = "first-model";
      getEnvConfig();

      resetEnvConfig();
      process.env.PTC_DEFAULT_MODEL = "second-model";
      const config = getEnvConfig();

      expect(config.defaultModel).toBe("second-model");
    });
  });

  describe("getModelForTier", () => {
    it("should return correct model for each tier", () => {
      process.env.PTC_MODEL_SMALL = "small-model";
      process.env.PTC_MODEL_MEDIUM = "medium-model";
      process.env.PTC_MODEL_LARGE = "large-model";

      const config = loadEnvConfig();

      expect(getModelForTier("small", config)).toBe("small-model");
      expect(getModelForTier("medium", config)).toBe("medium-model");
      expect(getModelForTier("large", config)).toBe("large-model");
    });
  });

  describe("validateApiKeys", () => {
    it("should not throw when at least one API key is set", () => {
      const config = loadEnvConfig();
      config.anthropicApiKey = "test-key";
      config.openaiApiKey = undefined;
      config.googleApiKey = undefined;

      expect(() => validateApiKeys(config)).not.toThrow();
    });

    it("should throw when no API keys are set", () => {
      const config = loadEnvConfig();
      config.anthropicApiKey = undefined;
      config.openaiApiKey = undefined;
      config.googleApiKey = undefined;

      expect(() => validateApiKeys(config)).toThrow(
        "At least one LLM API key must be set"
      );
    });
  });
});
