import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

// Create Supabase service client
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_key';
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

export interface VercelProject {
  id: string;
  name: string;
  framework: string;
  link?: {
    type: string;
    repo: string;
    repoId: number;
    org: string;
  };
  targets?: {
    production?: {
      domain: string;
    };
  };
}

export interface VercelDeployment {
  id: string;
  url: string;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  type: 'LAMBDAS';
  creator: {
    uid: string;
  };
  meta?: {
    githubCommitSha?: string;
    githubCommitRef?: string;
  };
}

export interface VercelTeam {
  id: string;
  slug: string;
  name: string;
}

export class VercelService {
  private baseUrl = 'https://api.vercel.com';

  constructor(private accessToken?: string) {}

  /**
   * Get user's teams
   */
  async getTeams(accessToken: string): Promise<VercelTeam[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/v2/teams`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.teams || [];
    } catch (error) {
      console.error('[Vercel] Failed to get teams:', error);
      throw new Error('Failed to get Vercel teams');
    }
  }

  /**
   * Get user's projects
   */
  async getProjects(accessToken: string, teamId?: string): Promise<VercelProject[]> {
    try {
      const url = teamId 
        ? `${this.baseUrl}/v9/projects?teamId=${teamId}`
        : `${this.baseUrl}/v9/projects`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.projects || [];
    } catch (error) {
      console.error('[Vercel] Failed to get projects:', error);
      throw new Error('Failed to get Vercel projects');
    }
  }

  /**
   * Get project details
   */
  async getProject(accessToken: string, projectId: string, teamId?: string): Promise<VercelProject> {
    try {
      const url = teamId 
        ? `${this.baseUrl}/v9/projects/${projectId}?teamId=${teamId}`
        : `${this.baseUrl}/v9/projects/${projectId}`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('[Vercel] Failed to get project:', error);
      throw new Error('Failed to get Vercel project');
    }
  }

  /**
   * Create deployment from GitHub
   */
  async createDeployment(
    accessToken: string, 
    projectId: string, 
    options: {
      gitSource?: {
        type: 'github';
        repo: string;
        ref: string; // branch name or commit SHA
      };
      teamId?: string;
      target?: 'production' | 'preview';
    }
  ): Promise<VercelDeployment> {
    try {
      const url = options.teamId 
        ? `${this.baseUrl}/v13/deployments?teamId=${options.teamId}`
        : `${this.baseUrl}/v13/deployments`;

      const payload: any = {
        name: projectId,
        target: options.target || 'preview'
      };

      if (options.gitSource) {
        payload.gitSource = options.gitSource;
      }

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('[Vercel] Failed to create deployment:', error);
      throw new Error('Failed to create Vercel deployment');
    }
  }

  /**
   * Get deployment status
   */
  async getDeployment(
    accessToken: string, 
    deploymentId: string, 
    teamId?: string
  ): Promise<VercelDeployment> {
    try {
      const url = teamId 
        ? `${this.baseUrl}/v13/deployments/${deploymentId}?teamId=${teamId}`
        : `${this.baseUrl}/v13/deployments/${deploymentId}`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('[Vercel] Failed to get deployment:', error);
      throw new Error('Failed to get Vercel deployment');
    }
  }

  /**
   * Link project to GitHub repository
   */
  async linkToGitHub(
    accessToken: string,
    projectId: string,
    repoUrl: string,
    teamId?: string
  ): Promise<void> {
    try {
      // Extract owner/repo from URL
      const repoMatch = repoUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);
      if (!repoMatch) {
        throw new Error('Invalid GitHub repository URL');
      }

      const [, owner, repo] = repoMatch;
      const url = teamId 
        ? `${this.baseUrl}/v9/projects/${projectId}?teamId=${teamId}`
        : `${this.baseUrl}/v9/projects/${projectId}`;

      await axios.patch(url, {
        link: {
          type: 'github',
          repo: `${owner}/${repo}`
        }
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`[Vercel] Linked project ${projectId} to ${owner}/${repo}`);
    } catch (error) {
      console.error('[Vercel] Failed to link to GitHub:', error);
      throw new Error('Failed to link Vercel project to GitHub');
    }
  }

  /**
   * Test API connection
   */
  async testConnection(accessToken: string): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/v2/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      return true;
    } catch (error) {
      console.error('[Vercel] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Save Vercel integration for project
   */
  async saveProjectIntegration(
    projectId: string,
    vercelProjectId: string,
    accessToken: string,
    teamId?: string,
    domain?: string
  ): Promise<void> {
    try {
      const { error } = await supabaseService
        .from('project_integrations')
        .upsert({
          projectId,
          vercelEnabled: true,
          vercelProjectId,
          vercelTeamId: teamId,
          vercelAccessToken: accessToken, // TODO: Encrypt in production
          vercelDomain: domain,
          deploymentMode: 'SMART_BRANCHING', // Enable smart branching when Vercel is connected
          updatedAt: new Date().toISOString()
        }, {
          onConflict: 'projectId'
        });

      if (error) {
        console.error('[Vercel] Failed to save integration:', error);
        throw new Error('Failed to save Vercel integration');
      }

      console.log(`[Vercel] Saved integration for project ${projectId}`);
    } catch (error) {
      console.error('[Vercel] Error saving integration:', error);
      throw error;
    }
  }

  /**
   * Get project integration
   */
  async getProjectIntegration(projectId: string): Promise<{
    vercelEnabled: boolean;
    vercelProjectId?: string;
    vercelTeamId?: string;
    vercelAccessToken?: string;
    vercelDomain?: string;
    deploymentMode: 'GITHUB_ONLY' | 'SMART_BRANCHING';
  } | null> {
    try {
      const { data, error } = await supabaseService
        .from('project_integrations')
        .select('vercelEnabled, vercelProjectId, vercelTeamId, vercelAccessToken, vercelDomain, deploymentMode')
        .eq('projectId', projectId)
        .eq('deletedAt', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No integration found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[Vercel] Error getting integration:', error);
      return null;
    }
  }
}

export const vercelService = new VercelService();