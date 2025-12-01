/**
 * Test utilities for PTC Agent tests.
 */

import type { FileData } from "../src/backends/protocol.js";

/**
 * Create mock file data for testing.
 */
export function createMockFileData(content: string): FileData {
  return {
    content: content.split("\n"),
    created_at: new Date().toISOString(),
    modified_at: new Date().toISOString(),
  };
}

/**
 * Create mock files record for testing.
 */
export function createMockFiles(
  files: Record<string, string>
): Record<string, FileData> {
  const result: Record<string, FileData> = {};
  for (const [path, content] of Object.entries(files)) {
    result[path] = createMockFileData(content);
  }
  return result;
}

/**
 * Mock state and store for testing backends.
 */
export function createMockStateAndStore(files: Record<string, FileData> = {}) {
  return {
    state: { files },
    store: undefined,
  };
}
