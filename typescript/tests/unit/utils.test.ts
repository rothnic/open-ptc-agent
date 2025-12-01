/**
 * Unit tests for backend utilities.
 */

import { describe, it, expect } from "vitest";
import {
  createFileData,
  updateFileData,
  fileDataToString,
  formatReadResponse,
  performStringReplacement,
  grepMatchesFromFiles,
  globSearchFiles,
  sanitizeToolCallId,
  formatLsOutput,
  parseFilePath,
} from "../../src/backends/utils.js";
import { createMockFiles } from "../utils.js";

describe("Backend Utilities", () => {
  describe("createFileData", () => {
    it("should create file data with content and timestamps", () => {
      const content = "line 1\nline 2\nline 3";
      const result = createFileData(content);

      expect(result.content).toEqual(["line 1", "line 2", "line 3"]);
      expect(result.created_at).toBeDefined();
      expect(result.modified_at).toBeDefined();
      expect(result.created_at).toBe(result.modified_at);
    });
  });

  describe("updateFileData", () => {
    it("should update content while preserving created_at", () => {
      const original = createFileData("original content");
      const originalCreatedAt = original.created_at;

      // Small delay to ensure different timestamp
      const updated = updateFileData(original, "new content");

      expect(updated.content).toEqual(["new content"]);
      expect(updated.created_at).toBe(originalCreatedAt);
      expect(updated.modified_at).toBeDefined();
    });
  });

  describe("fileDataToString", () => {
    it("should join content lines with newlines", () => {
      const fileData = createFileData("line 1\nline 2\nline 3");
      const result = fileDataToString(fileData);

      expect(result).toBe("line 1\nline 2\nline 3");
    });
  });

  describe("formatReadResponse", () => {
    it("should format content with line numbers", () => {
      const fileData = createFileData("line 1\nline 2\nline 3");
      const result = formatReadResponse(fileData);

      expect(result).toContain("1. line 1");
      expect(result).toContain("2. line 2");
      expect(result).toContain("3. line 3");
    });

    it("should respect offset", () => {
      const fileData = createFileData("line 1\nline 2\nline 3\nline 4\nline 5");
      const result = formatReadResponse(fileData, 2, 2);

      expect(result).toContain("3. line 3");
      expect(result).toContain("4. line 4");
      expect(result).not.toContain("1. line 1");
      expect(result).not.toContain("2. line 2");
    });

    it("should indicate remaining lines when truncated", () => {
      const fileData = createFileData("line 1\nline 2\nline 3\nline 4\nline 5");
      const result = formatReadResponse(fileData, 0, 3);

      expect(result).toContain("2 more lines");
    });
  });

  describe("performStringReplacement", () => {
    it("should replace single occurrence", () => {
      const result = performStringReplacement(
        "hello world",
        "world",
        "universe"
      );

      expect(Array.isArray(result)).toBe(true);
      const [newContent, count] = result as [string, number];
      expect(newContent).toBe("hello universe");
      expect(count).toBe(1);
    });

    it("should return error when not found", () => {
      const result = performStringReplacement("hello world", "foo", "bar");

      expect(typeof result).toBe("string");
      expect(result).toContain("not found");
    });

    it("should error on multiple occurrences without replaceAll", () => {
      const result = performStringReplacement("foo foo foo", "foo", "bar");

      expect(typeof result).toBe("string");
      expect(result).toContain("3 occurrences");
    });

    it("should replace all when replaceAll is true", () => {
      const result = performStringReplacement(
        "foo bar foo baz foo",
        "foo",
        "qux",
        true
      );

      expect(Array.isArray(result)).toBe(true);
      const [newContent, count] = result as [string, number];
      expect(newContent).toBe("qux bar qux baz qux");
      expect(count).toBe(3);
    });
  });

  describe("grepMatchesFromFiles", () => {
    it("should find matches across files", () => {
      const files = createMockFiles({
        "/home/user/test1.py": "print('hello')\nprint('world')",
        "/home/user/test2.py": "print('foo')",
      });

      const result = grepMatchesFromFiles(files, "print");

      expect(Array.isArray(result)).toBe(true);
      expect((result as any[]).length).toBe(3);
    });

    it("should filter by glob pattern", () => {
      const files = createMockFiles({
        "/home/user/test.py": "print('hello')",
        "/home/user/readme.md": "print in markdown",
      });

      const result = grepMatchesFromFiles(files, "print", "/home/user", "*.py");

      expect(Array.isArray(result)).toBe(true);
      expect((result as any[]).length).toBe(1);
      expect((result as any[])[0].path).toBe("/home/user/test.py");
    });

    it("should return error for invalid regex", () => {
      const files = createMockFiles({
        "/home/user/test.txt": "content",
      });

      const result = grepMatchesFromFiles(files, "[invalid");

      expect(typeof result).toBe("string");
      expect(result).toContain("Error");
    });
  });

  describe("globSearchFiles", () => {
    it("should find files matching pattern", () => {
      const files = createMockFiles({
        "/home/user/test1.py": "content",
        "/home/user/test2.py": "content",
        "/home/user/readme.md": "content",
      });

      const result = globSearchFiles(files, "*.py", "/home/user");

      expect(result).toContain("/home/user/test1.py");
      expect(result).toContain("/home/user/test2.py");
      expect(result).not.toContain("readme.md");
    });

    it("should return 'No files found' when no matches", () => {
      const files = createMockFiles({
        "/home/user/test.py": "content",
      });

      const result = globSearchFiles(files, "*.txt", "/home/user");

      expect(result).toBe("No files found");
    });
  });

  describe("sanitizeToolCallId", () => {
    it("should replace special characters with underscores", () => {
      expect(sanitizeToolCallId("call-123")).toBe("call-123");
      expect(sanitizeToolCallId("call@#$%")).toBe("call____");
      expect(sanitizeToolCallId("normal_id-123")).toBe("normal_id-123");
    });
  });

  describe("formatLsOutput", () => {
    it("should format file info for display", () => {
      const infos = [
        { path: "/home/user/file.txt", is_dir: false, size: 100 },
        { path: "/home/user/subdir/", is_dir: true },
      ];

      const result = formatLsOutput(infos);

      expect(result).toContain("/home/user/file.txt (100 bytes)");
      expect(result).toContain("/home/user/subdir/ (directory)");
    });

    it("should return 'No files found' for empty array", () => {
      const result = formatLsOutput([]);
      expect(result).toBe("No files found");
    });
  });

  describe("parseFilePath", () => {
    it("should extract directory and filename", () => {
      const result = parseFilePath("/home/user/file.txt");

      expect(result.directory).toBe("/home/user");
      expect(result.filename).toBe("file.txt");
    });

    it("should handle root level files", () => {
      const result = parseFilePath("/file.txt");

      expect(result.directory).toBe("/");
      expect(result.filename).toBe("file.txt");
    });

    it("should handle files without path", () => {
      const result = parseFilePath("file.txt");

      expect(result.directory).toBe("/");
      expect(result.filename).toBe("file.txt");
    });
  });
});
