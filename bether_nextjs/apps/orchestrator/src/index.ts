
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { Queue } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { FileStorageService } from '@mvp/shared';
import { aiService } from './services/ai-service.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'placeholder_key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_key';

// Create two clients: one for auth (anon key) and one for database operations (service role key)
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

// Supabase database service
const db = {
  getProjectsByUserId: async (userId: string) => {
    console.log('Supabase: getProjectsByUserId called for user:', userId);
    const { data, error } = await supabaseService
      .from('projects')
      .select('*')
      .eq('userid', userId)
      .is('deletedAt', null) // Only get non-deleted projects
      .order('createdat', { ascending: false });
    
    if (error) {
      console.error('Supabase error getting projects:', error);
      throw error;
    }
    
    console.log('Supabase: Found', data?.length || 0, 'projects for user:', userId);
    return data || [];
  },
  
  createProject: async (data: any) => {
    console.log('Supabase: createProject called with data:', data);
    const { data: project, error } = await supabaseService
      .from('projects')
      .insert({
        name: data.name,
        templatekey: data.templateKey || 'next-prisma-supabase',
        repoprovider: data.repoProvider || 'github',
        repoowner: data.repoOwner,
        reponame: data.repoName,
        userid: data.userId,
        status: 'READY'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating project:', error);
      throw error;
    }
    
    return project;
  },
  
  getProjectById: async (id: string) => {
    console.log('Supabase: getProjectById called for id:', id);
    const { data, error } = await supabaseService
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Supabase error getting project:', error);
      return null;
    }
    
    return data;
  },
  
  createJob: async (data: any) => {
    console.log('Supabase: createJob called with data:', data);
    const { data: job, error } = await supabaseService
      .from('jobs')
      .insert({
        projectid: data.projectId,
        userid: data.userId,
        type: data.type,
        prompt: data.prompt,
        status: 'PENDING'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating job:', error);
      throw error;
    }
    
    return job;
  },
  
  getJobById: async (id: string) => {
    console.log('Supabase: getJobById called for id:', id);
    const { data, error } = await supabaseService
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Supabase error getting job:', error);
      return null;
    }
    
    return data;
  },
  
  getJobsByProjectId: async (id: string) => {
    console.log('Supabase: getJobsByProjectId called for project:', id);
    const { data, error } = await supabaseService
      .from('jobs')
      .select('*')
      .eq('projectid', id)
      .order('createdat', { ascending: false });
    
    if (error) {
      console.error('Supabase error getting jobs:', error);
      throw error;
    }
    
    return data || [];
  },
  
  updateJobStatus: async (id: string, status: string, output?: string, error?: string, metadata?: any) => {
    console.log('Supabase: updateJobStatus called for job:', id, 'status:', status);
    
    // First get the job to find the userid
    const { data: existingJob, error: getError } = await supabaseService
      .from('jobs')
      .select('userid')
      .eq('id', id)
      .single();
    
    if (getError) {
      console.error('Supabase error getting job for update:', getError);
      throw getError;
    }
    
    const { data, error: updateError } = await supabaseService
      .from('jobs')
      .update({
        status,
        output,
        error,
        metadata,
        updater: existingJob.userid // Set updater to the job's userid
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Supabase error updating job:', updateError);
      throw updateError;
    }
    
    return data;
  },

  deleteProject: async (id: string, userId: string) => {
    console.log('Supabase: deleteProject called for project:', id);
    
    // Soft delete the project
    const { data, error } = await supabaseService
      .from('projects')
      .update({
        deletedAt: new Date().toISOString(),
        deleter: userId
      })
      .eq('id', id)
      .eq('userid', userId) // Ensure user owns the project
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error deleting project:', error);
      throw error;
    }
    
    return data;
  }
};

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[orchestrator] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Redis connection
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Job queue
const jobQueue = new Queue('codegen-jobs', {
  connection: { url: redisUrl }
});

// Supabase authentication middleware
const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  
  console.log('[orchestrator] Auth middleware - headers:', req.headers.authorization ? 'present' : 'missing');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[orchestrator] Auth middleware - invalid header format');
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  console.log('[orchestrator] Auth middleware - token length:', token.length);
  
  try {
    // Verify the JWT token with Supabase
    console.log('[orchestrator] Auth middleware - verifying token...');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('[orchestrator] Auth middleware - token validation failed:', error?.message);
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('[orchestrator] Auth middleware - token validated for user:', user.id);
    // Add user to request
    (req as any).user = user as any;
    next();
  } catch (error) {
    console.error('[orchestrator] Auth middleware - error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication endpoints
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      id: data.user?.id,
      email: data.user?.email,
      name: data.user?.user_metadata?.name
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      id: data.user?.id,
      email: data.user?.email,
      name: data.user?.user_metadata?.name,
      accessToken: data.session?.access_token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Protected routes
app.get('/projects', authenticateUser, async (req, res) => {
  try {
    console.log('[orchestrator] GET /projects - request received');
    const user = (req as any).user;
    console.log('[orchestrator] GET /projects - user:', user.id);
    const projects = await db.getProjectsByUserId((user as any).id);
    console.log('[orchestrator] GET /projects - returning', projects.length, 'projects');
    res.json(projects);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/projects', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name, templateKey, repo } = req.body;

    if (!name || !repo) {
      return res.status(400).json({ error: 'Name and repository information are required' });
    }

    const project = await db.createProject({
      name,
      templateKey: templateKey || 'next-prisma-supabase',
      repoProvider: repo.provider || 'github',
      repoOwner: repo.owner,
      repoName: repo.name,
      userId: user.id
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Failed to create project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.get('/projects/:id', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const project = await db.getProjectById(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.userid !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    console.error('Failed to fetch project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

app.delete('/projects/:id', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const project = await db.deleteProject(id, user.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Failed to delete project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

app.post('/projects/:id/jobs', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { type, prompt } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Job type is required' });
    }

    // Verify project ownership
    const project = await db.getProjectById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.userid !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create job in database
    const job = await db.createJob({
      type,
      prompt,
      projectId: id,
      userId: user.id
    });

    // Add job to queue
    await jobQueue.add('codegen-jobs', {
      jobId: job.id,
      projectId: id,
      userId: user.id,
      type,
      prompt,
      templateKey: project.templatekey,
      repo: {
        provider: project.repoprovider,
        owner: project.repoowner,
        name: project.reponame
      }
    });

    res.status(201).json(job);
  } catch (error) {
    console.error('Failed to create job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

app.get('/jobs/:id', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const job = await db.getJobById(id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Verify project ownership
    const project = await db.getProjectById(job.projectid);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.userid !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(job);
  } catch (error) {
    console.error('Failed to fetch job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Update job status (used by worker)
app.patch('/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, output, error, metadata } = req.body;

    const job = await db.getJobById(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    await db.updateJobStatus(id, status, output, error, metadata);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update job:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

app.get('/projects/:id/jobs', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Verify project ownership
    const project = await db.getProjectById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.userid !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const jobs = await db.getJobsByProjectId(id);
    res.json(jobs);
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Cancel job
app.post('/jobs/:id/cancel', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Get job and verify ownership
    const job = await db.getJobById(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Verify project ownership
    const project = await db.getProjectById(job.projectid);
    if (!project || project.userid !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update job status to cancelled
    await db.updateJobStatus(id, 'CANCELLED');
    
    res.json({ success: true, message: 'Job cancelled successfully' });
  } catch (error) {
    console.error('Failed to cancel job:', error);
    res.status(500).json({ error: 'Failed to cancel job' });
  }
});

// Retry failed job
app.post('/jobs/:id/retry', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Get job and verify ownership
    const job = await db.getJobById(id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Verify project ownership
    const project = await db.getProjectById(job.projectid);
    if (!project || project.userid !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only allow retrying failed jobs
    if (job.status !== 'FAILED') {
      return res.status(400).json({ error: 'Only failed jobs can be retried' });
    }

    // Create a new job with the same parameters
    const newJob = await db.createJob({
      type: job.type,
      prompt: job.prompt,
      projectId: job.projectid,
      userId: user.id
    });

    // Add job to queue
    await jobQueue.add('codegen-jobs', {
      jobId: newJob.id,
      projectId: job.projectid,
      userId: user.id,
      type: job.type,
      prompt: job.prompt,
      templateKey: project.templatekey,
      repo: {
        provider: project.repoprovider,
        owner: project.repoowner,
        name: project.reponame
      }
    });

    res.json(newJob);
  } catch (error) {
    console.error('Failed to retry job:', error);
    res.status(500).json({ error: 'Failed to retry job' });
  }
});

// File storage endpoints
app.get('/projects/:id/files', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Verify project ownership
    const project = await db.getProjectById(id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.userid !== user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const storageService = new FileStorageService();
    const files = await storageService.downloadProjectFiles(id, user.id);
    
    res.json({ files });
  } catch (error) {
    console.error('Failed to download project files:', error);
    res.status(500).json({ error: 'Failed to download project files' });
  }
});

app.get('/projects/:id/files/tree', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    console.log(`[orchestrator] File tree request for project ${id}, user ${user.id}`);

    // Verify project ownership
    const project = await db.getProjectById(id);
    if (!project) {
      console.log(`[orchestrator] Project ${id} not found`);
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.userid !== user.id) {
      console.log(`[orchestrator] Access denied: project.userid=${project.userid}, user.id=${user.id}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log(`[orchestrator] Getting file tree for project ${id}, user ${user.id}`);
    const storageService = new FileStorageService();
    const fileTree = await storageService.getProjectFileTree(id, user.id);
    
    console.log(`[orchestrator] File tree result:`, JSON.stringify(fileTree, null, 2));
    res.json({ tree: fileTree });
  } catch (error) {
    console.error('Failed to get project file tree:', error);
    res.status(500).json({ error: 'Failed to get project file tree' });
  }
});

app.get('/projects/:id/files/*', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const filePath = req.params[0]; // Get the wildcard parameter

    console.log(`[orchestrator] File content request for project ${id}, file ${filePath}, user ${user.id}`);

    // Verify project ownership
    const project = await db.getProjectById(id);
    if (!project) {
      console.log(`[orchestrator] Project ${id} not found`);
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.userid !== user.id) {
      console.log(`[orchestrator] Access denied: project.userid=${project.userid}, user.id=${user.id}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log(`[orchestrator] Getting file content for project ${id}, file ${filePath}, user ${user.id}`);
    const storageService = new FileStorageService();
    const file = await storageService.getFile(id, user.id, filePath);
    
    if (!file) {
      console.log(`[orchestrator] File ${filePath} not found`);
      return res.status(404).json({ error: 'File not found' });
    }
    
    console.log(`[orchestrator] File content retrieved successfully, size: ${file.content.length} bytes`);
    res.json({ file });
  } catch (error) {
    console.error('Failed to get file:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

// Save file content
app.put('/projects/:id/files/save', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { filePath, content } = req.body;

    console.log(`[orchestrator] File save request for project ${id}, file ${filePath}, user ${user.id}`);

    // Verify project ownership
    const project = await db.getProjectById(id);
    if (!project) {
      console.log(`[orchestrator] Project ${id} not found`);
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.userid !== user.id) {
      console.log(`[orchestrator] Access denied: project.userid=${project.userid}, user.id=${user.id}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log(`[orchestrator] Saving file content for project ${id}, file ${filePath}, user ${user.id}`);
    const storageService = new FileStorageService();
    await storageService.saveFile(id, user.id, filePath, content);
    
    console.log(`[orchestrator] File content saved successfully`);
    res.json({ success: true, message: 'File saved successfully' });
  } catch (error) {
    console.error('Failed to save file:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// Create file or directory
app.post('/projects/:id/files/create', authenticateUser, async (req, res) => {
  console.log(`[orchestrator] POST /projects/:id/files/create endpoint hit`);
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { filePath, content = '', type = 'file' } = req.body;

    console.log(`[orchestrator] File/folder create request for project ${id}, path ${filePath}, type ${type}, user ${user.id}`);

    // Verify project ownership
    const project = await db.getProjectById(id);
    if (!project) {
      console.log(`[orchestrator] Project ${id} not found`);
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.userid !== user.id) {
      console.log(`[orchestrator] Access denied: project.userid=${project.userid}, user.id=${user.id}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    const storageService = new FileStorageService();
    
    if (type === 'directory') {
      console.log(`[orchestrator] Creating directory for project ${id}, path ${filePath}, user ${user.id}`);
      // In Supabase Storage, directories are created implicitly when you save a file
      // Create a .gitkeep file to ensure the directory exists
      await storageService.saveFile(id, user.id, `${filePath}/.gitkeep`, '');
    } else {
      console.log(`[orchestrator] Creating file for project ${id}, path ${filePath}, user ${user.id}`);
      await storageService.saveFile(id, user.id, filePath, content);
    }
    
    console.log(`[orchestrator] ${type === 'directory' ? 'Directory' : 'File'} created successfully`);
    res.json({ success: true, message: `${type === 'directory' ? 'Directory' : 'File'} created successfully` });
  } catch (error) {
    console.error('Failed to create file/directory:', error);
    res.status(500).json({ error: 'Failed to create file/directory' });
  }
});

// Delete folder and all its contents
app.post('/projects/:id/files/delete-folder', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { folderPath } = req.body;

    console.log(`[orchestrator] Folder delete request for project ${id}, path ${folderPath}, user ${user.id}`);

    // Verify project ownership
    const project = await db.getProjectById(id);
    if (!project) {
      console.log(`[orchestrator] Project ${id} not found`);
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.userid !== user.id) {
      console.log(`[orchestrator] Access denied: project.userid=${project.userid}, user.id=${user.id}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    const storageService = new FileStorageService();
    
    // Get all files in the project
    const fileTree = await storageService.getProjectFileTree(id, user.id);
    
    // Find all files that start with the folder path
    const filesToDelete = [];
    const collectFiles = (nodes: any[], currentPath = '') => {
      for (const node of nodes) {
        const nodePath = currentPath ? `${currentPath}/${node.name}` : node.name;
        
        if (nodePath.startsWith(folderPath)) {
          if (node.type === 'file') {
            filesToDelete.push(nodePath);
          }
          if (node.children) {
            collectFiles(node.children, nodePath);
          }
        } else if (node.children) {
          collectFiles(node.children, nodePath);
        }
      }
    };
    
    collectFiles(fileTree);
    
    console.log(`[orchestrator] Found ${filesToDelete.length} files to delete in folder ${folderPath}`);
    
    // Delete all files in the folder
    for (const filePath of filesToDelete) {
      try {
        await storageService.deleteFile(id, user.id, filePath);
        console.log(`[orchestrator] Deleted file: ${filePath}`);
      } catch (error) {
        console.error(`[orchestrator] Failed to delete file ${filePath}:`, error);
      }
    }
    
    console.log(`[orchestrator] Folder ${folderPath} and its contents deleted successfully`);
    res.json({ success: true, message: 'Folder deleted successfully', filesDeleted: filesToDelete.length });
  } catch (error) {
    console.error('Failed to delete folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// Delete file
app.delete('/projects/:id/files/*', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const filePath = req.params[0]; // Get the wildcard parameter

    console.log(`[orchestrator] File delete request for project ${id}, file ${filePath}, user ${user.id}`);

    // Verify project ownership
    const project = await db.getProjectById(id);
    if (!project) {
      console.log(`[orchestrator] Project ${id} not found`);
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.userid !== user.id) {
      console.log(`[orchestrator] Access denied: project.userid=${project.userid}, user.id=${user.id}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log(`[orchestrator] Deleting file for project ${id}, file ${filePath}, user ${user.id}`);
    const storageService = new FileStorageService();
    await storageService.deleteFile(id, user.id, filePath);
    
    console.log(`[orchestrator] File deleted successfully`);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Failed to delete file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Upload file
app.post('/projects/:id/files/upload', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { fileName, content, path } = req.body;

    console.log(`[orchestrator] File upload request for project ${id}, file ${fileName}, user ${user.id}`);

    // Verify project ownership
    const project = await db.getProjectById(id);
    if (!project) {
      console.log(`[orchestrator] Project ${id} not found`);
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.userid !== user.id) {
      console.log(`[orchestrator] Access denied: project.userid=${project.userid}, user.id=${user.id}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    const filePath = path ? `${path}/${fileName}` : fileName;
    console.log(`[orchestrator] Uploading file for project ${id}, file ${filePath}, user ${user.id}`);
    
    const storageService = new FileStorageService();
    await storageService.saveFile(id, user.id, filePath, content);
    
    console.log(`[orchestrator] File uploaded successfully`);
    res.json({ success: true, message: 'File uploaded successfully', filePath });
  } catch (error) {
    console.error('Failed to upload file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// AI Chat endpoints for conversation functionality
app.post('/projects/:id/chat', authenticateUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { message, conversationId, history = [], provider = 'openai', model } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`[orchestrator] AI chat request for project ${id}, user ${user.id}`);
    console.log(`[orchestrator] Conversation history provided: ${history.length} messages`);

    // Verify project ownership
    const project = await db.getProjectById(id);
    if (!project) {
      console.log(`[orchestrator] Project ${id} not found`);
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.userid !== user.id) {
      console.log(`[orchestrator] Access denied: project.userid=${project.userid}, user.id=${user.id}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if AI service is available
    if (!aiService.isAvailable()) {
      return res.status(503).json({ 
        error: 'AI service not available. Please configure API keys.',
        availableProviders: aiService.getAvailableProviders()
      });
    }

    // Get project context for enhanced prompting
    let projectFiles: string[] = [];
    let projectFileContents: { [key: string]: string } = {};
    
    try {
      const storageService = new FileStorageService();
      const fileTree = await storageService.getProjectFileTree(id, user.id);
      
      // Extract file paths from tree structure
      const extractFilePaths = (items: any[]): string[] => {
        let paths: string[] = [];
        for (const item of items) {
          if (item.type === 'file') {
            paths.push(item.path);
          } else if (item.type === 'directory' && item.children) {
            paths.push(...extractFilePaths(item.children));
          }
        }
        return paths;
      };
      
      if (fileTree && Array.isArray(fileTree)) {
        projectFiles = extractFilePaths(fileTree);
      }

      // Get content for important files (package.json, README.md, and other key config files)
      const importantFiles = projectFiles.filter(file => 
        file.match(/\.(json|md|js|ts|tsx|jsx|yaml|yml|toml)$/i) && 
        file.split('/').length <= 2 && // Only root and one level deep
        !file.includes('node_modules') &&
        !file.includes('dist') &&
        !file.includes('build') &&
        !file.includes('pnpm-lock.yaml') // Skip large lock files
      );

      console.log(`[orchestrator] Loading content for ${importantFiles.length} important files:`, importantFiles);

      for (const filePath of importantFiles.slice(0, 5)) { // Limit to 5 files to avoid token limits
        try {
          const fileData = await storageService.getFile(id, user.id, filePath);
          if (fileData && fileData.content && typeof fileData.content === 'string') {
            // Truncate very long files
            const content = fileData.content.length > 2000 
              ? fileData.content.substring(0, 2000) + '\n... (truncated)'
              : fileData.content;
            projectFileContents[filePath] = content;
          }
        } catch (error) {
          console.log(`[orchestrator] Warning: Could not load ${filePath}:`, error);
        }
      }
    } catch (error) {
      console.log(`[orchestrator] Warning: Could not load project files for context:`, error);
    }

    // Build conversation context
    const systemPrompt = aiService.createDevelopmentSystemPrompt({
      name: project.name,
      tech_stack: ['Next.js', 'TypeScript', 'Prisma', 'Supabase'], // Inferred from template
      current_files: projectFiles,
      file_contents: projectFileContents
    });

    console.log(`[orchestrator] System prompt length: ${systemPrompt.length}`);
    console.log(`[orchestrator] Project files found: ${projectFiles.length}`);
    console.log(`[orchestrator] First 200 chars of system prompt:`, systemPrompt.substring(0, 200));

    // Build full conversation with history
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history (limit to last 20 messages to avoid token limits)
    const recentHistory = history.slice(-20);
    for (const msg of recentHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    // Add current message
    messages.push({ role: 'user', content: message.trim() });

    console.log(`[orchestrator] Sending ${messages.length} messages to AI (including ${recentHistory.length} history messages)`);

    // Generate AI response
    const aiResponse = await aiService.generateResponse(messages, { provider, model });

    console.log(`[orchestrator] AI response generated using ${aiResponse.provider}:${aiResponse.model}`);
    
    // Parse AI response for actionable intents
    const actionsParsed = aiService.parseActionsFromResponse(aiResponse.content);
    console.log(`[orchestrator] Actions detected:`, actionsParsed.hasActions ? actionsParsed.actions.length : 0);
    
    let jobId = null;
    if (actionsParsed.hasActions) {
      try {
        // Create AI_ACTION job
        const job = await db.createJob({
          type: 'AI_ACTION',
          prompt: message.trim(),
          projectId: id,
          userId: user.id
        });
        
        jobId = job.id;
        console.log(`[orchestrator] Created AI_ACTION job ${jobId} with ${actionsParsed.actions.length} actions`);
        
        // Add job to queue with action metadata
        await jobQueue.add('codegen-jobs', {
          jobId: job.id,
          projectId: id,
          userId: user.id,
          type: 'AI_ACTION',
          prompt: message.trim(),
          metadata: {
            actions: actionsParsed.actions,
            aiResponse: aiResponse.content
          }
        });
        
        console.log(`[orchestrator] AI_ACTION job ${jobId} added to queue`);
      } catch (error) {
        console.error(`[orchestrator] Failed to create AI_ACTION job:`, error);
      }
    }
    
    res.json({
      response: aiResponse.content,
      provider: aiResponse.provider,
      model: aiResponse.model,
      usage: aiResponse.usage,
      actions: actionsParsed.hasActions ? {
        detected: actionsParsed.actions.length,
        jobId: jobId
      } : undefined
    });

  } catch (error) {
    console.error('Failed to generate AI response:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI response', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Health check for AI services
app.get('/ai/health', (req, res) => {
  res.json({
    available: aiService.isAvailable(),
    providers: aiService.getAvailableProviders(),
    status: 'ok'
  });
});

// Start server
app.listen(port, () => {
  console.log(`[orchestrator] listening on http://localhost:${port}`);
});
