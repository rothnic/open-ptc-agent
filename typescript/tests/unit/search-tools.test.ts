/**
 * Unit tests for search tools (glob, grep).
 */

import { describe, it, expect, vi } from "vitest";
import { createGlobTool } from "../../src/tools/search/glob.js";
import { createGrepTool } from "../../src/tools/search/grep.js";
import type { BackendProtocol } from "../../src/backends/protocol.js";

// Create mock backend
function createMockBackend(): BackendProtocol {
  return {
    lsInfo: vi.fn(),
    read: vi.fn(),
    readRaw: vi.fn(),
    write: vi.fn(),
    edit: vi.fn(),
    grepRaw: vi.fn(),
    globInfo: vi.fn(),
  };
}

describe("GlobTool", () => {
  describe("successful pattern matching", () => {
    it("should find files matching *.py pattern", async () => {
      const mockBackend = createMockBackend();
      vi.mocked(mockBackend.globInfo).mockResolvedValue([
        { path: "/home/daytona/test1.py" },
        { path: "/home/daytona/test2.py" },
      ]);

      const globTool = createGlobTool(mockBackend);
      const result = await globTool.invoke({ pattern: "*.py" });

      expect(result).not.toContain("ERROR");
      expect(result).toContain("Found 2 file(s)");
      expect(result).toContain("test1.py");
      expect(result).toContain("test2.py");
    });

    it("should find files matching recursive pattern", async () => {
      const mockBackend = createMockBackend();
      vi.mocked(mockBackend.globInfo).mockResolvedValue([
        { path: "/home/daytona/src/agent.py" },
        { path: "/home/daytona/tests/test_agent.py" },
      ]);

      const globTool = createGlobTool(mockBackend);
      const result = await globTool.invoke({ pattern: "**/*.py" });

      expect(result).not.toContain("ERROR");
      expect(result).toContain("Found 2 file(s)");
    });

    it("should search in specific directory", async () => {
      const mockBackend = createMockBackend();
      vi.mocked(mockBackend.globInfo).mockResolvedValue([
        { path: "/home/daytona/subdir/file.py" },
      ]);

      const globTool = createGlobTool(mockBackend);
      const result = await globTool.invoke({ pattern: "*.py", path: "/home/daytona/subdir" });

      expect(mockBackend.globInfo).toHaveBeenCalledWith("*.py", "/home/daytona/subdir");
      expect(result).toContain("Found 1 file(s)");
    });

    it("should find text files", async () => {
      const mockBackend = createMockBackend();
      vi.mocked(mockBackend.globInfo).mockResolvedValue([
        { path: "/home/daytona/test.txt" },
      ]);

      const globTool = createGlobTool(mockBackend);
      const result = await globTool.invoke({ pattern: "*.txt" });

      expect(result).toContain("test.txt");
    });
  });

  describe("empty results", () => {
    it("should return message when no files match", async () => {
      const mockBackend = createMockBackend();
      vi.mocked(mockBackend.globInfo).mockResolvedValue([]);

      const globTool = createGlobTool(mockBackend);
      const result = await globTool.invoke({ pattern: "*.nonexistent" });

      expect(result).toContain("No files matching pattern");
    });
  });

  describe("error handling", () => {
    it("should handle backend errors", async () => {
      const mockBackend = createMockBackend();
      vi.mocked(mockBackend.globInfo).mockRejectedValue(new Error("Filesystem error"));

      const globTool = createGlobTool(mockBackend);
      const result = await globTool.invoke({ pattern: "*.py" });

      expect(result).toContain("ERROR");
      expect(result).toContain("Failed to glob files");
    });
  });

  describe("tool properties", () => {
    it("should have correct name", () => {
      const mockBackend = createMockBackend();
      const globTool = createGlobTool(mockBackend);

      expect(globTool.name).toBe("glob");
    });
  });
});

describe("GrepTool", () => {
  describe("successful content search", () => {
    it("should find matches in files", async () => {
      const mockBackend = createMockBackend();
      vi.mocked(mockBackend.grepRaw).mockResolvedValue([
        { path: "/home/daytona/file1.py", line: 10, text: "def hello():" },
        { path: "/home/daytona/file2.py", line: 20, text: "def world():" },
      ]);

      const grepTool = createGrepTool(mockBackend);
      const result = await grepTool.invoke({ pattern: "def " });

      expect(result).not.toContain("ERROR");
      expect(result).toContain("Matches for pattern 'def '");
      expect(result).toContain("file1.py");
      expect(result).toContain("hello()");
    });

    it("should search in specific path", async () => {
      const mockBackend = createMockBackend();
      vi.mocked(mockBackend.grepRaw).mockResolvedValue([
        { path: "/home/daytona/src/agent.py", line: 5, text: "class Agent:" },
      ]);

      const grepTool = createGrepTool(mockBackend);
      const result = await grepTool.invoke({ pattern: "class", path: "/home/daytona/src" });

      expect(mockBackend.grepRaw).toHaveBeenCalledWith("class", "/home/daytona/src", undefined);
      expect(result).toContain("agent.py");
    });

    it("should filter with glob pattern", async () => {
      const mockBackend = createMockBackend();
      vi.mocked(mockBackend.grepRaw).mockResolvedValue([
        { path: "/home/daytona/test.py", line: 1, text: "import unittest" },
      ]);

      const grepTool = createGrepTool(mockBackend);
      await grepTool.invoke({ pattern: "import", glob: "*.py" });

      expect(mockBackend.grepRaw).toHaveBeenCalledWith("import", null, "*.py");
    });
  });

  describe("empty results", () => {
    it("should return message when no matches found", async () => {
      const mockBackend = createMockBackend();
      vi.mocked(mockBackend.grepRaw).mockResolvedValue([]);

      const grepTool = createGrepTool(mockBackend);
      const result = await grepTool.invoke({ pattern: "nonexistent" });

      expect(result).toContain("No matches found");
    });
  });

  describe("error handling", () => {
    it("should handle backend errors", async () => {
      const mockBackend = createMockBackend();
      vi.mocked(mockBackend.grepRaw).mockRejectedValue(new Error("Search failed"));

      const grepTool = createGrepTool(mockBackend);
      const result = await grepTool.invoke({ pattern: "test" });

      expect(result).toContain("ERROR");
      expect(result).toContain("Failed to grep content");
    });

    it("should handle error string response", async () => {
      const mockBackend = createMockBackend();
      vi.mocked(mockBackend.grepRaw).mockResolvedValue("Invalid regex pattern");

      const grepTool = createGrepTool(mockBackend);
      const result = await grepTool.invoke({ pattern: "[invalid" });

      expect(result).toContain("ERROR");
    });
  });

  describe("tool properties", () => {
    it("should have correct name", () => {
      const mockBackend = createMockBackend();
      const grepTool = createGrepTool(mockBackend);

      expect(grepTool.name).toBe("grep");
    });
  });
});
