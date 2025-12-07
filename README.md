# Open PTC Agent (TypeScript)

[English](README.md) | [中文](README_zh.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js 22+](https://img.shields.io/badge/Node.js-22+-green.svg)](https://nodejs.org/)
[![GitHub stars](https://img.shields.io/github/stars/rothnic/open-ptc-agent?style=social)](https://github.com/rothnic/open-ptc-agent/stargazers)

[Getting Started](#getting-started) | [Configuration](#configuration) | [Project Structure](#project-structure) | [API Reference](#api-reference)

## Overview

This is the **TypeScript/LangChainJS** implementation of the PTC Agent, built on [deepagentsjs](https://github.com/langchain-ai/deepagentsjs).

> **Looking for the Python implementation?**
> See the upstream repository: [Chen-zexi/open-ptc-agent](https://github.com/Chen-zexi/open-ptc-agent)

## What is Programmatic Tool Calling?

This project is an open source implementation of Anthropic's [Programmatic Tool Calling (PTC)](https://www.anthropic.com/engineering/advanced-tool-use), which enables agents to invoke tools with code execution rather than making individual JSON tool calls.

### Why PTC?

1. **LLMs excel at code** - They write code that orchestrates entire workflows rather than reasoning through one tool call at a time.

2. **Massive token reduction** - Traditional tool calling returns full results to the context window. With PTC, code runs in a sandbox, processes data locally, and only the final output returns to the model. Result: 85-98% token reduction.

3. **Better for structured data** - PTC shines when working with large volumes of structured data, time series data, and scenarios requiring filtering, aggregating, transforming, or visualizing results.

## Features

- **deepagentsjs Integration** - Built on LangChain's deepagentsjs framework
- **Multiple Backends** - StateBackend (in-memory) and DaytonaBackend (sandbox)
- **Progressive Tool Discovery** - Tools discovered on-demand for token efficiency
- **Model Tiers** - Configurable small/medium/large model selection
- **Subagent Support** - Research and general-purpose subagents
- **MCP Integration** - Yahoo Finance, Tickertick, and custom MCP servers
- **Cloud Storage** - S3 and R2 integration for file uploads

## Project Structure

```
├── shared/                        # Shared resources (language-agnostic)
│   ├── config/                    # Shared configuration
│   │   └── defaults.yaml          # Default model and agent settings
│   └── prompts/                   # Shared prompt templates
│       ├── components/            # Reusable prompt components
│       └── subagents/             # Subagent-specific prompts
│
├── typescript/                    # TypeScript implementation
│   ├── src/
│   │   ├── agent.ts               # PTCAgent implementation
│   │   ├── backends/              # Backend implementations
│   │   │   ├── daytona.ts         # DaytonaBackend
│   │   │   ├── state.ts           # StateBackend (in-memory)
│   │   │   └── protocol.ts        # Backend protocol definitions
│   │   ├── config/                # Configuration management
│   │   │   └── env.ts             # Environment variable config
│   │   ├── core/                  # Core utilities
│   │   │   ├── mcp_registry.ts    # MCP server registry
│   │   │   └── security.ts        # Security utilities
│   │   ├── middleware/            # Middleware components
│   │   │   ├── fs.ts              # Filesystem middleware
│   │   │   └── subagents.ts       # Subagent middleware
│   │   ├── prompts/               # Prompt templates
│   │   │   └── templates.ts       # Prompt components
│   │   ├── subagents/             # Subagent configurations
│   │   │   ├── general.ts         # General-purpose subagent
│   │   │   └── research.ts        # Research subagent
│   │   ├── tools/                 # Native tool implementations
│   │   │   ├── bash/              # Shell command execution
│   │   │   ├── code_execution/    # Python code execution
│   │   │   ├── filesystem/        # File operations
│   │   │   ├── research/          # Tavily search, think tool
│   │   │   └── search/            # Glob, grep tools
│   │   └── utils/                 # Utility modules
│   │       └── storage/           # Cloud storage (S3, R2)
│   │
│   ├── mcp_servers/               # MCP server definitions
│   │   ├── yfinance.ts            # Yahoo Finance tools
│   │   └── tickertick.ts          # Tickertick news tools
│   │
│   ├── tests/                     # Test suite
│   ├── package.json
│   └── tsconfig.json
│
├── package.json                   # Root monorepo package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm or npm

### Installation

```bash
git clone https://github.com/rothnic/open-ptc-agent.git
cd open-ptc-agent
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

## Configuration

### Environment Variables

Create a `.env` file in the `typescript/` directory:

```bash
# Required: One LLM provider
ANTHROPIC_API_KEY=your-key
# or
OPENAI_API_KEY=your-key

# Required for DaytonaBackend
DAYTONA_API_KEY=your-key

# Optional: MCP Servers
TAVILY_API_KEY=your-key

# Optional: Cloud Storage
R2_ACCESS_KEY_ID=...
AWS_ACCESS_KEY_ID=...
```

### Model Tiers

Configure model tiers via environment variables:

```bash
# Model tiers (small/medium/large)
PTC_MODEL_SMALL=gpt-4o-mini           # For simple, fast tasks
PTC_MODEL_MEDIUM=claude-sonnet-4-5-20250929   # For general use (default)
PTC_MODEL_LARGE=claude-opus-4-5-20250929       # For complex reasoning

# Default model (used when none specified)
PTC_DEFAULT_MODEL=claude-sonnet-4-5-20250929

# Subagent-specific overrides
PTC_RESEARCH_MODEL=claude-sonnet-4-5-20250929
PTC_GENERAL_PURPOSE_MODEL=claude-sonnet-4-5-20250929
```

### Shared Configuration

The `shared/` directory contains language-agnostic configuration:

- **shared/config/defaults.yaml** - Default model and agent settings
- **shared/prompts/** - Prompt templates shared with the Python implementation

## API Reference

### Creating an Agent

```typescript
import { createPTCAgent, DaytonaBackend } from "@open-ptc-agent/typescript";

const agent = createPTCAgent({
  model: "large", // or "medium", "small", or specific model name
  backend: new DaytonaBackend(sandbox),
  tools: [executeCodeTool],
});

await agent.invoke({ 
  messages: [{ role: "user", content: "Analyze AAPL stock" }] 
});
```

### Using StateBackend (In-Memory)

```typescript
import { StateBackend } from "@open-ptc-agent/typescript";

const backend = new StateBackend(stateAndStore);
const content = backend.read("/path/to/file.txt");
const files = backend.globInfo("*.ts", "/src");
const matches = backend.grepRaw("function", "/src");
```

### Using DaytonaBackend (Sandbox)

```typescript
import { DaytonaBackend } from "@open-ptc-agent/typescript";

const backend = new DaytonaBackend(sandbox);
const content = await backend.read("/path/to/file.txt");
const files = await backend.globInfo("*.py", "/code");
const matches = await backend.grepRaw("def ", "/code");
```

## Native Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| **executeCode** | Execute Python with MCP tool access | `code` |
| **bash** | Run shell commands | `command`, `timeout`, `workingDir` |
| **read** | Read file with line numbers | `filePath`, `offset`, `limit` |
| **write** | Write/overwrite file | `filePath`, `content` |
| **edit** | Exact string replacement | `filePath`, `oldString`, `newString` |
| **glob** | File pattern matching | `pattern`, `path` |
| **grep** | Content search | `pattern`, `path`, `outputMode` |

## Subagents

Available subagents:

- **research** - Web search with Tavily + think tool for strategic reflection
- **general-purpose** - Full execute_code, filesystem, and vision tools

## MCP Servers

Built-in MCP server definitions:

| Server | Description | Tools |
|--------|-------------|-------|
| **yfinance** | Yahoo Finance data | Stock prices, financials |
| **tickertick** | Financial news | News articles, headlines |

## Related Projects

- **Python Implementation**: [Chen-zexi/open-ptc-agent](https://github.com/Chen-zexi/open-ptc-agent)
- **deepagentsjs**: [langchain-ai/deepagentsjs](https://github.com/langchain-ai/deepagentsjs)
- **LangChain**: [langchain-ai/langchainjs](https://github.com/langchain-ai/langchainjs)

## Acknowledgements

This project builds on:

**Research/Articles**
- [Introducing advanced tool use on the Claude Developer Platform](https://www.anthropic.com/engineering/advanced-tool-use) - Anthropic
- [Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp) - Anthropic

**Frameworks**
- [LangChain DeepAgentsJS](https://github.com/langchain-ai/deepagentsjs)
- [Daytona](https://www.daytona.io/) - Sandbox infrastructure

## License

MIT License
