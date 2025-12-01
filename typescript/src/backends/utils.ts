/**
 * Utility functions for backend operations.
 *
 * Provides common functionality used across different backend implementations.
 */

import micromatch from "micromatch";
import type { FileData, FileInfo, GrepMatch } from "./protocol.js";

/**
 * Create new FileData with current timestamps.
 *
 * @param content - File content as string
 * @returns FileData with content split into lines and timestamps set
 */
export function createFileData(content: string): FileData {
  const now = new Date().toISOString();
  return {
    content: content.split("\n"),
    created_at: now,
    modified_at: now,
  };
}

/**
 * Update FileData with new content and modified timestamp.
 *
 * @param fileData - Existing FileData
 * @param content - New content as string
 * @returns Updated FileData with new content and modified timestamp
 */
export function updateFileData(fileData: FileData, content: string): FileData {
  return {
    content: content.split("\n"),
    created_at: fileData.created_at,
    modified_at: new Date().toISOString(),
  };
}

/**
 * Convert FileData to string content.
 *
 * @param fileData - FileData to convert
 * @returns String content joined by newlines
 */
export function fileDataToString(fileData: FileData): string {
  return fileData.content.join("\n");
}

/**
 * Format file content with line numbers for read operations.
 *
 * @param fileData - FileData to format
 * @param offset - Line offset to start from (0-indexed)
 * @param limit - Maximum number of lines to include
 * @returns Formatted string with line numbers
 */
export function formatReadResponse(
  fileData: FileData,
  offset: number = 0,
  limit: number = 2000
): string {
  const lines = fileData.content;
  const selectedLines = lines.slice(offset, offset + limit);

  const formatted = selectedLines
    .map((line, idx) => {
      const lineNum = offset + idx + 1;
      return `${lineNum}. ${line}`;
    })
    .join("\n");

  // Add info about remaining lines if truncated
  if (offset + limit < lines.length) {
    const remaining = lines.length - (offset + limit);
    return `${formatted}\n\n... (${remaining} more lines)`;
  }

  return formatted;
}

/**
 * Perform string replacement in content.
 *
 * @param content - Original content
 * @param oldString - String to find
 * @param newString - Replacement string
 * @param replaceAll - Whether to replace all occurrences
 * @returns Tuple of [newContent, occurrences] or error string
 */
export function performStringReplacement(
  content: string,
  oldString: string,
  newString: string,
  replaceAll: boolean = false
): [string, number] | string {
  // Count occurrences
  let occurrences = 0;
  let searchStart = 0;
  while (true) {
    const idx = content.indexOf(oldString, searchStart);
    if (idx === -1) break;
    occurrences++;
    searchStart = idx + oldString.length;
  }

  if (occurrences === 0) {
    return `Error: String '${oldString}' not found in file`;
  }

  if (occurrences > 1 && !replaceAll) {
    return `Error: Found ${occurrences} occurrences of '${oldString}'. Set replace_all=true to replace all, or provide more context to match exactly one.`;
  }

  // Perform replacement
  const newContent = replaceAll
    ? content.split(oldString).join(newString)
    : content.replace(oldString, newString);

  return [newContent, replaceAll ? occurrences : 1];
}

/**
 * Search files for grep matches.
 *
 * @param files - Record of file paths to FileData
 * @param pattern - Regex pattern to search for
 * @param basePath - Base path to search from
 * @param globPattern - Optional glob pattern to filter files
 * @returns Array of GrepMatch objects or error string for invalid regex
 */
export function grepMatchesFromFiles(
  files: Record<string, FileData>,
  pattern: string,
  basePath: string = "/",
  globPattern: string | null = null
): GrepMatch[] | string {
  // Validate regex
  let regex: RegExp;
  try {
    regex = new RegExp(pattern);
  } catch (e) {
    return `Error: Invalid regex pattern '${pattern}': ${e}`;
  }

  const matches: GrepMatch[] = [];
  const normalizedBasePath = basePath.endsWith("/") ? basePath : basePath + "/";

  for (const [filePath, fileData] of Object.entries(files)) {
    // Filter by base path
    if (!filePath.startsWith(normalizedBasePath) && filePath !== basePath) {
      continue;
    }

    // Filter by glob pattern if provided
    if (globPattern) {
      const relativePath = filePath.startsWith(normalizedBasePath)
        ? filePath.substring(normalizedBasePath.length)
        : filePath;
      if (!micromatch.isMatch(relativePath, globPattern)) {
        continue;
      }
    }

    // Search content
    fileData.content.forEach((line, idx) => {
      if (regex.test(line)) {
        matches.push({
          path: filePath,
          line: idx + 1,
          text: line,
        });
      }
    });
  }

  return matches;
}

/**
 * Search files using glob pattern.
 *
 * @param files - Record of file paths to FileData
 * @param pattern - Glob pattern
 * @param basePath - Base path to search from
 * @returns Newline-separated list of matching paths, or "No files found"
 */
export function globSearchFiles(
  files: Record<string, FileData>,
  pattern: string,
  basePath: string = "/"
): string {
  const normalizedBasePath = basePath.endsWith("/") ? basePath : basePath + "/";
  const matches: string[] = [];

  for (const filePath of Object.keys(files)) {
    // Filter by base path
    if (!filePath.startsWith(normalizedBasePath) && filePath !== basePath) {
      continue;
    }

    // Get relative path for matching
    const relativePath = filePath.startsWith(normalizedBasePath)
      ? filePath.substring(normalizedBasePath.length)
      : filePath;

    if (micromatch.isMatch(relativePath, pattern)) {
      matches.push(filePath);
    }
  }

  if (matches.length === 0) {
    return "No files found";
  }

  return matches.sort().join("\n");
}

/**
 * Sanitize a tool call ID for use as a file path component.
 * Replaces any characters except alphanumeric, underscore, and hyphen with underscores.
 *
 * @param toolCallId - Original tool call ID
 * @returns Sanitized string safe for file paths
 */
export function sanitizeToolCallId(toolCallId: string): string {
  // Replace any characters except alphanumeric, underscore, and hyphen with underscores
  return toolCallId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

/**
 * Convert FileInfo array to ls-style output string.
 *
 * @param infos - Array of FileInfo objects
 * @returns Formatted string listing files and directories
 */
export function formatLsOutput(infos: FileInfo[]): string {
  if (infos.length === 0) {
    return "No files found";
  }

  return infos
    .map((info) => {
      if (info.is_dir) {
        return `${info.path} (directory)`;
      }
      const size = info.size !== undefined ? ` (${info.size} bytes)` : "";
      return `${info.path}${size}`;
    })
    .join("\n");
}

/**
 * Parse a file path to extract directory and filename.
 *
 * @param filePath - Full file path
 * @returns Object with directory and filename
 */
export function parseFilePath(filePath: string): {
  directory: string;
  filename: string;
} {
  const lastSlash = filePath.lastIndexOf("/");
  if (lastSlash === -1) {
    return { directory: "/", filename: filePath };
  }
  return {
    directory: filePath.substring(0, lastSlash) || "/",
    filename: filePath.substring(lastSlash + 1),
  };
}
