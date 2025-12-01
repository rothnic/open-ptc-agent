/**
 * Tickertick MCP Server - TypeScript equivalent
 *
 * Provides tools to fetch ticker news, curated news, and entity news from Tickertick API.
 * This is a reference implementation that mirrors the Python tickertick_mcp_server.py.
 */

import type { MCPTool } from "../src/core/mcp_registry.js";

/**
 * Define the Tickertick MCP tools.
 *
 * These match the Python implementation's tool definitions.
 */
export const tickertickTools: Omit<MCPTool, "serverName">[] = [
  {
    name: "get_ticker_news",
    description: `Get news for a specific ticker symbol.`,
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: "The ticker symbol (e.g., AAPL, MSFT, TSLA)",
        },
        limit: {
          type: "number",
          description: "Maximum number of news items to return (default: 10, max: 50)",
          default: 10,
        },
      },
      required: ["ticker"],
    },
  },
  {
    name: "get_broad_ticker_news",
    description: `Get broader news for a specific ticker symbol.
This includes mentions and related news beyond direct ticker matches.`,
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: "The ticker symbol (e.g., AAPL, MSFT, TSLA)",
        },
        limit: {
          type: "number",
          description: "Maximum number of news items to return (default: 10, max: 50)",
          default: 10,
        },
      },
      required: ["ticker"],
    },
  },
  {
    name: "get_news_from_source",
    description: `Get news from a specific source.`,
    inputSchema: {
      type: "object",
      properties: {
        source: {
          type: "string",
          description: "The news source (e.g., bloomberg, wsj, cnbc, reuters)",
        },
        limit: {
          type: "number",
          description: "Maximum number of news items to return (default: 10, max: 50)",
          default: 10,
        },
      },
      required: ["source"],
    },
  },
  {
    name: "get_news_for_multiple_tickers",
    description: `Get news for multiple ticker symbols.`,
    inputSchema: {
      type: "object",
      properties: {
        tickers: {
          type: "array",
          items: { type: "string" },
          description: 'List of ticker symbols (e.g., ["AAPL", "MSFT", "TSLA"])',
        },
        limit: {
          type: "number",
          description: "Maximum number of news items to return (default: 10, max: 50)",
          default: 10,
        },
      },
      required: ["tickers"],
    },
  },
  {
    name: "get_curated_news",
    description: `Get curated news from top financial/technology sources.
This is helpful to get a broad overview of the market.`,
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of news items to return (default: 10, max: 50)",
          default: 10,
        },
      },
      required: [],
    },
  },
  {
    name: "get_entity_news",
    description: `Get news about a specific entity (person, company, etc.)`,
    inputSchema: {
      type: "object",
      properties: {
        entity: {
          type: "string",
          description: 'The entity name (e.g., "Elon Musk", "Trump", "Warren Buffett")',
        },
        limit: {
          type: "number",
          description: "Maximum number of news items to return (default: 10, max: 50)",
          default: 10,
        },
      },
      required: ["entity"],
    },
  },
  {
    name: "search_tickers",
    description: `Search for tickers matching the query.`,
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: 'The search query (e.g., "Apple", "TSLA", "Microsoft")',
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 5, max: 20)",
          default: 5,
        },
      },
      required: ["query"],
    },
  },
];

/**
 * Get the Tickertick MCP server configuration.
 */
export function getTickertickMCPConfig() {
  return {
    name: "tickertick",
    description: "Tickertick MCP server for financial news",
    tools: tickertickTools,
  };
}
