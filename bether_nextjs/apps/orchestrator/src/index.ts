
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { Queue } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

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
      .order('createdat', { ascending: false });
    
    if (error) {
      console.error('Supabase error getting projects:', error);
      throw error;
    }
    
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
    const { data, error: updateError } = await supabaseService
      .from('jobs')
      .update({
        status,
        output,
        error,
        metadata
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Supabase error updating job:', updateError);
      throw updateError;
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

// Redis connection
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Job queue
const jobQueue = new Queue('codegen-jobs', {
  connection: { url: redisUrl }
});

// Supabase authentication middleware
const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  
  try {
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Add user to request
    (req as any).user = user as any;
    next();
  } catch (error) {
    console.error('Auth error:', error);
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
    const user = (req as any).user;
    const projects = await db.getProjectsByUserId((user as any).id);
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
      type,
      prompt,
      projectDir: `../../projects/${id}`
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

// Start server
app.listen(port, () => {
  console.log(`[orchestrator] listening on http://localhost:${port}`);
});
