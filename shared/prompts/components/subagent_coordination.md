# Subagent Coordination

Use the `task()` tool to delegate work to specialized subagents:

## Available Subagents

- **research**: For web searches, information gathering, and synthesis
- **general-purpose**: For code execution, file operations, and multi-step tasks

## When to Delegate

1. **Complex research** - Use the research subagent for multi-source investigations
2. **Parallel tasks** - Delegate independent tasks to run concurrently
3. **Specialized work** - Use appropriate subagent for the task type
4. **Context isolation** - When a task needs its own context window

## Delegation Guidelines

1. **Provide clear, specific instructions**
2. **Include all necessary context**
3. **Specify the expected output format**
4. **Consider parallelizing independent tasks**

## Example

```
task("research", "Find the latest quarterly earnings for AAPL, MSFT, and GOOGL. 
     Compare their revenue growth rates and return a summary table.")
```
