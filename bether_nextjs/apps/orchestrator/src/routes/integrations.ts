import express from 'express';
import { GitHubService, githubService } from '../github-service';
import { VercelService, vercelService } from '../services/vercel-service';
import { DeploymentOrchestrator, deploymentOrchestrator } from '../services/deployment-orchestrator';
import { DeploymentAction } from '@mvp/shared';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Debug middleware - log ALL requests to integration routes
router.use((req, res, next) => {
  console.log('[Integrations Router] Request received:', req.method, req.path);
  next();
});

// Create Supabase service client
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_key';
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Middleware to authenticate user and get userId - using same logic as main orchestrator
 */
async function authenticateUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  
  console.log('[integrations] Auth middleware - headers:', req.headers.authorization ? 'present' : 'missing');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[integrations] Auth middleware - invalid header format');
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  console.log('[integrations] Auth middleware - token length:', token.length);

  try {
    console.log('[integrations] Auth middleware - verifying token...');
    const { data: { user }, error } = await supabaseService.auth.getUser(token);

    if (error || !user) {
      console.log('[integrations] Auth middleware - token validation failed:', error?.message);
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('[integrations] Auth middleware - token validated for user:', user.id);
    (req as any).userId = user.id;
    next();
  } catch (error) {
    console.error('[integrations] Auth middleware - error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware to validate project ownership
 */
async function validateProjectOwnership(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const projectId = req.params.id;
    const userId = (req as any).userId;

    const { data: project, error } = await supabaseService
      .from('projects')
      .select('userid')
      .eq('id', projectId)
      .single();

    console.log('[Auth] Project validation - projectId:', projectId, 'userId:', userId);
    console.log('[Auth] Project query result:', { project, error });

    if (error || !project || project.userid !== userId) {
      console.log('[Auth] Project validation failed:', { 
        error: error?.message, 
        projectExists: !!project, 
        projectUserid: project?.userid,
        requestUserId: userId 
      });
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    next();
  } catch (error) {
    console.error('[Auth] Project validation error:', error);
    res.status(500).json({ error: 'Project validation failed' });
  }
}

// Test route to debug routing
router.get('/test', (req, res) => {
  console.log('[Integrations] TEST ROUTE HIT - NO AUTH');
  res.json({ message: 'Integration routes working without auth', timestamp: new Date().toISOString() });
});

// Skip integration-specific auth middleware for now - let main orchestrator handle auth
// router.use(authenticateUser);
// Temporarily disable project validation to debug routing
// router.use('/projects/:id/*', validateProjectOwnership);

/**
 * GET /api/integrations/projects/:id/status
 * Get integration status for a project
 */
router.get('/projects/:id/status', async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = (req as any).userId;

    // Get project integration settings
    const { data: integration } = await supabaseService
      .from('project_integrations')
      .select('*')
      .eq('projectId', projectId)
      .single();

    // Get GitHub integration status
    const githubIntegration = await githubService.getUserIntegration(userId);
    
    // Get project GitHub connection
    const { data: project } = await supabaseService
      .from('projects')
      .select('github_repo_url, github_repo_id')
      .eq('id', projectId)
      .single();

    const response = {
      github: {
        connected: !!githubIntegration,
        projectLinked: !!project?.github_repo_url,
        repoUrl: project?.github_repo_url
      },
      vercel: {
        connected: integration?.vercelEnabled || false,
        projectId: integration?.vercelProjectId,
        domain: integration?.vercelDomain
      },
      deploymentMode: integration?.deploymentMode || 'GITHUB_ONLY'
    };

    res.json(response);
  } catch (error) {
    console.error('[Integrations] Get status error:', error);
    res.status(500).json({ error: 'Failed to get integration status' });
  }
});

/**
 * POST /api/integrations/projects/:id/github
 * Connect project to GitHub repository
 */
router.post('/projects/:id/github', async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = (req as any).userId;
    const { repoUrl, repoId } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    // Connect project to repository
    await githubService.connectProjectToRepo(projectId, repoUrl, repoId);

    res.json({ success: true, message: 'Project connected to GitHub repository' });
  } catch (error) {
    console.error('[Integrations] GitHub connection error:', error);
    res.status(500).json({ error: 'Failed to connect to GitHub repository' });
  }
});

/**
 * POST /projects/:id/integrations/vercel
 * Connect project to Vercel
 */
router.post('/projects/:id/vercel', async (req, res) => {
  try {
    const projectId = req.params.id;
    const { vercelProjectId, vercelTeamId, accessToken, domain } = req.body;

    if (!vercelProjectId || !accessToken) {
      return res.status(400).json({ error: 'Vercel project ID and access token are required' });
    }

    // Test Vercel connection
    const isValid = await vercelService.testConnection(accessToken);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid Vercel access token' });
    }

    // Save Vercel integration
    await vercelService.saveProjectIntegration(
      projectId,
      vercelProjectId,
      accessToken,
      vercelTeamId,
      domain
    );

    // Link to GitHub if project has GitHub connection
    const { data: project } = await supabaseService
      .from('projects')
      .select('github_repo_url')
      .eq('id', projectId)
      .single();

    if (project?.github_repo_url) {
      try {
        await vercelService.linkToGitHub(
          accessToken,
          vercelProjectId,
          project.github_repo_url,
          vercelTeamId
        );
      } catch (error) {
        console.warn('[Integrations] GitHub linking failed:', error);
        // Continue even if GitHub linking fails
      }
    }

    res.json({ success: true, message: 'Project connected to Vercel' });
  } catch (error) {
    console.error('[Integrations] Vercel connection error:', error);
    res.status(500).json({ error: 'Failed to connect to Vercel' });
  }
});

/**
 * GET /projects/:id/deployment-options
 * Get available deployment options for a project
 */
router.get('/projects/:id/deployment-options', async (req, res) => {
  try {
    console.log('[Integrations] GET /projects/:id/deployment-options - START');
    const projectId = req.params.id;
    const userId = (req as any).userId;

    console.log('[Integrations] Project ID:', projectId);
    console.log('[Integrations] User ID:', userId);
    
    // For now, return a simple strategy to test the connection
    const mockStrategy = {
      type: 'GITHUB_ONLY',
      target: 'main'
    };
    
    console.log('[Integrations] Returning mock strategy:', mockStrategy);
    res.json(mockStrategy);
  } catch (error) {
    console.error('[Integrations] Get deployment options error:', error);
    res.status(500).json({ error: 'Failed to get deployment options', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /projects/:id/deploy
 * Execute deployment
 */
router.post('/projects/:id/deploy', async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = (req as any).userId;
    const { type, commitMessage, branch, mergeToMain } = req.body;

    if (!type || !commitMessage) {
      return res.status(400).json({ error: 'Deployment type and commit message are required' });
    }

    const action: DeploymentAction = {
      type,
      commitMessage,
      branch,
      mergeToMain
    };

    const result = await deploymentOrchestrator.executeDeployment(projectId, action, userId);
    
    res.json(result);
  } catch (error) {
    console.error('[Integrations] Deployment error:', error);
    res.status(500).json({ error: 'Deployment failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /projects/:id/deployments
 * Get deployment history for a project
 */
router.get('/projects/:id/deployments', async (req, res) => {
  try {
    const projectId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 10;

    const { data: deployments, error } = await supabaseService
      .from('deployment_history')
      .select('*')
      .eq('projectId', projectId)
      .order('createdAt', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    res.json(deployments || []);
  } catch (error) {
    console.error('[Integrations] Get deployments error:', error);
    res.status(500).json({ error: 'Failed to get deployment history' });
  }
});

/**
 * GET /vercel/projects
 * Get user's Vercel projects (for setup)
 */
router.get('/vercel/projects', async (req, res) => {
  try {
    const accessToken = req.headers['x-vercel-token'] as string;
    const teamId = req.query.teamId as string;

    if (!accessToken) {
      return res.status(400).json({ error: 'Vercel access token required' });
    }

    const projects = await vercelService.getProjects(accessToken, teamId);
    
    res.json(projects);
  } catch (error) {
    console.error('[Integrations] Get Vercel projects error:', error);
    res.status(500).json({ error: 'Failed to get Vercel projects' });
  }
});

/**
 * GET /vercel/teams
 * Get user's Vercel teams (for setup)
 */
router.get('/vercel/teams', async (req, res) => {
  try {
    const accessToken = req.headers['x-vercel-token'] as string;

    if (!accessToken) {
      return res.status(400).json({ error: 'Vercel access token required' });
    }

    const teams = await vercelService.getTeams(accessToken);
    
    res.json(teams);
  } catch (error) {
    console.error('[Integrations] Get Vercel teams error:', error);
    res.status(500).json({ error: 'Failed to get Vercel teams' });
  }
});

/**
 * DELETE /projects/:id/integrations/vercel
 * Disconnect Vercel integration
 */
router.delete('/projects/:id/vercel', async (req, res) => {
  try {
    const projectId = req.params.id;

    const { error } = await supabaseService
      .from('project_integrations')
      .update({
        vercelEnabled: false,
        vercelProjectId: null,
        vercelTeamId: null,
        vercelAccessToken: null,
        vercelDomain: null,
        deploymentMode: 'GITHUB_ONLY',
        updatedAt: new Date().toISOString()
      })
      .eq('projectId', projectId);

    if (error) {
      throw error;
    }

    res.json({ success: true, message: 'Vercel integration disconnected' });
  } catch (error) {
    console.error('[Integrations] Vercel disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Vercel integration' });
  }
});

export default router;