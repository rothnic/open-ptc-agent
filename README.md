# Open PTC Agent (TypeScript)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js 22+](https://img.shields.io/badge/Node.js-22+-green.svg)](https://nodejs.org/)
[![deepagentsjs](https://img.shields.io/badge/deepagentsjs-latest-purple.svg)](https://github.com/langchain-ai/deepagentsjs)

[Getting Started](#getting-started) | [Configuration](#configuration) | [Project Structure](#project-structure) | [API Reference](#api-reference) | [Differences from Python](#differences-from-python-implementation)

---

## Overview

This is the **TypeScript/LangChainJS** implementation of the PTC Agent, built on [deepagentsjs](https://github.com/langchain-ai/deepagentsjs).

> **📌 Looking for the Python implementation?**
> See the upstream repository: **[Chen-zexi/open-ptc-agent](https://github.com/Chen-zexi/open-ptc-agent)**

---

## What is Programmatic Tool Calling?

This project is an open source implementation of Anthropic's [Programmatic Tool Calling (PTC)](https://www.anthropic.com/engineering/advanced-tool-use), which enables agents to invoke tools with code execution rather than making individual JSON tool calls. This paradigm is also featured in their earlier engineering blog [Code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp).

### Why PTC?

| Benefit | Description |
|---------|-------------|
| **LLMs excel at code** | They write code that orchestrates entire workflows rather than reasoning through one tool call at a time |
| **Massive token reduction** | Traditional tool calling returns full results to the context window. With PTC, code runs in a sandbox, processes data locally, and only the final output returns to the model. Result: **85-98% token reduction** |
| **Better for structured data** | PTC shines when working with large volumes of structured data, time series data, and scenarios requiring filtering, aggregating, transforming, or visualizing results |

### How It Works

```
User Task
    │
    ▼
┌───────────────────┐
│   PTCAgent        │  Tool discovery → Writes Python code
└───────────────────┘
    │       ▲
    ▼       │
┌───────────────────┐
│  Daytona Sandbox  │  Executes code
│  ┌─────────────┐  │
│  │ MCP Tools   │  │  tool() → process/filter/aggregate → dump to data/
│  │ (Python)    │  │
│  └─────────────┘  │
└───────────────────┘
    │
    ▼
┌───────────────────┐
│ Final deliverables│  Files and data can be downloaded from sandbox
└───────────────────┘
```

---

## Features

| Feature | Description |
|---------|-------------|
| **deepagentsjs Integration** | Built on [LangChain's deepagentsjs](https://github.com/langchain-ai/deepagentsjs) framework |
| **Multiple Backends** | StateBackend (in-memory) and DaytonaBackend (sandbox) |
| **Progressive Tool Discovery** | Tools discovered on-demand for token efficiency |
| **Model Tiers** | Configurable small/medium/large model selection |
| **Subagent Support** | Research and general-purpose subagents |
| **MCP Integration** | Yahoo Finance, Tickertick, and custom MCP servers |
| **Cloud Storage** | S3 and R2 integration for file uploads |

---

## Related Documentation

### Core Libraries

| Library | Documentation | Description |
|---------|---------------|-------------|
| **deepagentsjs** | [GitHub](https://github.com/langchain-ai/deepagentsjs) | LangChain's TypeScript deep agent framework |
| **LangChain.js** | [Docs](https://js.langchain.com/docs/) | JavaScript/TypeScript LLM framework |
| **LangGraph.js** | [Docs](https://langchain-ai.github.io/langgraphjs/) | Framework for building stateful agents |

### Upstream Project

| Resource | Link |
|----------|------|
| **Python Implementation** | [Chen-zexi/open-ptc-agent](https://github.com/Chen-zexi/open-ptc-agent) |
| **Python deep-agent** | [langchain-ai/deepagents](https://github.com/langchain-ai/deepagents) |
| **Configuration Guide** | [Python docs/CONFIGURATION.md](https://github.com/Chen-zexi/open-ptc-agent/blob/main/docs/CONFIGURATION.md) |

### Research & Background

- [Introducing advanced tool use on the Claude Developer Platform](https://www.anthropic.com/engineering/advanced-tool-use) - Anthropic
- [Code execution with MCP: building more efficient AI agents](https://www.anthropic.com/engineering/code-execution-with-mcp) - Anthropic
- [CodeAct: Executable Code Actions Elicit Better LLM Agents](https://arxiv.org/abs/2402.01030) - Wang et al.

---

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
│   ├── tests/                     # Test suite (145+ tests)
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                          # Documentation
│   └── CONFIGURATION.md           # Configuration guide
│
├── package.json                   # Root monorepo package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- npm or pnpm
- [Daytona API Key](https://app.daytona.io/dashboard/keys) (for sandbox execution)

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

---

## Configuration

### Environment Variables

Create a `.env` file in the `typescript/` directory (see `.env.example` for all options):

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
- **shared/prompts/** - Prompt templates that can be shared across implementations

---

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

---

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

---

## Middleware (via deepagentsjs)

| Middleware | Description | Tools Provided |
|------------|-------------|----------------|
| **SubagentsMiddleware** | Delegates specialized tasks to sub-agents with isolated execution | `task()` |
| **FilesystemMiddleware** | File operations | `read_file`, `write_file`, `edit_file`, `glob`, `grep`, `ls` |
| **TodoListMiddleware** | Task planning and progress tracking (auto-enabled) | `write_todos` |
| **SummarizationMiddleware** | Auto-summarizes conversation history (auto-enabled) | - |

---

## Subagents

| Subagent | Description | Tools |
|----------|-------------|-------|
| **research** | Web search with Tavily + think tool for strategic reflection | `internet_search`, `think` |
| **general-purpose** | Full execute_code, filesystem, and vision tools for complex multi-step tasks | `execute_code`, filesystem tools |

---

## MCP Servers

Built-in MCP server definitions:

| Server | Description | Tools |
|--------|-------------|-------|
| **yfinance** | Yahoo Finance data | Stock prices, financials, quotes |
| **tickertick** | Financial news | News articles, headlines |
| **tavily** | Web search | General web search |

---

## Differences from Python Implementation

This TypeScript implementation mirrors the Python [Chen-zexi/open-ptc-agent](https://github.com/Chen-zexi/open-ptc-agent) but has some differences due to library availability and language constraints:

### ✅ Feature Parity

| Feature | Python | TypeScript | Notes |
|---------|--------|------------|-------|
| Programmatic Tool Calling | ✅ | ✅ | Core paradigm implemented |
| DaytonaBackend | ✅ | ✅ | Full sandbox support |
| StateBackend | ✅ | ✅ | In-memory file operations |
| Progressive Tool Discovery | ✅ | ✅ | On-demand tool loading |
| Subagents (research, general) | ✅ | ✅ | Background execution supported |
| MCP Integration | ✅ | ✅ | Yahoo Finance, Tickertick, Tavily |
| Model Tier System | ✅ | ✅ | small/medium/large configuration |
| Cloud Storage (S3, R2) | ✅ | ✅ | File upload support |
| Glob/Grep Tools | ✅ | ✅ | File search operations |

### ⚠️ Limitations / Differences

| Feature | Python | TypeScript | Notes |
|---------|--------|------------|-------|
| **BackgroundSubagentMiddleware** | ✅ | ⚠️ Partial | Fire-and-collect pattern uses deepagentsjs SubagentsMiddleware, but async patterns differ |
| **ViewImageMiddleware** | ✅ | ❌ Not yet | Vision/multimodal support not yet implemented |
| **LangGraph Cloud Deployment** | ✅ | ⚠️ Partial | LangGraph.js deployment differs from Python; `langgraph.json` not directly compatible |
| **Custom MCP Upload** | ✅ | ❌ Not yet | Python MCP implementations not uploadable in TS version |
| **Auto Image Upload** | ✅ | ⚠️ Partial | Storage uploaders implemented, middleware integration pending |
| **Jupyter Notebooks** | ✅ | ❌ N/A | Python-only feature; use Node.js scripts instead |
| **config.yaml parsing** | ✅ | ⚠️ Different | Uses environment variables and shared/config/defaults.yaml |
| **llms.json** | ✅ | ❌ Not yet | LLM provider definitions use LangChain model initialization |
| **Alibaba OSS Storage** | ✅ | ❌ Not yet | Only S3 and R2 implemented |

### 🔧 Architecture Differences

| Aspect | Python | TypeScript |
|--------|--------|------------|
| **Framework** | langchain-ai/deepagents | langchain-ai/deepagentsjs |
| **Package Manager** | uv / pip | npm / pnpm |
| **Configuration** | config.yaml + .env | .env + shared/config/defaults.yaml |
| **MCP Client** | Python mcp library | Uses stdio/subprocess |
| **Prompt Templates** | Jinja2 (.md.j2) | Plain markdown + template strings |

### 📋 Planned Features

- [ ] ViewImageMiddleware for multimodal support
- [ ] BackgroundSubagentMiddleware with wait/task_progress
- [ ] Custom MCP server upload
- [ ] Full llms.json compatibility
- [ ] Alibaba OSS storage support

---

## Acknowledgements

This project builds on:

**Research/Articles**
- [Introducing advanced tool use on the Claude Developer Platform](https://www.anthropic.com/engineering/advanced-tool-use) - Anthropic
- [Code execution with MCP: building more efficient AI agents](https://www.anthropic.com/engineering/code-execution-with-mcp) - Anthropic
- [CodeAct: Executable Code Actions Elicit Better LLM Agents](https://arxiv.org/abs/2402.01030) - Wang et al.

**Frameworks & Infrastructure**
- [LangChain DeepAgentsJS](https://github.com/langchain-ai/deepagentsjs) - TypeScript deep agent framework
- [LangChain DeepAgents (Python)](https://github.com/langchain-ai/deepagents) - Python deep agent framework
- [LangChain.js](https://js.langchain.com/) - JavaScript/TypeScript LLM framework
- [LangGraph.js](https://langchain-ai.github.io/langgraphjs/) - Stateful agent framework
- [Daytona](https://www.daytona.io/) - Sandbox infrastructure

**Upstream Implementation**
- [Chen-zexi/open-ptc-agent](https://github.com/Chen-zexi/open-ptc-agent) - Original Python implementation

---

## Contributing

We welcome contributions! See the [upstream Python project](https://github.com/Chen-zexi/open-ptc-agent#contributing) for contribution guidelines.

---

## License

MIT License
