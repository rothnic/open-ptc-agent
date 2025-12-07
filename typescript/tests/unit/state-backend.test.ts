/**
 * Unit tests for StateBackend.
 */

import { describe, it, expect } from "vitest";
import { StateBackend } from "../../src/backends/state.js";
import { createMockFiles, createMockStateAndStore } from "../utils.js";

describe("StateBackend", () => {
  describe("lsInfo", () => {
    it("should list files in a directory", () => {
      const files = createMockFiles({
        "/home/user/file1.txt": "content 1",
        "/home/user/file2.py": "print('hello')",
        "/home/user/subdir/file3.txt": "content 3",
      });

      const stateAndStore = createMockStateAndStore(files);
      const backend = new StateBackend(stateAndStore);

      const result = backend.lsInfo("/home/user");

      expect(result).toHaveLength(3);

      const paths = result.map((f) => f.path);
      expect(paths).toContain("/home/user/file1.txt");
      expect(paths).toContain("/home/user/file2.py");
      expect(paths).toContain("/home/user/subdir/");

      const subdir = result.find((f) => f.path === "/home/user/subdir/");
      expect(subdir?.is_dir).toBe(true);
    });

    it("should return empty array for non-existent directory", () => {
      const stateAndStore = createMockStateAndStore({});
      const backend = new StateBackend(stateAndStore);

      const result = backend.lsInfo("/nonexistent");

      expect(result).toHaveLength(0);
    });
  });

  describe("read", () => {
    it("should read file content with line numbers", () => {
      const files = createMockFiles({
        "/home/user/test.txt": "line 1\nline 2\nline 3",
      });

      const stateAndStore = createMockStateAndStore(files);
      const backend = new StateBackend(stateAndStore);

      const result = backend.read("/home/user/test.txt");

      expect(result).toContain("1. line 1");
      expect(result).toContain("2. line 2");
      expect(result).toContain("3. line 3");
    });

    it("should return error for non-existent file", () => {
      const stateAndStore = createMockStateAndStore({});
      const backend = new StateBackend(stateAndStore);

      const result = backend.read("/nonexistent.txt");

      expect(result).toContain("Error");
      expect(result).toContain("not found");
    });

    it("should respect offset and limit", () => {
      const files = createMockFiles({
        "/home/user/test.txt": "line 1\nline 2\nline 3\nline 4\nline 5",
      });

      const stateAndStore = createMockStateAndStore(files);
      const backend = new StateBackend(stateAndStore);

      const result = backend.read("/home/user/test.txt", 1, 2);

      expect(result).toContain("2. line 2");
      expect(result).toContain("3. line 3");
      expect(result).not.toContain("1. line 1");
      expect(result).not.toContain("4. line 4");
    });
  });

  describe("write", () => {
    it("should create a new file", () => {
      const stateAndStore = createMockStateAndStore({});
      const backend = new StateBackend(stateAndStore);

      const result = backend.write("/home/user/new.txt", "new content");

      expect(result.error).toBeUndefined();
      expect(result.path).toBe("/home/user/new.txt");
      expect(result.filesUpdate).toBeDefined();
      expect(result.filesUpdate?.["/home/user/new.txt"]).toBeDefined();
    });

    it("should return error when file exists", () => {
      const files = createMockFiles({
        "/home/user/existing.txt": "existing content",
      });

      const stateAndStore = createMockStateAndStore(files);
      const backend = new StateBackend(stateAndStore);

      const result = backend.write("/home/user/existing.txt", "new content");

      expect(result.error).toBeDefined();
      expect(result.error).toContain("already exists");
    });
  });

  describe("edit", () => {
    it("should replace string in file", () => {
      const files = createMockFiles({
        "/home/user/test.txt": "hello world",
      });

      const stateAndStore = createMockStateAndStore(files);
      const backend = new StateBackend(stateAndStore);

      const result = backend.edit(
        "/home/user/test.txt",
        "world",
        "universe"
      );

      expect(result.error).toBeUndefined();
      expect(result.occurrences).toBe(1);
      expect(result.filesUpdate).toBeDefined();

      const newContent = result.filesUpdate?.["/home/user/test.txt"]?.content;
      expect(newContent?.join("\n")).toBe("hello universe");
    });

    it("should return error when string not found", () => {
      const files = createMockFiles({
        "/home/user/test.txt": "hello world",
      });

      const stateAndStore = createMockStateAndStore(files);
      const backend = new StateBackend(stateAndStore);

      const result = backend.edit(
        "/home/user/test.txt",
        "notfound",
        "replacement"
      );

      expect(result.error).toBeDefined();
      expect(result.error).toContain("not found");
    });

    it("should replace all occurrences when replaceAll is true", () => {
      const files = createMockFiles({
        "/home/user/test.txt": "foo bar foo baz foo",
      });

      const stateAndStore = createMockStateAndStore(files);
      const backend = new StateBackend(stateAndStore);

      const result = backend.edit(
        "/home/user/test.txt",
        "foo",
        "qux",
        true
      );

      expect(result.error).toBeUndefined();
      expect(result.occurrences).toBe(3);

      const newContent = result.filesUpdate?.["/home/user/test.txt"]?.content;
      expect(newContent?.join("\n")).toBe("qux bar qux baz qux");
    });
  });

  describe("grepRaw", () => {
    it("should find matches in files", () => {
      const files = createMockFiles({
        "/home/user/test1.py": "print('hello')\nprint('world')",
        "/home/user/test2.py": "print('foo')",
      });

      const stateAndStore = createMockStateAndStore(files);
      const backend = new StateBackend(stateAndStore);

      const result = backend.grepRaw("print");

      expect(Array.isArray(result)).toBe(true);
      expect((result as any[]).length).toBe(3);
    });

    it("should return error for invalid regex", () => {
      const stateAndStore = createMockStateAndStore({});
      const backend = new StateBackend(stateAndStore);

      const result = backend.grepRaw("[invalid");

      expect(typeof result).toBe("string");
      expect(result).toContain("Error");
    });
  });

  describe("globInfo", () => {
    it("should find files matching pattern", () => {
      const files = createMockFiles({
        "/home/user/test1.py": "content",
        "/home/user/test2.py": "content",
        "/home/user/readme.md": "content",
      });

      const stateAndStore = createMockStateAndStore(files);
      const backend = new StateBackend(stateAndStore);

      const result = backend.globInfo("*.py", "/home/user");

      expect(result.length).toBe(2);
      const paths = result.map((f) => f.path);
      expect(paths).toContain("/home/user/test1.py");
      expect(paths).toContain("/home/user/test2.py");
    });

    it("should return empty array when no matches", () => {
      const files = createMockFiles({
        "/home/user/test.py": "content",
      });

      const stateAndStore = createMockStateAndStore(files);
      const backend = new StateBackend(stateAndStore);

      const result = backend.globInfo("*.txt", "/home/user");

      expect(result.length).toBe(0);
    });
  });
});
