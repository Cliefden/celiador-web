
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import { Worker } from 'bullmq';

// Helper function to get content type based on file extension
function getContentType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    'js': 'text/javascript',
    'ts': 'text/typescript',
    'jsx': 'text/javascript',
    'tsx': 'text/typescript',
    'css': 'text/css',
    'html': 'text/html',
    'htm': 'text/html',
    'json': 'application/json',
    'xml': 'application/xml',
    'md': 'text/markdown',
    'txt': 'text/plain',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject'
  };
  
  return mimeTypes[ext || ''] || 'text/plain';
}
import { tools } from '@mvp/agent-tools';
import { JobData, EnhancedJobResult as JobResult, JobStatus, FileStorageService, FileData } from '@mvp/shared';
import { LLMService, CodeGenerationContext } from './llm-service.js';
import { promises as fsPromises } from 'fs';

// Debug environment variables
console.log('[codegen] Environment check:');
console.log('[codegen] SUPABASE_URL:', process.env.SUPABASE_URL ? 'present' : 'missing');
console.log('[codegen] SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing');
console.log('[codegen] Working directory:', process.cwd());

// Redis connection
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Create worker to process jobs
const worker = new Worker('codegen-jobs', async (job) => {
  console.log(`[codegen] Processing job ${job.id}: ${job.name}`);
  
  const jobData: JobData = job.data;
  const result: JobResult = {
    success: false,
    output: '',
    error: '',
    metadata: {}
  };

  // Mark job as RUNNING at the start
  try {
    const runningResponse = await fetch(`http://localhost:4000/jobs/${jobData.jobId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'RUNNING'
      })
    });
    
    if (runningResponse.ok) {
      console.log(`[codegen] Job ${job.id} marked as RUNNING`);
    } else {
      console.warn(`[codegen] Failed to mark job as RUNNING: ${runningResponse.status}`);
    }
  } catch (error) {
    console.warn(`[codegen] Failed to update job status to RUNNING:`, error);
  }

  try {
    switch (jobData.type) {
      case 'SCAFFOLD':
        await handleScaffoldJob(jobData, result);
        break;
      case 'EDIT':
        await handleEditJob(jobData, result);
        break;
      case 'TEST':
        await handleTestJob(jobData, result);
        break;
      case 'DEPLOY':
        await handleDeployJob(jobData, result);
        break;
      case 'AI_ACTION':
        await handleAIActionJob(jobData, result);
        break;
      default:
        throw new Error(`Unknown job type: ${jobData.type}`);
    }
    
    result.success = true;
    console.log(`[codegen] Job ${job.id} completed successfully`);
    
    // Update job status in database
    try {
      // Small delay to ensure orchestrator is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch(`http://localhost:4000/jobs/${jobData.jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'COMPLETED',
          output: result.output,
          metadata: result.metadata
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[codegen] Failed to update job status: ${response.status} - ${errorText}`);
      } else {
        console.log(`[codegen] Job status updated successfully`);
      }
    } catch (error) {
      console.warn(`[codegen] Failed to update job status:`, error);
    }
    
  } catch (error) {
    result.success = false;
    result.error = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[codegen] Job ${job.id} failed:`, error);
    
    // Update job status in database for failed jobs
    try {
      const response = await fetch(`http://localhost:4000/jobs/${jobData.jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'FAILED',
          error: result.error,
          metadata: { error: result.error }
        })
      });
      
      if (!response.ok) {
        console.warn(`[codegen] Failed to update job status: ${response.statusText}`);
      }
    } catch (updateError) {
      console.warn(`[codegen] Failed to update job status:`, updateError);
    }
  }

  return result;
}, {
  connection: { url: redisUrl },
  concurrency: 1 // Process one job at a time for now
});

// Handle scaffold jobs (create new project from template)
async function handleScaffoldJob(jobData: JobData, result: JobResult) {
  console.log(`[codegen] Scaffolding project ${jobData.projectId}`);
  
  if (!jobData.templateKey || !jobData.repo) {
    throw new Error('Template key and repo are required for scaffold jobs');
  }

  const storageService = new FileStorageService();
  const fsPromises = await import('fs/promises');
  
  // Create temporary local directory
  const tempDir = `/tmp/project-${jobData.projectId}`;
  await tools.runCmd('mkdir', ['-p', tempDir]);
  
  try {
    // Download template from project-templates bucket
    console.log(`[codegen] Downloading template '${jobData.templateKey}' from project-templates bucket...`);
    
    // Get template files directly from project-templates bucket
    const getAllTemplateFilesRecursively = async (basePath = '') => {
      const fullPath = basePath ? `${jobData.templateKey}/${basePath}` : jobData.templateKey;
      
      const { data, error } = await storageService.supabase.storage
        .from('project-templates')
        .list(fullPath, {
          limit: 1000,
          offset: 0
        });
        
      if (error) {
        console.error(`[codegen] Error listing template files at ${fullPath}:`, error);
        return [];
      }
      
      let allFiles = [];
      
      for (const item of data || []) {
        if (item.id && item.metadata) {
          // This is a file
          const relativePath = basePath ? `${basePath}/${item.name}` : item.name;
          allFiles.push({
            name: item.name,
            path: relativePath,
            fullPath: `${jobData.templateKey}/${relativePath}`,
            size: item.metadata.size
          });
        } else {
          // This is a directory, recurse into it
          const subPath = basePath ? `${basePath}/${item.name}` : item.name;
          const subFiles = await getAllTemplateFilesRecursively(subPath);
          allFiles = allFiles.concat(subFiles);
        }
      }
      
      return allFiles;
    };
    
    const allTemplateFiles = await getAllTemplateFilesRecursively();
    console.log(`[codegen] Found ${allTemplateFiles.length} template files`);
    
    if (allTemplateFiles.length === 0) {
      throw new Error(`Template '${jobData.templateKey}' not found or empty in project-templates bucket`);
    }
    
    // Download and write each template file
    for (const fileItem of allTemplateFiles) {
      console.log(`[codegen] Downloading template file: ${fileItem.path} (${fileItem.size} bytes)`);
      
      const { data: fileData, error: downloadError } = await storageService.supabase.storage
        .from('project-templates')
        .download(fileItem.fullPath);
      
      if (downloadError) {
        console.error(`[codegen] Error downloading ${fileItem.path}:`, downloadError);
        continue;
      }
      
      if (fileData) {
        // Create directory structure if needed
        const filePath = `${tempDir}/${fileItem.path}`;
        const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
        if (dirPath && dirPath !== tempDir) {
          await tools.runCmd('mkdir', ['-p', dirPath]);
        }
        
        // Handle binary files (like favicon.ico) properly
        const isBinaryFile = fileItem.path.endsWith('.ico') || fileItem.path.endsWith('.png') || fileItem.path.endsWith('.jpg') || fileItem.path.endsWith('.woff') || fileItem.path.endsWith('.woff2');
        console.log(`[codegen] Processing file: ${fileItem.path}, isBinary: ${isBinaryFile}`);
        
        if (isBinaryFile) {
          // Binary file - write as buffer
          const arrayBuffer = await fileData.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          await fsPromises.writeFile(filePath, buffer);
          console.log(`[codegen] Created binary file: ${fileItem.path} (${buffer.length} bytes)`);
        } else {
          // Text file - write as string
          const content = await fileData.text();
          await fsPromises.writeFile(filePath, content, 'utf8');
          console.log(`[codegen] Created text file: ${fileItem.path} (${content.length} chars)`);
        }
      } else {
        console.warn(`[codegen] Could not download template file: ${fileItem.path}`);
      }
    }
    
    // Check what was created
    const tempFiles = await fsPromises.readdir(tempDir);
    console.log(`[codegen] Files in temp directory after download:`, tempFiles);
    
    // Initialize git repository
    await tools.runCmd('git', ['init'], { cwd: tempDir });
    await tools.createBranch('main', undefined, { cwd: tempDir });
    
    // Use LLM to customize the template if a prompt is provided
    if (jobData.prompt) {
      try {
        const llmService = new LLMService();
        const context: CodeGenerationContext = {
          projectId: jobData.projectId,
          templateKey: jobData.templateKey,
          existingFiles: [],
          projectStructure: ''
        };
        
        console.log(`[codegen] Using LLM to customize project with prompt: ${jobData.prompt}`);
        const llmResult = await llmService.scaffoldProject(jobData.prompt, context);
        
        if (llmResult.success) {
          result.output = `Project scaffolded and customized successfully. Files modified: ${llmResult.filesModified.join(', ')}`;
          result.metadata = { 
            filesModified: llmResult.filesModified,
            llmGenerated: true
          };
        } else {
          console.warn(`[codegen] LLM customization failed: ${llmResult.error}`);
          result.output = `Project scaffolded successfully (LLM customization failed: ${llmResult.error})`;
          result.metadata = { llmError: llmResult.error };
        }
      } catch (error) {
        console.error(`[codegen] LLM service error:`, error);
        result.output = `Project scaffolded successfully (LLM service unavailable)`;
        result.metadata = { llmError: error instanceof Error ? error.message : 'Unknown error' };
      }
    } else {
      result.output = `Project scaffolded successfully`;
      result.metadata = {};
    }
    
    // Install dependencies
    await tools.runCmd('pnpm', ['install'], { cwd: tempDir });
    
    // Read all files recursively and upload to Supabase Storage
    console.log(`[codegen] Reading files from ${tempDir}`);
    
    // Recursively get all files from all directories, excluding node_modules
    const getAllFiles = async (dir: string, baseDir: string = tempDir): Promise<string[]> => {
      const files = await fsPromises.readdir(dir, { withFileTypes: true });
      const allFiles: string[] = [];
      
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        // Skip node_modules and other common build/cache directories
        const relativePath = path.relative(baseDir, fullPath);
        if (relativePath.startsWith('node_modules') || 
            relativePath.startsWith('.git') || 
            relativePath.startsWith('.next') ||
            relativePath.startsWith('dist') ||
            relativePath.startsWith('build')) {
          continue;
        }
        
        if (file.isDirectory()) {
          // Recursively get files from subdirectories
          const subFiles = await getAllFiles(fullPath, baseDir);
          allFiles.push(...subFiles);
        } else {
          allFiles.push(relativePath);
        }
      }
      
      return allFiles;
    };
    
    const allFilePaths = await getAllFiles(tempDir);
    console.log(`[codegen] Found ${allFilePaths.length} files (including subdirectories):`, allFilePaths);
    
    const fileData: FileData[] = [];
    
    for (const filePath of allFilePaths) {
      console.log(`[codegen] Reading file for upload: ${filePath}`);
      const fullPath = path.join(tempDir, filePath);
      
      // Check if this is a binary file that needs special handling
      const isBinaryFile = filePath.endsWith('.ico') || filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.woff') || filePath.endsWith('.woff2');
      
      if (isBinaryFile) {
        // Read binary file as buffer
        try {
          const buffer = await fsPromises.readFile(fullPath);
          const contentType = getContentType(filePath);
          fileData.push({
            path: filePath,
            content: buffer,
            contentType: contentType
          });
          console.log(`[codegen] Added binary file: ${filePath} (${buffer.length} bytes, ${contentType})`);
        } catch (error) {
          console.warn(`[codegen] Failed to read binary file: ${filePath} - ${error}`);
        }
      } else {
        // Read text file normally
        const contentResult = await tools.readFile(fullPath);
        if (contentResult.content) {
          fileData.push({
            path: filePath, // Use relative path for storage
            content: contentResult.content,
            contentType: 'text/plain'
          });
          console.log(`[codegen] Added text file: ${filePath} (${contentResult.content.length} chars)`);
        } else {
          console.warn(`[codegen] Failed to read text file: ${filePath} - ${contentResult.error}`);
        }
      }
    }
    
    console.log(`[codegen] Uploading ${fileData.length} files to Supabase Storage`);
    // Upload files to Supabase Storage
    await storageService.uploadProjectFiles(jobData.projectId, jobData.userId, fileData);
    console.log(`[codegen] Files uploaded successfully`);
    
    result.output += ` and uploaded to cloud storage (${fileData.length} files)`;
    result.metadata = {
      ...result.metadata,
      filesUploaded: fileData.length,
      storageLocation: `supabase://project-files/${jobData.userId || 'unknown'}/${jobData.projectId}`
    };
    
  } catch (error) {
    console.error(`[codegen] Scaffold job failed:`, error);
    throw error;
  } finally {
    // Clean up temp directory
    await tools.runCmd('rm', ['-rf', tempDir]);
  }
}

// Handle edit jobs (modify existing project)
async function handleEditJob(jobData: JobData, result: JobResult) {
  console.log(`[codegen] Editing project ${jobData.projectId}`);
  
  if (!jobData.prompt) {
    throw new Error('Prompt is required for edit jobs');
  }

  const projectDir = `../../projects/${jobData.projectId}`;
  
  try {
    const llmService = new LLMService();
    const context: CodeGenerationContext = {
      projectId: jobData.projectId,
      templateKey: jobData.templateKey || 'unknown',
      existingFiles: [],
      projectStructure: ''
    };
    
    // For now, we'll edit the main page file as an example
    // In a real implementation, you'd want to analyze the prompt to determine which files to edit
    const targetFile = `${projectDir}/src/app/page.tsx`;
    
    console.log(`[codegen] Using LLM to edit file: ${targetFile}`);
    const llmResult = await llmService.editCode(targetFile, jobData.prompt, context);
    
    if (llmResult.success) {
      result.output = `File edited successfully: ${targetFile}`;
      result.metadata = { 
        filesModified: llmResult.filesModified,
        prompt: jobData.prompt,
        llmGenerated: true
      };
    } else {
      result.output = `Edit failed: ${llmResult.error}`;
      result.metadata = { 
        prompt: jobData.prompt, 
        error: llmResult.error 
      };
    }
  } catch (error) {
    console.error(`[codegen] Edit job error:`, error);
    result.output = `Edit failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.metadata = { 
      prompt: jobData.prompt, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Handle test jobs (run tests on project)
async function handleTestJob(jobData: JobData, result: JobResult) {
  console.log(`[codegen] Testing project ${jobData.projectId}`);
  
  const projectDir = `../../projects/${jobData.projectId}`;
  
  // If a prompt is provided, generate tests using LLM
  if (jobData.prompt) {
    try {
      const llmService = new LLMService();
      const context: CodeGenerationContext = {
        projectId: jobData.projectId,
        templateKey: jobData.templateKey || 'unknown',
        existingFiles: [],
        projectStructure: ''
      };
      
      // Read the main file to generate tests for
      const mainFile = `${projectDir}/src/app/page.tsx`;
      const fileResult = await tools.readFile(mainFile);
      
      if (fileResult.content) {
        console.log(`[codegen] Using LLM to generate tests for: ${mainFile}`);
        const llmResult = await llmService.generateTests(fileResult.content, context);
        
        if (llmResult.success) {
          // Write the generated test file
          const testFile = `${projectDir}/src/app/page.test.tsx`;
          const writeResult = await tools.writeFile(testFile, llmResult.generatedCode);
          
          if (writeResult.ok) {
            result.output = `Tests generated successfully: ${testFile}`;
            result.metadata = { 
              testFile,
              llmGenerated: true,
              prompt: jobData.prompt
            };
          } else {
            result.output = `Failed to write test file: ${writeResult.error}`;
            result.metadata = { error: writeResult.error };
          }
        } else {
          result.output = `Test generation failed: ${llmResult.error}`;
          result.metadata = { error: llmResult.error };
        }
      } else {
        result.output = `Could not read main file for test generation`;
        result.metadata = { error: 'File not found' };
      }
    } catch (error) {
      console.error(`[codegen] Test generation error:`, error);
      result.output = `Test generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.metadata = { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  } else {
    // Run existing tests
    const testResult = await tools.runCmd('pnpm', ['test'], { cwd: projectDir });
    
    result.output = testResult.stdout;
    result.error = testResult.stderr;
    result.metadata = { exitCode: testResult.exitCode };
  }
}

// Handle deploy jobs (deploy project)
async function handleDeployJob(jobData: JobData, result: JobResult) {
  console.log(`[codegen] Deploying project ${jobData.projectId}`);
  
  // For now, just log the deploy request
  // TODO: Implement actual deployment logic
  result.output = 'Deploy request processed (not yet implemented)';
  result.metadata = { deployed: false };
}

/**
 * Update files in the preview temp directory for real-time sync
 */
async function updatePreviewTempFile(
  projectId: string, 
  userId: string, 
  filePath: string, 
  content: string | null, 
  operation: 'create' | 'update' | 'delete'
) {
  try {
    const previewTempPath = `/tmp/bether-previews/${userId}-${projectId}`;
    const fullFilePath = path.join(previewTempPath, filePath);
    
    // Check if preview temp directory exists
    const fsPromises = await import('fs/promises');
    try {
      await fsPromises.access(previewTempPath);
    } catch {
      // Preview temp directory doesn't exist, skip
      console.log(`[codegen] Preview temp directory not found: ${previewTempPath} - skipping real-time sync`);
      return;
    }
    
    switch (operation) {
      case 'create':
      case 'update':
        if (!content) {
          console.warn(`[codegen] No content provided for ${operation} operation on ${filePath}`);
          return;
        }
        
        // Ensure directory exists for the file
        const fileDir = path.dirname(fullFilePath);
        await fsPromises.mkdir(fileDir, { recursive: true });
        
        // Write the file
        await fsPromises.writeFile(fullFilePath, content, 'utf8');
        console.log(`[codegen] Real-time sync: ${operation}d file ${filePath} in preview temp directory`);
        break;
        
      case 'delete':
        try {
          await fsPromises.unlink(fullFilePath);
          console.log(`[codegen] Real-time sync: deleted file ${filePath} from preview temp directory`);
        } catch (error) {
          // File might not exist, that's ok
          console.log(`[codegen] File ${filePath} not found in preview temp directory for deletion (this is ok)`);
        }
        break;
    }
  } catch (error) {
    // Don't fail the main operation if preview sync fails
    console.warn(`[codegen] Failed to sync ${filePath} to preview temp directory:`, error instanceof Error ? error.message : error);
  }
}

// Handle AI action jobs (AI-driven file operations)
async function handleAIActionJob(jobData: JobData, result: JobResult) {
  console.log(`[codegen] Processing AI action for project ${jobData.projectId}`);
  
  if (!jobData.metadata || !jobData.metadata.actions) {
    throw new Error('AI action metadata is required');
  }

  const storageService = new FileStorageService();
  const actions = jobData.metadata.actions as any[];
  const completedActions: string[] = [];
  const errors: string[] = [];

  for (const action of actions) {
    try {
      console.log(`[codegen] Executing action:`, action);
      
      switch (action.type) {
        case 'create_file':
          await storageService.saveFile(
            jobData.projectId, 
            jobData.userId, 
            action.path, 
            action.content
          );
          // Also update the preview temp directory if it exists
          await updatePreviewTempFile(jobData.projectId, jobData.userId, action.path, action.content, 'create');
          completedActions.push(`Created file: ${action.path}`);
          break;
          
        case 'update_file':
          await storageService.updateFile(
            jobData.projectId, 
            jobData.userId, 
            action.path, 
            action.content
          );
          // Also update the preview temp directory if it exists
          await updatePreviewTempFile(jobData.projectId, jobData.userId, action.path, action.content, 'update');
          completedActions.push(`Updated file: ${action.path}`);
          break;
          
        case 'delete_file':
          await storageService.deleteFile(
            jobData.projectId, 
            jobData.userId, 
            action.path
          );
          // Also delete from preview temp directory if it exists
          await updatePreviewTempFile(jobData.projectId, jobData.userId, action.path, null, 'delete');
          completedActions.push(`Deleted file: ${action.path}`);
          break;
          
        default:
          errors.push(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      const errorMsg = `Failed to ${action.type} ${action.path}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[codegen] ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  if (errors.length > 0 && completedActions.length === 0) {
    throw new Error(`All actions failed: ${errors.join(', ')}`);
  }

  result.output = `AI actions completed. ${completedActions.length} successful, ${errors.length} failed.`;
  if (completedActions.length > 0) {
    result.output += `\n\nCompleted actions:\n${completedActions.map(a => `• ${a}`).join('\n')}`;
  }
  if (errors.length > 0) {
    result.output += `\n\nErrors:\n${errors.map(e => `• ${e}`).join('\n')}`;
  }
  
  result.metadata = {
    actionsCompleted: completedActions,
    errors: errors,
    totalActions: actions.length
  };
}

// Handle worker events
worker.on('completed', (job) => {
  console.log(`[codegen] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[codegen] Job ${job?.id} failed:`, err);
});

worker.on('error', (err) => {
  console.error(`[codegen] Worker error:`, err);
});

console.log('[codegen] Worker online. Waiting for jobs...');

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[codegen] Shutting down worker...');
  await worker.close();
  process.exit(0);
});
