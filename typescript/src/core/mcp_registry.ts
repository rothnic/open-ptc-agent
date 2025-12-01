/**
 * MCP Registry - Manages MCP tool registration and discovery.
 */

/**
 * MCP Tool definition.
 */
export interface MCPTool {
  /** Tool name */
  name: string;

  /** Tool description */
  description: string;

  /** Input schema for the tool */
  inputSchema: Record<string, unknown>;

  /** Server this tool belongs to */
  serverName: string;
}

/**
 * MCP Server configuration.
 */
export interface MCPServerConfig {
  /** Server name */
  name: string;

  /** Whether the server is enabled */
  enabled: boolean;

  /** Transport type (stdio, http, etc.) */
  transport: "stdio" | "http";

  /** Command to run for stdio transport */
  command?: string;

  /** Arguments for the command */
  args?: string[];

  /** Environment variables */
  env?: Record<string, string>;

  /** URL for HTTP transport */
  url?: string;
}

/**
 * MCP Registry for managing MCP servers and tools.
 */
export class MCPRegistry {
  private servers: Map<string, MCPServerConfig> = new Map();
  private tools: Map<string, MCPTool[]> = new Map();

  /**
   * Register an MCP server.
   *
   * @param config - Server configuration
   */
  registerServer(config: MCPServerConfig): void {
    this.servers.set(config.name, config);
    this.tools.set(config.name, []);
  }

  /**
   * Register a tool for a server.
   *
   * @param serverName - Name of the server
   * @param tool - Tool definition
   */
  registerTool(serverName: string, tool: Omit<MCPTool, "serverName">): void {
    const serverTools = this.tools.get(serverName) || [];
    serverTools.push({ ...tool, serverName });
    this.tools.set(serverName, serverTools);
  }

  /**
   * Get all tools for a server.
   *
   * @param serverName - Name of the server
   * @returns Array of tools or empty array
   */
  getServerTools(serverName: string): MCPTool[] {
    return this.tools.get(serverName) || [];
  }

  /**
   * Get all registered tools grouped by server.
   *
   * @returns Map of server name to tools
   */
  getAllTools(): Map<string, MCPTool[]> {
    return new Map(this.tools);
  }

  /**
   * Get all enabled servers.
   *
   * @returns Array of enabled server configs
   */
  getEnabledServers(): MCPServerConfig[] {
    return Array.from(this.servers.values()).filter((s) => s.enabled);
  }

  /**
   * Check if a server is registered and enabled.
   *
   * @param serverName - Name of the server
   * @returns True if server is registered and enabled
   */
  isServerEnabled(serverName: string): boolean {
    const server = this.servers.get(serverName);
    return server?.enabled ?? false;
  }
}

// Singleton instance for convenience
let defaultRegistry: MCPRegistry | null = null;

/**
 * Get the default MCP registry instance.
 *
 * @returns MCPRegistry instance
 */
export function getMCPRegistry(): MCPRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new MCPRegistry();
  }
  return defaultRegistry;
}

/**
 * Reset the default MCP registry (useful for testing).
 */
export function resetMCPRegistry(): void {
  defaultRegistry = null;
}
