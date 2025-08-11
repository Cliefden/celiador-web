import OpenAI from 'openai';
import { tools } from '@mvp/agent-tools';

export interface CodeGenerationContext {
  projectId: string;
  templateKey: string;
  existingFiles?: string[];
  projectStructure?: string;
}

export interface CodeGenerationResult {
  success: boolean;
  generatedCode: string;
  filesModified: string[];
  error?: string;
}

export class LLMService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey,
    });
  }

  async scaffoldProject(prompt: string, context: CodeGenerationContext): Promise<CodeGenerationResult> {
    const systemPrompt = this.buildScaffoldSystemPrompt(context);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      });

      const generatedCode = response.choices[0]?.message?.content;
      if (!generatedCode) {
        throw new Error('No response from LLM');
      }

      // Parse the response and apply changes
      return await this.applyScaffoldChanges(generatedCode, context);
    } catch (error) {
      return {
        success: false,
        generatedCode: '',
        filesModified: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async editCode(
    filePath: string, 
    instructions: string, 
    context: CodeGenerationContext
  ): Promise<CodeGenerationResult> {
    try {
      // Read existing file
      const fileResult = await tools.readFile(filePath);
      if (fileResult.error) {
        throw new Error(`Failed to read file: ${fileResult.error}`);
      }

      const existingCode = fileResult.content;
      const systemPrompt = this.buildEditSystemPrompt(context);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `File: ${filePath}\n\nExisting code:\n\`\`\`\n${existingCode}\n\`\`\`\n\nInstructions: ${instructions}` }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      });

      const generatedCode = response.choices[0]?.message?.content;
      if (!generatedCode) {
        throw new Error('No response from LLM');
      }

      // Apply the changes
      const writeResult = await tools.writeFile(filePath, generatedCode);
      if (!writeResult.ok) {
        throw new Error(`Failed to write file: ${writeResult.error}`);
      }

      return {
        success: true,
        generatedCode,
        filesModified: [filePath]
      };
    } catch (error) {
      return {
        success: false,
        generatedCode: '',
        filesModified: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async generateTests(code: string, context: CodeGenerationContext): Promise<CodeGenerationResult> {
    const systemPrompt = this.buildTestSystemPrompt(context);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate tests for this code:\n\`\`\`\n${code}\n\`\`\`` }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      });

      const generatedCode = response.choices[0]?.message?.content;
      if (!generatedCode) {
        throw new Error('No response from LLM');
      }

      return {
        success: true,
        generatedCode,
        filesModified: []
      };
    } catch (error) {
      return {
        success: false,
        generatedCode: '',
        filesModified: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private buildScaffoldSystemPrompt(context: CodeGenerationContext): string {
    return `You are an expert software developer tasked with scaffolding a new project based on a template.

Template: ${context.templateKey}
Project ID: ${context.projectId}

Your task is to:
1. Understand the user's requirements from their prompt
2. Generate appropriate code modifications to the template
3. Provide clear instructions for what files to create or modify
4. Ensure the code follows best practices and is production-ready

Respond with:
1. A list of files to create/modify
2. The complete content for each file
3. Any additional setup instructions

Format your response as:
FILE: path/to/file
CONTENT:
\`\`\`language
// code content here
\`\`\`

INSTRUCTIONS:
- Additional setup steps if needed

Be thorough and ensure all necessary files are included.`;
  }

  private buildEditSystemPrompt(context: CodeGenerationContext): string {
    return `You are an expert software developer tasked with editing existing code.

Template: ${context.templateKey}
Project ID: ${context.projectId}

Your task is to:
1. Understand the user's edit instructions
2. Modify the existing code appropriately
3. Maintain code quality and best practices
4. Preserve existing functionality unless explicitly asked to change it

Guidelines:
- Only modify what's necessary
- Maintain consistent code style
- Add appropriate comments for complex changes
- Ensure the code compiles and runs correctly

Respond with the complete updated file content.`;
  }

  private buildTestSystemPrompt(context: CodeGenerationContext): string {
    return `You are an expert software developer tasked with generating comprehensive tests.

Template: ${context.templateKey}
Project ID: ${context.projectId}

Your task is to:
1. Analyze the provided code
2. Generate comprehensive test cases
3. Cover edge cases and error scenarios
4. Follow testing best practices

Guidelines:
- Use appropriate testing framework (Jest for JavaScript/TypeScript)
- Include unit tests, integration tests where appropriate
- Test both success and failure scenarios
- Ensure good test coverage

Respond with the complete test file content.`;
  }

  private async applyScaffoldChanges(
    llmResponse: string, 
    context: CodeGenerationContext
  ): Promise<CodeGenerationResult> {
    const filesModified: string[] = [];
    const projectDir = `./projects/${context.projectId}`;

    try {
      // Parse the LLM response to extract file paths and content
      const fileBlocks = this.parseFileBlocks(llmResponse);
      
      for (const block of fileBlocks) {
        const filePath = `${projectDir}/${block.path}`;
        
        // Ensure directory exists
        const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
        await tools.runCmd('mkdir', ['-p', dirPath]);
        
        // Write file
        const writeResult = await tools.writeFile(filePath, block.content);
        if (writeResult.ok) {
          filesModified.push(filePath);
        } else {
          console.error(`Failed to write file ${filePath}:`, writeResult.error);
        }
      }

      return {
        success: true,
        generatedCode: llmResponse,
        filesModified
      };
    } catch (error) {
      return {
        success: false,
        generatedCode: llmResponse,
        filesModified,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private parseFileBlocks(response: string): Array<{ path: string; content: string }> {
    const blocks: Array<{ path: string; content: string }> = [];
    const fileRegex = /FILE:\s*(.+?)\s*\nCONTENT:\s*\n```\w*\n([\s\S]*?)```/g;
    
    let match;
    while ((match = fileRegex.exec(response)) !== null) {
      blocks.push({
        path: match[1].trim(),
        content: match[2].trim()
      });
    }
    
    return blocks;
  }
}
