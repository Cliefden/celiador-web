import { GitHubService } from '../github-service';
import { VercelService } from './vercel-service';
import { FileStorageService } from '@mvp/shared';
import { DeploymentAction, DeploymentHistory, ProjectIntegration } from '@mvp/shared';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

// Create Supabase service client
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_key';
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

export interface DeploymentStrategy {
  type: 'GITHUB_ONLY' | 'SMART_BRANCHING';
  target?: string;
  options?: string[];
}

export interface DeploymentResult {
  success: boolean;
  deploymentId: string;
  urls: {
    github?: string;
    vercel?: string;
    preview?: string;
  };
  branch?: string;
  commitSha?: string;
  error?: string;
}

export class DeploymentOrchestrator {
  constructor(
    private githubService: GitHubService,
    private vercelService: VercelService,
    private storageService: FileStorageService
  ) {}

  /**
   * Determine deployment strategy based on project integrations
   */
  async determineDeploymentStrategy(projectId: string): Promise<DeploymentStrategy> {
    const integration = await this.getProjectIntegration(projectId);
    
    if (!integration || !integration.githubEnabled) {
      throw new Error('GitHub integration required for deployment');
    }
    
    if (!integration.vercelEnabled) {
      return { 
        type: 'GITHUB_ONLY', 
        target: integration.githubDefaultBranch || 'main' 
      };
    }
    
    return { 
      type: 'SMART_BRANCHING', 
      options: ['github', 'vercel', 'preview'] 
    };
  }

  /**
   * Execute deployment based on action type
   */
  async executeDeployment(
    projectId: string, 
    action: DeploymentAction,
    userId: string
  ): Promise<DeploymentResult> {
    const deploymentId = this.generateDeploymentId();
    
    try {
      // Create deployment history record
      await this.recordDeploymentStart(projectId, action.type, deploymentId);
      
      let result: DeploymentResult;
      
      switch (action.type) {
        case 'GITHUB_PUSH':
          result = await this.executeGitHubPush(projectId, action, userId, deploymentId);
          break;
        case 'VERCEL_DEPLOY':
          result = await this.executeVercelDeploy(projectId, action, userId, deploymentId);
          break;
        case 'PREVIEW_DEPLOY':
          result = await this.executePreviewDeploy(projectId, action, userId, deploymentId);
          break;
        default:
          throw new Error(`Unknown deployment action: ${action.type}`);
      }
      
      // Update deployment history with result
      await this.recordDeploymentComplete(deploymentId, result);
      
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.recordDeploymentError(deploymentId, errorMessage);
      
      return {
        success: false,
        deploymentId,
        urls: {},
        error: errorMessage
      };
    }
  }

  /**
   * Execute GitHub-only push (to main or feature branch)
   */
  private async executeGitHubPush(
    projectId: string,
    action: DeploymentAction,
    userId: string,
    deploymentId: string
  ): Promise<DeploymentResult> {
    const integration = await this.getProjectIntegration(projectId);
    if (!integration) throw new Error('No integration found');

    // Get GitHub access token
    const githubIntegration = await this.githubService.getUserIntegration(userId);
    if (!githubIntegration) throw new Error('GitHub access token not found');

    // Get project info
    const project = await this.getProject(projectId);
    if (!project.github_repo_url) throw new Error('Project not connected to GitHub');

    // Sync files and push
    const tempDir = await this.syncProjectFiles(projectId, userId);
    
    try {
      const branch = action.branch || integration.githubDefaultBranch || 'main';
      const commitSha = await this.pushToGitHub(
        tempDir, 
        project.github_repo_url,
        githubIntegration.accesstoken,
        branch,
        action.commitMessage
      );

      return {
        success: true,
        deploymentId,
        urls: {
          github: `${project.github_repo_url}/commit/${commitSha}`
        },
        branch,
        commitSha
      };
    } finally {
      // Cleanup temp directory
      await this.cleanupTempDir(tempDir);
    }
  }

  /**
   * Execute Vercel deployment (push to main + deploy)
   */
  private async executeVercelDeploy(
    projectId: string,
    action: DeploymentAction,
    userId: string,
    deploymentId: string
  ): Promise<DeploymentResult> {
    const integration = await this.getProjectIntegration(projectId);
    if (!integration || !integration.vercelEnabled) {
      throw new Error('Vercel integration not found');
    }

    // First push to GitHub main branch
    const githubResult = await this.executeGitHubPush(
      projectId, 
      { ...action, branch: integration.githubDefaultBranch || 'main' },
      userId,
      deploymentId
    );

    if (!githubResult.success) {
      throw new Error(`GitHub push failed: ${githubResult.error}`);
    }

    // Then trigger Vercel deployment
    const vercelDeployment = await this.vercelService.createDeployment(
      integration.vercelAccessToken!,
      integration.vercelProjectId!,
      {
        gitSource: {
          type: 'github',
          repo: this.extractRepoFromUrl(await this.getProject(projectId).then(p => p.github_repo_url!)),
          ref: integration.githubDefaultBranch || 'main'
        },
        teamId: integration.vercelTeamId,
        target: 'production'
      }
    );

    return {
      success: true,
      deploymentId,
      urls: {
        github: githubResult.urls.github,
        vercel: `https://${vercelDeployment.url}`
      },
      branch: githubResult.branch,
      commitSha: githubResult.commitSha
    };
  }

  /**
   * Execute preview deployment (feature branch + preview)
   */
  private async executePreviewDeploy(
    projectId: string,
    action: DeploymentAction,
    userId: string,
    deploymentId: string
  ): Promise<DeploymentResult> {
    const integration = await this.getProjectIntegration(projectId);
    if (!integration || !integration.vercelEnabled) {
      throw new Error('Vercel integration not found');
    }

    // Generate feature branch name
    const branchName = action.branch || this.generateBranchName();

    // Push to feature branch
    const githubResult = await this.executeGitHubPush(
      projectId,
      { ...action, branch: branchName },
      userId,
      deploymentId
    );

    if (!githubResult.success) {
      throw new Error(`GitHub push failed: ${githubResult.error}`);
    }

    // Create preview deployment
    const vercelDeployment = await this.vercelService.createDeployment(
      integration.vercelAccessToken!,
      integration.vercelProjectId!,
      {
        gitSource: {
          type: 'github',
          repo: this.extractRepoFromUrl(await this.getProject(projectId).then(p => p.github_repo_url!)),
          ref: branchName
        },
        teamId: integration.vercelTeamId,
        target: 'preview'
      }
    );

    return {
      success: true,
      deploymentId,
      urls: {
        github: githubResult.urls.github,
        preview: `https://${vercelDeployment.url}`
      },
      branch: branchName,
      commitSha: githubResult.commitSha
    };
  }

  /**
   * Sync project files from Supabase Storage to temp directory
   */
  private async syncProjectFiles(projectId: string, userId: string): Promise<string> {
    const tempDir = path.join('/tmp', `project-${projectId}-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // Get all project files from storage
    const fileTree = await this.storageService.getProjectFileTree(projectId, userId);
    
    // Create files in temp directory
    await this.createFilesFromTree(tempDir, fileTree);

    return tempDir;
  }

  /**
   * Create files in temp directory from file tree
   */
  private async createFilesFromTree(baseDir: string, tree: any[]): Promise<void> {
    for (const item of tree) {
      if (item.type === 'file') {
        const filePath = path.join(baseDir, item.path);
        const dir = path.dirname(filePath);
        
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(filePath, item.content || '');
      } else if (item.type === 'folder' && item.children) {
        await this.createFilesFromTree(baseDir, item.children);
      }
    }
  }

  /**
   * Push files to GitHub using git commands
   */
  private async pushToGitHub(
    projectDir: string,
    repoUrl: string,
    accessToken: string,
    branch: string,
    commitMessage: string
  ): Promise<string> {
    const authRepoUrl = repoUrl.replace('https://github.com/', `https://${accessToken}@github.com/`);

    try {
      // Initialize git repo if needed
      await execAsync('git init', { cwd: projectDir });
      await execAsync(`git remote add origin ${authRepoUrl}`, { cwd: projectDir });
      
      // Configure git user
      await execAsync('git config user.name "Celiador Bot"', { cwd: projectDir });
      await execAsync('git config user.email "bot@celiador.ai"', { cwd: projectDir });
      
      // Add all files
      await execAsync('git add .', { cwd: projectDir });
      
      // Commit
      await execAsync(`git commit -m "${commitMessage}"`, { cwd: projectDir });
      
      // Push to branch
      await execAsync(`git push origin HEAD:${branch}`, { cwd: projectDir });
      
      // Get commit SHA
      const { stdout } = await execAsync('git rev-parse HEAD', { cwd: projectDir });
      return stdout.trim();
      
    } catch (error) {
      console.error('[Deployment] Git operation failed:', error);
      throw new Error('Failed to push to GitHub');
    }
  }

  /**
   * Helper methods
   */
  private generateDeploymentId(): string {
    return `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBranchName(): string {
    return `feature/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractRepoFromUrl(repoUrl: string): string {
    const match = repoUrl.match(/github\.com[/:]([\w-]+\/[\w-]+)/);
    return match ? match[1] : '';
  }

  private async cleanupTempDir(tempDir: string): Promise<void> {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('[Deployment] Failed to cleanup temp directory:', error);
    }
  }

  /**
   * Database operations
   */
  private async getProjectIntegration(projectId: string): Promise<ProjectIntegration | null> {
    const { data, error } = await supabaseService
      .from('project_integrations')
      .select('*')
      .eq('projectId', projectId)
      .single();

    if (error || !data) return null;
    return data as ProjectIntegration;
  }

  private async getProject(projectId: string) {
    const { data, error } = await supabaseService
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error || !data) throw new Error('Project not found');
    return data;
  }

  private async recordDeploymentStart(
    projectId: string, 
    type: 'GITHUB_PUSH' | 'VERCEL_DEPLOY' | 'PREVIEW_DEPLOY',
    deploymentId: string
  ): Promise<void> {
    await supabaseService
      .from('deployment_history')
      .insert({
        id: deploymentId,
        projectId,
        type,
        status: 'PENDING'
      });
  }

  private async recordDeploymentComplete(
    deploymentId: string, 
    result: DeploymentResult
  ): Promise<void> {
    await supabaseService
      .from('deployment_history')
      .update({
        status: result.success ? 'SUCCESS' : 'FAILED',
        branch: result.branch,
        commitSha: result.commitSha,
        vercelUrl: result.urls.vercel || result.urls.preview,
        metadata: {
          urls: result.urls,
          error: result.error
        }
      })
      .eq('id', deploymentId);
  }

  private async recordDeploymentError(deploymentId: string, error: string): Promise<void> {
    await supabaseService
      .from('deployment_history')
      .update({
        status: 'FAILED',
        metadata: { error }
      })
      .eq('id', deploymentId);
  }
}

export const deploymentOrchestrator = new DeploymentOrchestrator(
  new GitHubService(),
  new VercelService(),
  new FileStorageService()
);