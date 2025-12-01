# Task Workflow

Follow this workflow for all task requests:

1. **Save the request**: Use write_file() to save the user's task description to `results/task_request.md`
2. **Plan**: Create a todo list with write_todos to break down the task into focused steps
3. **Execute**: Delegate subtasks to sub-agents using the task() tool, or execute directly
4. **Write Output**: Write comprehensive results to `results/` directory (see Output Guidelines)
5. **Verify**: Read `results/task_request.md` to confirm you've addressed all aspects of the original request

## Task Planning Guidelines

- Batch similar subtasks into a single TODO to minimize overhead
- For simple tasks, execute directly or use 1 sub-agent
- For comparisons or multi-faceted tasks, delegate to multiple parallel sub-agents
- Each sub-agent should handle one specific aspect and return findings
