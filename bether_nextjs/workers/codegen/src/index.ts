
import 'dotenv/config';
import { Worker } from 'bullmq';
import { tools } from '@mvp/agent-tools';
import { JobData, EnhancedJobResult as JobResult, JobStatus, FileStorageService, FileData } from '@mvp/shared';
import { LLMService, CodeGenerationContext } from './llm-service.js';

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
    // Copy template to temp directory
    const templateDir = `../../packages/templates/${jobData.templateKey}`;
    console.log(`[codegen] Copying template from: ${templateDir} to: ${tempDir}`);
    
    // Check if template directory exists
    try {
      const templateStats = await fsPromises.stat(templateDir);
      console.log(`[codegen] Template directory exists: ${templateStats.isDirectory()}`);
    } catch (error) {
      console.error(`[codegen] Template directory not found: ${templateDir}`);
      throw new Error(`Template directory not found: ${templateDir}`);
    }
    
    const copyResult = await tools.runCmd('cp', ['-r', `${templateDir}/*`, tempDir]);
    console.log(`[codegen] Copy result:`, copyResult);
    
    // Check what was copied
    const tempFiles = await fsPromises.readdir(tempDir);
    console.log(`[codegen] Files in temp directory after copy:`, tempFiles);
    
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
    
    // Read all files and upload to Supabase Storage
    console.log(`[codegen] Reading files from ${tempDir}`);
    
    // Use fs.readdir directly to list files in the temp directory
    const files = await fsPromises.readdir(tempDir, { withFileTypes: true });
    const fileNames = files
      .filter(file => file.isFile()) // Only include files, not directories
      .map(file => file.name);
    
    console.log(`[codegen] Found ${fileNames.length} files:`, fileNames);
    
    const fileData: FileData[] = [];
    
    for (const file of fileNames) {
      console.log(`[codegen] Reading file: ${file}`);
      const contentResult = await tools.readFile(`${tempDir}/${file}`);
      if (contentResult.content) {
        fileData.push({
          path: file,
          content: contentResult.content,
          contentType: 'text/plain'
        });
        console.log(`[codegen] Added file: ${file} (${contentResult.content.length} bytes)`);
      } else {
        console.warn(`[codegen] Failed to read file: ${file} - ${contentResult.error}`);
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
