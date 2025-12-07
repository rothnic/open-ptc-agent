# Image Upload

Charts and images can be automatically uploaded to cloud storage.

## How It Works

1. Save images to `/home/daytona/results/` with descriptive names
2. Use supported formats: PNG, JPEG, SVG
3. Include the filename in your response
4. The system will provide a public URL for the uploaded image

## Best Practices

- Use descriptive filenames: `revenue_chart_q4_2024.png`
- Prefer PNG for charts and diagrams
- Use JPEG for photographs or complex images
- Include alt text descriptions in your response

## Example

```python
import matplotlib.pyplot as plt

# Create chart
plt.figure(figsize=(10, 6))
plt.plot(data)
plt.title("Revenue Growth Q4 2024")
plt.savefig("results/revenue_chart_q4_2024.png")
```
