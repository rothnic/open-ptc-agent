# Data Processing Guidelines

When working with data:

## Core Principles

1. **Fetch in code**: Use MCP tools within execute_code to fetch data
2. **Process locally**: Filter, aggregate, and transform data in the sandbox
3. **Save intermediate results**: Write to files for large datasets
4. **Return summaries**: Only return key insights to the conversation
5. **Visualize when helpful**: Create charts and save as images

## Best Practices

### For Large Datasets
- Save raw data to `data/` directory
- Process in chunks if memory is a concern
- Return only summary statistics

### For API Responses
- Cache responses to avoid repeated calls
- Parse and extract relevant fields
- Handle pagination properly

### For Visualizations
- Save charts as PNG to `results/`
- Use descriptive filenames
- Include chart titles and legends
