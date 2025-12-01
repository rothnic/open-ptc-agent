/**
 * Yahoo Finance MCP Server - TypeScript equivalent
 *
 * Provides tools to fetch stock prices, financial statements, options, and company data.
 * This is a reference implementation that mirrors the Python yfinance_mcp_server.py.
 *
 * Note: This is a placeholder that demonstrates the structure.
 * For actual yfinance functionality, you would need to use a TypeScript
 * finance library or make API calls to a yfinance service.
 */

import type { MCPTool } from "../src/core/mcp_registry.js";

/**
 * Define the Yahoo Finance MCP tools.
 *
 * These match the Python implementation's tool definitions.
 */
export const yfinanceTools: Omit<MCPTool, "serverName">[] = [
  {
    name: "get_stock_history",
    description: `Get historical OHLCV (Open, High, Low, Close, Volume) data for a stock.

HIGH PTC VALUE: Returns 252 rows per year of daily data - ideal for calculating
returns, volatility, moving averages, and technical indicators in code.`,
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: 'Stock ticker symbol (e.g., "AAPL", "MSFT", "TSLA")',
        },
        period: {
          type: "string",
          description:
            "Data period - 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max",
          default: "1y",
        },
        interval: {
          type: "string",
          description:
            "Data interval - 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo",
          default: "1d",
        },
      },
      required: ["ticker"],
    },
  },
  {
    name: "get_income_statement",
    description: `Get income statement data (revenue, expenses, net income, etc.)

HIGH PTC VALUE: Returns 4 quarters (or 4 years) of 30+ financial line items.
Ideal for calculating profit margins, revenue growth, and profitability trends.`,
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: 'Stock ticker symbol (e.g., "AAPL", "MSFT")',
        },
        quarterly: {
          type: "boolean",
          description: "If true, returns quarterly data; if false, returns annual data",
          default: true,
        },
      },
      required: ["ticker"],
    },
  },
  {
    name: "get_balance_sheet",
    description: `Get balance sheet data (assets, liabilities, equity).

HIGH PTC VALUE: Returns 4 quarters (or 4 years) of asset/liability data.
Ideal for calculating debt ratios, current ratio, book value, and solvency metrics.`,
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: 'Stock ticker symbol (e.g., "AAPL", "MSFT")',
        },
        quarterly: {
          type: "boolean",
          description: "If true, returns quarterly data; if false, returns annual data",
          default: true,
        },
      },
      required: ["ticker"],
    },
  },
  {
    name: "get_cash_flow",
    description: `Get cash flow statement data (operating, investing, financing activities).

HIGH PTC VALUE: Returns 4 quarters (or 4 years) of cash flow data.
Ideal for calculating free cash flow, cash conversion, and capital allocation.`,
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: 'Stock ticker symbol (e.g., "AAPL", "MSFT")',
        },
        quarterly: {
          type: "boolean",
          description: "If true, returns quarterly data; if false, returns annual data",
          default: true,
        },
      },
      required: ["ticker"],
    },
  },
  {
    name: "get_options_chain",
    description: `Get options chain (calls and puts) for a stock.

VERY HIGH PTC VALUE: Returns 100-300 option contracts per expiration.
Ideal for filtering by strike, calculating Greeks, finding opportunities,
and analyzing implied volatility surface.`,
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: 'Stock ticker symbol (e.g., "AAPL", "MSFT")',
        },
        expiration: {
          type: "string",
          description: "Option expiration date (YYYY-MM-DD). If not specified, uses nearest expiration.",
        },
      },
      required: ["ticker"],
    },
  },
  {
    name: "get_company_info",
    description: `Get comprehensive company information (sector, industry, market cap, ratios, etc.)

MEDIUM PTC VALUE: Returns 100+ fields of company metadata.
Useful for screening, sector analysis, and fundamental overview.`,
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: 'Stock ticker symbol (e.g., "AAPL", "MSFT")',
        },
      },
      required: ["ticker"],
    },
  },
  {
    name: "get_multiple_stocks_history",
    description: `Get historical data for multiple stocks in a single call.

VERY HIGH PTC VALUE: Returns N × 252 rows per year for N stocks.
Ideal for portfolio analysis, correlation studies, and comparative performance.`,
    inputSchema: {
      type: "object",
      properties: {
        tickers: {
          type: "array",
          items: { type: "string" },
          description: 'List of ticker symbols (e.g., ["AAPL", "MSFT", "GOOGL"])',
        },
        period: {
          type: "string",
          description: "Data period - 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max",
          default: "1y",
        },
        interval: {
          type: "string",
          description: "Data interval - 1d, 5d, 1wk, 1mo, 3mo",
          default: "1d",
        },
      },
      required: ["tickers"],
    },
  },
  {
    name: "compare_valuations",
    description: `Compare valuation metrics (P/E, P/B, dividend yield, etc.) across multiple stocks.

VERY HIGH PTC VALUE: Returns valuation multiples for N stocks.
Ideal for relative valuation analysis, value screening, and peer comparison.`,
    inputSchema: {
      type: "object",
      properties: {
        tickers: {
          type: "array",
          items: { type: "string" },
          description: 'List of ticker symbols (e.g., ["AAPL", "MSFT", "GOOGL"])',
        },
      },
      required: ["tickers"],
    },
  },
];

/**
 * Get the Yahoo Finance MCP server configuration.
 */
export function getYahooFinanceMCPConfig() {
  return {
    name: "yfinance",
    description: "Yahoo Finance MCP server for financial data",
    tools: yfinanceTools,
  };
}
