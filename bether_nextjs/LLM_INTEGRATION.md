# LLM Integration for Bether

This document describes the LLM (Large Language Model) integration that has been added to Bether, enabling AI-powered code generation and editing.

## Overview

The LLM integration allows Bether to:
- **Scaffold Projects**: Customize templates based on natural language prompts
- **Edit Code**: Modify existing code files using AI
- **Generate Tests**: Create comprehensive test suites automatically

## Architecture

### Components

1. **LLMService** (`workers/codegen/src/llm-service.ts`)
   - Handles all LLM interactions
   - Manages system prompts for different job types
   - Parses and applies LLM responses

2. **Enhanced Worker** (`workers/codegen/src/index.ts`)
   - Integrates LLM service with job processing
   - Handles LLM errors gracefully
   - Provides detailed metadata about LLM operations

3. **Type Definitions** (`packages/shared/src/index.ts`)
   - LLM-specific metadata schemas
   - Enhanced job result types

## Setup

### 1. Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key

### 2. Configure Environment

Add your OpenAI API key to the worker environment:

```bash
# In workers/codegen/.env
OPENAI_API_KEY=your_actual_api_key_here
```

### 3. Restart Services

```bash
# Restart the worker to pick up new environment variables
pnpm --filter @mvp/worker-codegen dev
```

## Usage

### Scaffold with LLM Customization

Create a project with AI-powered customization:

```bash
# Create project
curl -X POST http://localhost:4000/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-ai-app",
    "templateKey": "next-prisma-supabase",
    "repo": {"provider": "github", "owner": "user", "name": "my-ai-app"}
  }'

# Enqueue scaffold job with prompt
curl -X POST http://localhost:4000/projects/{project_id}/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "SCAFFOLD",
    "prompt": "Create a todo app with user authentication and a modern UI"
  }'
```

### Edit Existing Code

Modify existing files using natural language:

```bash
curl -X POST http://localhost:4000/projects/{project_id}/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "EDIT",
    "prompt": "Add a dark mode toggle to the header"
  }'
```

### Generate Tests

Create comprehensive test suites:

```bash
curl -X POST http://localhost:4000/projects/{project_id}/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TEST",
    "prompt": "Generate unit tests for the user authentication components"
  }'
```

## System Prompts

The LLM service uses specialized system prompts for different operations:

### Scaffold Prompt
- Understands user requirements
- Generates appropriate code modifications
- Provides file creation/modification instructions
- Ensures production-ready code

### Edit Prompt
- Modifies existing code appropriately
- Maintains code quality and best practices
- Preserves existing functionality
- Adds appropriate comments

### Test Prompt
- Analyzes provided code
- Generates comprehensive test cases
- Covers edge cases and error scenarios
- Follows testing best practices

## Error Handling

The LLM integration includes robust error handling:

- **API Key Missing**: Graceful fallback with clear error messages
- **LLM Service Errors**: Jobs continue with template-only mode
- **File Operation Errors**: Detailed error reporting
- **Network Issues**: Retry logic and timeout handling

## Monitoring

### Job Metadata

LLM operations add metadata to job results:

```json
{
  "success": true,
  "output": "Project scaffolded and customized successfully",
  "metadata": {
    "llmGenerated": true,
    "filesModified": ["src/app/page.tsx", "src/components/Header.tsx"],
    "projectDir": "./projects/123",
    "prompt": "Create a todo app..."
  }
}
```

### Error Cases

```json
{
  "success": false,
  "error": "LLM customization failed: Invalid API key",
  "metadata": {
    "llmError": "Invalid API key",
    "projectDir": "./projects/123"
  }
}
```

## Future Enhancements

### Planned Features

1. **Multi-Model Support**
   - Anthropic Claude integration
   - Local model support (Ollama)
   - Model selection per job type

2. **Advanced Context Management**
   - Project structure analysis
   - Dependency tracking
   - Codebase understanding

3. **Tool Calling**
   - Direct LLM tool usage
   - File system operations
   - Git operations

4. **Prompt Templates**
   - Customizable system prompts
   - Template-specific prompts
   - User-defined prompts

### Performance Optimizations

1. **Caching**
   - LLM response caching
   - Template analysis caching
   - Context caching

2. **Streaming**
   - Real-time code generation
   - Progress updates
   - Partial results

## Troubleshooting

### Common Issues

1. **"OPENAI_API_KEY environment variable is required"**
   - Check that the API key is set in `workers/codegen/.env`
   - Restart the worker after adding the key

2. **"LLM customization failed"**
   - Verify API key is valid
   - Check OpenAI account has sufficient credits
   - Review error details in job metadata

3. **"No response from LLM"**
   - Check network connectivity
   - Verify OpenAI service status
   - Review API rate limits

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=llm:* pnpm --filter @mvp/worker-codegen dev
```

## Security Considerations

1. **API Key Management**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly

2. **Code Generation**
   - Review generated code before deployment
   - Implement code review processes
   - Use security scanning tools

3. **Rate Limiting**
   - Monitor API usage
   - Implement request throttling
   - Set usage alerts
