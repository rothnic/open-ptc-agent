/**
 * Unit tests for prompt templates.
 */

import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  buildResearchPrompt,
  buildGeneralPurposePrompt,
  getCurrentDate,
  WORKSPACE_PATHS,
  TOOL_DISCOVERY,
  OUTPUT_GUIDELINES,
  CITATION_RULES,
  SUBAGENT_COORDINATION,
  DATA_PROCESSING,
  IMAGE_UPLOAD,
} from "../../src/prompts/templates.js";

describe("Prompt Templates", () => {
  describe("getCurrentDate", () => {
    it("should return date in YYYY-MM-DD format", () => {
      const date = getCurrentDate();
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("Component Constants", () => {
    it("should have WORKSPACE_PATHS defined", () => {
      expect(WORKSPACE_PATHS).toContain("/home/daytona");
      expect(WORKSPACE_PATHS).toContain("/results");
    });

    it("should have TOOL_DISCOVERY defined", () => {
      expect(TOOL_DISCOVERY).toContain("MCP tools");
      expect(TOOL_DISCOVERY).toContain("/home/daytona/tools");
    });

    it("should have OUTPUT_GUIDELINES defined", () => {
      expect(OUTPUT_GUIDELINES).toContain("Save results");
      expect(OUTPUT_GUIDELINES).toContain("markdown");
    });

    it("should have CITATION_RULES defined", () => {
      expect(CITATION_RULES).toContain("source URL");
      expect(CITATION_RULES).toContain("citations");
    });

    it("should have SUBAGENT_COORDINATION defined", () => {
      expect(SUBAGENT_COORDINATION).toContain("task()");
      expect(SUBAGENT_COORDINATION).toContain("research");
      expect(SUBAGENT_COORDINATION).toContain("general-purpose");
    });

    it("should have DATA_PROCESSING defined", () => {
      expect(DATA_PROCESSING).toContain("Fetch in code");
      expect(DATA_PROCESSING).toContain("Return summaries");
    });

    it("should have IMAGE_UPLOAD defined", () => {
      expect(IMAGE_UPLOAD).toContain("cloud storage");
      expect(IMAGE_UPLOAD).toContain("PNG");
    });
  });

  describe("buildSystemPrompt", () => {
    it("should include date by default", () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain("today's date is");
    });

    it("should include custom date when provided", () => {
      const prompt = buildSystemPrompt({ date: "2025-01-15" });
      expect(prompt).toContain("2025-01-15");
    });

    it("should include task workflow by default", () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain("<task_workflow>");
      expect(prompt).toContain("Save the request");
    });

    it("should exclude task workflow when disabled", () => {
      const prompt = buildSystemPrompt({ includeTaskWorkflow: false });
      expect(prompt).not.toContain("<task_workflow>");
    });

    it("should include all components", () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain("<workspace_paths>");
      expect(prompt).toContain("<tool_discovery>");
      expect(prompt).toContain("<output_guidelines>");
      expect(prompt).toContain("<citation_rules>");
      expect(prompt).toContain("<subagent_coordination>");
      expect(prompt).toContain("<data_processing>");
    });

    it("should include image upload when storage enabled", () => {
      const prompt = buildSystemPrompt({ storageEnabled: true });
      expect(prompt).toContain("<image_upload>");
    });

    it("should exclude image upload when storage disabled", () => {
      const prompt = buildSystemPrompt({ storageEnabled: false });
      expect(prompt).not.toContain("<image_upload>");
    });
  });

  describe("buildResearchPrompt", () => {
    it("should include research specialist role", () => {
      const prompt = buildResearchPrompt();
      expect(prompt).toContain("research assistant");
      expect(prompt).toContain("research assistant subagent");
    });

    it("should include date", () => {
      const prompt = buildResearchPrompt({ date: "2025-01-15" });
      expect(prompt).toContain("2025-01-15");
    });

    it("should include available tools", () => {
      const prompt = buildResearchPrompt();
      expect(prompt).toContain("tavily_search");
      expect(prompt).toContain("think_tool");
    });

    it("should include max iterations", () => {
      const prompt = buildResearchPrompt({ maxIterations: 10 });
      expect(prompt).toContain("10");
    });

    it("should include workflow steps", () => {
      const prompt = buildResearchPrompt();
      expect(prompt).toContain("Carefully read");
      expect(prompt).toContain("Begin with broad searches");
      expect(prompt).toContain("Refine and narrow");
    });

    it("should include citation rules", () => {
      const prompt = buildResearchPrompt();
      expect(prompt).toContain("<citation_rules>");
    });
  });

  describe("buildGeneralPurposePrompt", () => {
    it("should include general-purpose role", () => {
      const prompt = buildGeneralPurposePrompt();
      expect(prompt).toContain("general-purpose task execution agent");
    });

    it("should include date", () => {
      const prompt = buildGeneralPurposePrompt({ date: "2025-01-15" });
      expect(prompt).toContain("2025-01-15");
    });

    it("should include available tools", () => {
      const prompt = buildGeneralPurposePrompt();
      expect(prompt).toContain("ls()");
      expect(prompt).toContain("read_file");
      expect(prompt).toContain("write_file");
      expect(prompt).toContain("edit_file");
      expect(prompt).toContain("bash");
      expect(prompt).toContain("execute_code");
    });

    it("should include max iterations", () => {
      const prompt = buildGeneralPurposePrompt({ maxIterations: 20 });
      expect(prompt).toContain("20");
    });

    it("should include image upload when storage enabled", () => {
      const prompt = buildGeneralPurposePrompt({ storageEnabled: true });
      expect(prompt).toContain("cloud storage");
    });

    it("should exclude image upload when storage disabled", () => {
      const prompt = buildGeneralPurposePrompt({ storageEnabled: false });
      expect(prompt).not.toContain("cloud storage");
    });

    it("should include output format requirements", () => {
      const prompt = buildGeneralPurposePrompt();
      expect(prompt).toContain("<Output Format>");
      expect(prompt).toContain("complete deliverable");
    });
  });
});
