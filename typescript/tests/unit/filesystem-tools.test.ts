/**
 * Unit tests for filesystem tools (read, write, edit).
 */

import { describe, it, expect, vi } from "vitest";
import { createFilesystemTools } from "../../src/tools/filesystem/file_ops.js";
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

describe("ReadFileTool", () => {
  it("should read file successfully", async () => {
    const mockBackend = createMockBackend();
    vi.mocked(mockBackend.read).mockResolvedValue("1. Hello, world!");

    const { readFile } = createFilesystemTools(mockBackend);
    const result = await readFile.invoke({ filePath: "test.txt" });

    expect(result).toContain("Hello, world!");
    expect(result).not.toContain("ERROR");
  });

  it("should return error for non-existent file", async () => {
    const mockBackend = createMockBackend();
    vi.mocked(mockBackend.read).mockResolvedValue("ERROR: File 'missing.txt' not found");

    const { readFile } = createFilesystemTools(mockBackend);
    const result = await readFile.invoke({ filePath: "missing.txt" });

    expect(result).toContain("ERROR");
    expect(result).toContain("not found");
  });

  it("should pass offset and limit to backend", async () => {
    const mockBackend = createMockBackend();
    vi.mocked(mockBackend.read).mockResolvedValue("2. line 2\n3. line 3");

    const { readFile } = createFilesystemTools(mockBackend);
    await readFile.invoke({ filePath: "test.txt", offset: 1, limit: 2 });

    expect(mockBackend.read).toHaveBeenCalledWith("test.txt", 1, 2);
  });

  it("should handle read errors", async () => {
    const mockBackend = createMockBackend();
    vi.mocked(mockBackend.read).mockRejectedValue(new Error("Read failed"));

    const { readFile } = createFilesystemTools(mockBackend);
    const result = await readFile.invoke({ filePath: "test.txt" });

    expect(result).toContain("ERROR");
    expect(result).toContain("Failed to read file");
  });
});

describe("WriteFileTool", () => {
  it("should write file successfully", async () => {
    const mockBackend = createMockBackend();
    vi.mocked(mockBackend.write).mockResolvedValue({
      path: "/home/daytona/output.txt",
      filesUpdate: null,
    });

    const { writeFile } = createFilesystemTools(mockBackend);
    const result = await writeFile.invoke({
      filePath: "output.txt",
      content: "Test content",
    });

    expect(result).toContain("Wrote 12 bytes");
    expect(result).not.toContain("ERROR");
  });

  it("should return error on write failure", async () => {
    const mockBackend = createMockBackend();
    vi.mocked(mockBackend.write).mockResolvedValue({
      error: "Failed to write file",
    });

    const { writeFile } = createFilesystemTools(mockBackend);
    const result = await writeFile.invoke({
      filePath: "output.txt",
      content: "Test",
    });

    expect(result).toContain("ERROR");
  });

  it("should handle write exception", async () => {
    const mockBackend = createMockBackend();
    vi.mocked(mockBackend.write).mockRejectedValue(new Error("Write failed"));

    const { writeFile } = createFilesystemTools(mockBackend);
    const result = await writeFile.invoke({
      filePath: "output.txt",
      content: "Test",
    });

    expect(result).toContain("ERROR");
    expect(result).toContain("Failed to write file");
  });
});

describe("EditFileTool", () => {
  it("should edit file successfully", async () => {
    const mockBackend = createMockBackend();
    vi.mocked(mockBackend.edit).mockResolvedValue({
      path: "/home/daytona/test.txt",
      filesUpdate: null,
      occurrences: 1,
    });

    const { editFile } = createFilesystemTools(mockBackend);
    const result = await editFile.invoke({
      filePath: "test.txt",
      oldString: "old",
      newString: "new",
    });

    expect(result).toContain("Successfully edited");
    expect(result).not.toContain("ERROR");
  });

  it("should return error when string not found", async () => {
    const mockBackend = createMockBackend();
    vi.mocked(mockBackend.edit).mockResolvedValue({
      error: "String 'notfound' not found in file",
    });

    const { editFile } = createFilesystemTools(mockBackend);
    const result = await editFile.invoke({
      filePath: "test.txt",
      oldString: "notfound",
      newString: "replacement",
    });

    expect(result).toContain("ERROR");
    expect(result).toContain("not found");
  });

  it("should handle replaceAll option", async () => {
    const mockBackend = createMockBackend();
    vi.mocked(mockBackend.edit).mockResolvedValue({
      path: "/home/daytona/test.txt",
      filesUpdate: null,
      occurrences: 3,
    });

    const { editFile } = createFilesystemTools(mockBackend);
    const result = await editFile.invoke({
      filePath: "test.txt",
      oldString: "foo",
      newString: "bar",
      replaceAll: true,
    });

    expect(result).toContain("Replaced 3 occurrence(s)");
    expect(result).not.toContain("ERROR");
    expect(mockBackend.edit).toHaveBeenCalledWith("test.txt", "foo", "bar", true);
  });

  it("should handle edit exception", async () => {
    const mockBackend = createMockBackend();
    vi.mocked(mockBackend.edit).mockRejectedValue(new Error("Edit failed"));

    const { editFile } = createFilesystemTools(mockBackend);
    const result = await editFile.invoke({
      filePath: "test.txt",
      oldString: "old",
      newString: "new",
    });

    expect(result).toContain("ERROR");
    expect(result).toContain("Failed to edit file");
  });
});

describe("Filesystem tools integration", () => {
  it("should create all three tools", () => {
    const mockBackend = createMockBackend();
    const tools = createFilesystemTools(mockBackend);

    expect(tools.readFile).toBeDefined();
    expect(tools.writeFile).toBeDefined();
    expect(tools.editFile).toBeDefined();
  });

  it("read_file tool should have correct name", () => {
    const mockBackend = createMockBackend();
    const { readFile } = createFilesystemTools(mockBackend);

    expect(readFile.name).toBe("read_file");
  });

  it("write_file tool should have correct name", () => {
    const mockBackend = createMockBackend();
    const { writeFile } = createFilesystemTools(mockBackend);

    expect(writeFile.name).toBe("write_file");
  });

  it("edit_file tool should have correct name", () => {
    const mockBackend = createMockBackend();
    const { editFile } = createFilesystemTools(mockBackend);

    expect(editFile.name).toBe("edit_file");
  });
});
