/**
 * Security utilities for PTC sandbox.
 */

/**
 * Security configuration.
 */
export interface SecurityConfig {
  /** Maximum execution time in seconds */
  maxExecutionTime: number;

  /** Allowed file extensions */
  allowedExtensions: string[];

  /** Blocked commands */
  blockedCommands: string[];

  /** Enable path validation */
  enablePathValidation: boolean;
}

/**
 * Default security configuration.
 */
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxExecutionTime: 120,
  allowedExtensions: [
    ".py",
    ".js",
    ".ts",
    ".json",
    ".yaml",
    ".yml",
    ".md",
    ".txt",
    ".csv",
    ".html",
    ".css",
  ],
  blockedCommands: [
    "rm -rf /",
    "sudo",
    "chmod 777",
    "curl | bash",
    "wget | bash",
  ],
  enablePathValidation: true,
};

/**
 * Validate a command against security rules.
 *
 * @param command - Command to validate
 * @param config - Security configuration
 * @returns True if command is allowed, false otherwise
 */
export function validateCommand(
  command: string,
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): boolean {
  const normalizedCommand = command.toLowerCase().trim();

  for (const blocked of config.blockedCommands) {
    if (normalizedCommand.includes(blocked.toLowerCase())) {
      return false;
    }
  }

  return true;
}

/**
 * Validate a file path against security rules.
 *
 * @param filePath - Path to validate
 * @param allowedDirectories - List of allowed directories
 * @param workingDirectory - Working directory
 * @returns True if path is allowed, false otherwise
 */
export function validatePath(
  filePath: string,
  allowedDirectories: string[] = ["/home/daytona"],
  workingDirectory: string = "/home/daytona"
): boolean {
  // Normalize the path
  let normalizedPath = filePath;

  // Handle relative paths
  if (!normalizedPath.startsWith("/")) {
    normalizedPath = `${workingDirectory}/${normalizedPath}`;
  }

  // Resolve . and ..
  const parts = normalizedPath.split("/").filter(Boolean);
  const resolved: string[] = [];

  for (const part of parts) {
    if (part === "..") {
      resolved.pop();
    } else if (part !== ".") {
      resolved.push(part);
    }
  }

  const resolvedPath = "/" + resolved.join("/");

  // Check against allowed directories
  for (const allowedDir of allowedDirectories) {
    if (resolvedPath === allowedDir || resolvedPath.startsWith(allowedDir + "/")) {
      return true;
    }
  }

  return false;
}

/**
 * Sanitize user input for safe execution.
 *
 * @param input - User input to sanitize
 * @returns Sanitized input
 */
export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[`$]/g, "")
    .replace(/\r\n/g, "\n")
    .trim();
}
