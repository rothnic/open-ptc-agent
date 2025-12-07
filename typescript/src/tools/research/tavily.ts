/**
 * Tavily search tool for web research.
 *
 * Uses Tavily for URL discovery and fetches full webpage content.
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Create the Tavily search tool.
 *
 * @param options - Optional configuration
 * @returns Configured tavily_search tool
 */
export function createTavilySearchTool(options: {
  /** Tavily API key (defaults to TAVILY_API_KEY env var) */
  apiKey?: string;
  /** Maximum results per search */
  defaultMaxResults?: number;
} = {}) {
  const { defaultMaxResults = 3 } = options;

  return tool(
    async ({ query, maxResults = defaultMaxResults, topic = "general" }) => {
      try {
        // Get API key from options or environment
        const apiKey = options.apiKey || process.env.TAVILY_API_KEY;
        if (!apiKey) {
          return "ERROR: TAVILY_API_KEY environment variable is not set";
        }

        // Call Tavily API
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: apiKey,
            query,
            max_results: maxResults,
            search_depth: "advanced",
            topic,
          }),
        });

        if (!response.ok) {
          return `ERROR: Tavily API request failed with status ${response.status}`;
        }

        const data = await response.json();
        const results = data.results || [];

        if (results.length === 0) {
          return `No results found for query: "${query}"`;
        }

        // Format results
        const formattedResults = results.map((result: {
          title: string;
          url: string;
          content: string;
        }) => {
          return `## ${result.title}
**URL:** ${result.url}

${result.content}

---`;
        });

        return `Found ${results.length} result(s) for '${query}':\n\n${formattedResults.join("\n\n")}`;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        return `ERROR: Failed to search: ${errorMsg}`;
      }
    },
    {
      name: "tavily_search",
      description: `Search the web for information on a given query.

Uses Tavily to discover relevant URLs and returns search results with content snippets.

Use this tool when you need to:
- Find current information about a topic
- Research recent news or events
- Discover sources for verification
- Gather data from multiple web sources`,
      schema: z.object({
        query: z.string().describe("Search query to execute"),
        maxResults: z
          .number()
          .optional()
          .describe("Maximum number of results to return (default: 3)"),
        topic: z
          .enum(["general", "news", "finance"])
          .optional()
          .describe("Topic filter - 'general', 'news', or 'finance' (default: 'general')"),
      }),
    }
  );
}

export type TavilySearchTool = ReturnType<typeof createTavilySearchTool>;
