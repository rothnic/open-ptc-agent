/**
 * Unit tests for execute_bash tool.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createExecuteBashTool } from "../../src/tools/bash/execute.js";
import type { SandboxBackendProtocol } from "../../src/backends/protocol.js";

// Create mock sandbox backend
function createMockSandbox(): SandboxBackendProtocol {
  return {
    lsInfo: vi.fn(),
    read: vi.fn(),
    readRaw: vi.fn(),
    write: vi.fn(),
    edit: vi.fn(),
    grepRaw: vi.fn(),
    globInfo: vi.fn(),
    executeCode: vi.fn(),
    executeBash: vi.fn(),
  };
}

describe("ExecuteBashTool", () => {
  describe("successful command execution", () => {
    it("should execute bash command with output", async () => {
      const mockSandbox = createMockSandbox();
      vi.mocked(mockSandbox.executeBash).mockResolvedValue({
        success: true,
        stdout: "file1.txt\nfile2.txt\nfile3.txt",
        stderr: "",
        execution_id: "bash",
        files_created: [],
        files_modified: [],
        duration: 0,
        code_hash: "",
      });

      const executeBash = createExecuteBashTool(mockSandbox);
      const result = await executeBash.invoke({
        command: "ls",
        workingDir: "/home/daytona",
      });

      expect(result).not.toContain("ERROR");
      expect(result).toContain("file1.txt");
      expect(result).toContain("file2.txt");
      expect(mockSandbox.executeBash).toHaveBeenCalledWith(
        "ls",
        "/home/daytona",
        120 // default timeout in seconds (120000 / 1000)
      );
    });

    it("should handle command with no output (e.g., mkdir)", async () => {
      const mockSandbox = createMockSandbox();
      vi.mocked(mockSandbox.executeBash).mockResolvedValue({
        success: true,
        stdout: "",
        stderr: "",
        execution_id: "bash",
        files_created: [],
        files_modified: [],
        duration: 0,
        code_hash: "",
      });

      const executeBash = createExecuteBashTool(mockSandbox);
      const result = await executeBash.invoke({
        command: "mkdir -p /home/daytona/testdir",
      });

      expect(result).not.toContain("ERROR");
      expect(result).toContain("Command completed successfully");
    });
  });

  describe("command failure handling", () => {
    it("should handle command failure", async () => {
      const mockSandbox = createMockSandbox();
      vi.mocked(mockSandbox.executeBash).mockResolvedValue({
        success: false,
        stdout: "",
        stderr: "ls: cannot access '/nonexistent': No such file or directory",
        execution_id: "bash",
        files_created: [],
        files_modified: [],
        duration: 0,
        code_hash: "",
      });

      const executeBash = createExecuteBashTool(mockSandbox);
      const result = await executeBash.invoke({
        command: "ls /nonexistent",
      });

      expect(result).toContain("ERROR");
      expect(result).toContain("No such file or directory");
    });

    it("should handle sandbox exception", async () => {
      const mockSandbox = createMockSandbox();
      vi.mocked(mockSandbox.executeBash).mockRejectedValue(
        new Error("Sandbox connection error")
      );

      const executeBash = createExecuteBashTool(mockSandbox);
      const result = await executeBash.invoke({
        command: "ls",
      });

      expect(result).toContain("ERROR");
      expect(result).toContain("Failed to execute bash command");
      expect(result).toContain("Sandbox connection error");
    });
  });

  describe("complex command execution", () => {
    it("should execute command with pipe", async () => {
      const mockSandbox = createMockSandbox();
      vi.mocked(mockSandbox.executeBash).mockResolvedValue({
        success: true,
        stdout: "100 lines counted",
        stderr: "",
        execution_id: "bash",
        files_created: [],
        files_modified: [],
        duration: 0,
        code_hash: "",
      });

      const executeBash = createExecuteBashTool(mockSandbox);
      const result = await executeBash.invoke({
        command: "cat file.txt | wc -l",
      });

      expect(result).not.toContain("ERROR");
      expect(result).toContain("100 lines counted");
    });

    it("should execute command with output redirection", async () => {
      const mockSandbox = createMockSandbox();
      vi.mocked(mockSandbox.executeBash).mockResolvedValue({
        success: true,
        stdout: "",
        stderr: "",
        execution_id: "bash",
        files_created: [],
        files_modified: [],
        duration: 0,
        code_hash: "",
      });

      const executeBash = createExecuteBashTool(mockSandbox);
      const result = await executeBash.invoke({
        command: "echo 'Hello World' > output.txt",
      });

      expect(result).not.toContain("ERROR");
    });

    it("should execute grep command", async () => {
      const mockSandbox = createMockSandbox();
      vi.mocked(mockSandbox.executeBash).mockResolvedValue({
        success: true,
        stdout: "file1.py:def function1():\nfile2.py:def function2():",
        stderr: "",
        execution_id: "bash",
        files_created: [],
        files_modified: [],
        duration: 0,
        code_hash: "",
      });

      const executeBash = createExecuteBashTool(mockSandbox);
      const result = await executeBash.invoke({
        command: "grep -r 'def ' *.py",
      });

      expect(result).not.toContain("ERROR");
      expect(result).toContain("file1.py");
      expect(result).toContain("function1");
    });

    it("should execute find command", async () => {
      const mockSandbox = createMockSandbox();
      vi.mocked(mockSandbox.executeBash).mockResolvedValue({
        success: true,
        stdout: "./file1.txt\n./subdir/file2.txt\n./subdir/file3.txt",
        stderr: "",
        execution_id: "bash",
        files_created: [],
        files_modified: [],
        duration: 0,
        code_hash: "",
      });

      const executeBash = createExecuteBashTool(mockSandbox);
      const result = await executeBash.invoke({
        command: "find . -name '*.txt'",
      });

      expect(result).not.toContain("ERROR");
      expect(result).toContain("file1.txt");
      expect(result).toContain("subdir/file2.txt");
    });

    it("should execute multiple chained commands", async () => {
      const mockSandbox = createMockSandbox();
      vi.mocked(mockSandbox.executeBash).mockResolvedValue({
        success: true,
        stdout: "Directory created and file written",
        stderr: "",
        execution_id: "bash",
        files_created: [],
        files_modified: [],
        duration: 0,
        code_hash: "",
      });

      const executeBash = createExecuteBashTool(mockSandbox);
      const result = await executeBash.invoke({
        command:
          "mkdir -p output && echo 'test' > output/file.txt && echo 'Directory created and file written'",
      });

      expect(result).not.toContain("ERROR");
      expect(result).toContain("Directory created and file written");
    });
  });

  describe("working directory handling", () => {
    it("should use custom working directory", async () => {
      const mockSandbox = createMockSandbox();
      vi.mocked(mockSandbox.executeBash).mockResolvedValue({
        success: true,
        stdout: "file.txt",
        stderr: "",
        execution_id: "bash",
        files_created: [],
        files_modified: [],
        duration: 0,
        code_hash: "",
      });

      const executeBash = createExecuteBashTool(mockSandbox);
      const result = await executeBash.invoke({
        command: "ls",
        workingDir: "/home/daytona/results",
      });

      expect(result).not.toContain("ERROR");
      expect(mockSandbox.executeBash).toHaveBeenCalledWith(
        "ls",
        "/home/daytona/results",
        120
      );
    });

    it("should use default working directory", async () => {
      const mockSandbox = createMockSandbox();
      vi.mocked(mockSandbox.executeBash).mockResolvedValue({
        success: true,
        stdout: "output",
        stderr: "",
        execution_id: "bash",
        files_created: [],
        files_modified: [],
        duration: 0,
        code_hash: "",
      });

      const executeBash = createExecuteBashTool(mockSandbox);
      await executeBash.invoke({
        command: "pwd",
      });

      expect(mockSandbox.executeBash).toHaveBeenCalledWith(
        "pwd",
        "/home/daytona",
        120
      );
    });
  });

  describe("additional command types", () => {
    it("should execute wc command", async () => {
      const mockSandbox = createMockSandbox();
      vi.mocked(mockSandbox.executeBash).mockResolvedValue({
        success: true,
        stdout: "  42  256 1824 file.txt",
        stderr: "",
        execution_id: "bash",
        files_created: [],
        files_modified: [],
        duration: 0,
        code_hash: "",
      });

      const executeBash = createExecuteBashTool(mockSandbox);
      const result = await executeBash.invoke({
        command: "wc file.txt",
      });

      expect(result).not.toContain("ERROR");
      expect(result).toContain("42");
    });

    it("should execute du command", async () => {
      const mockSandbox = createMockSandbox();
      vi.mocked(mockSandbox.executeBash).mockResolvedValue({
        success: true,
        stdout: "4.5M\tresults/",
        stderr: "",
        execution_id: "bash",
        files_created: [],
        files_modified: [],
        duration: 0,
        code_hash: "",
      });

      const executeBash = createExecuteBashTool(mockSandbox);
      const result = await executeBash.invoke({
        command: "du -sh results/",
      });

      expect(result).not.toContain("ERROR");
      expect(result).toContain("4.5M");
    });

    it("should execute cat command", async () => {
      const mockSandbox = createMockSandbox();
      vi.mocked(mockSandbox.executeBash).mockResolvedValue({
        success: true,
        stdout: "Line 1\nLine 2\nLine 3",
        stderr: "",
        execution_id: "bash",
        files_created: [],
        files_modified: [],
        duration: 0,
        code_hash: "",
      });

      const executeBash = createExecuteBashTool(mockSandbox);
      const result = await executeBash.invoke({
        command: "cat file.txt",
      });

      expect(result).not.toContain("ERROR");
      expect(result).toContain("Line 1");
      expect(result).toContain("Line 2");
    });

    it("should execute head command", async () => {
      const mockSandbox = createMockSandbox();
      vi.mocked(mockSandbox.executeBash).mockResolvedValue({
        success: true,
        stdout: "Line 1\nLine 2\nLine 3\nLine 4\nLine 5",
        stderr: "",
        execution_id: "bash",
        files_created: [],
        files_modified: [],
        duration: 0,
        code_hash: "",
      });

      const executeBash = createExecuteBashTool(mockSandbox);
      const result = await executeBash.invoke({
        command: "head -5 file.txt",
      });

      expect(result).not.toContain("ERROR");
      expect(result).toContain("Line 1");
    });

    it("should execute awk command", async () => {
      const mockSandbox = createMockSandbox();
      vi.mocked(mockSandbox.executeBash).mockResolvedValue({
        success: true,
        stdout: "value1\nvalue2\nvalue3",
        stderr: "",
        execution_id: "bash",
        files_created: [],
        files_modified: [],
        duration: 0,
        code_hash: "",
      });

      const executeBash = createExecuteBashTool(mockSandbox);
      const result = await executeBash.invoke({
        command: "awk '{print $2}' data.txt",
      });

      expect(result).not.toContain("ERROR");
      expect(result).toContain("value1");
    });
  });

  describe("stderr handling", () => {
    it("should include stderr in output when command succeeds", async () => {
      const mockSandbox = createMockSandbox();
      vi.mocked(mockSandbox.executeBash).mockResolvedValue({
        success: true,
        stdout: "output",
        stderr: "warning: some warning",
        execution_id: "bash",
        files_created: [],
        files_modified: [],
        duration: 0,
        code_hash: "",
      });

      const executeBash = createExecuteBashTool(mockSandbox);
      const result = await executeBash.invoke({
        command: "some_command",
      });

      expect(result).toContain("output");
      expect(result).toContain("warning: some warning");
    });
  });
});
