import { Octokit } from '@octokit/rest';
import { OAuthApp } from '@octokit/oauth-app';
import { createClient } from '@supabase/supabase-js';

// Create Supabase service client
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_key';
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string;
  email: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  private: boolean;
}

export class GitHubService {
  private oauthApp: OAuthApp;

  constructor() {
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
      throw new Error('GitHub OAuth credentials not configured');
    }

    this.oauthApp = new OAuthApp({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    });
  }

  /**
   * Get GitHub OAuth authorization URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID!,
      scope: 'repo user:email',
      state: state || '',
      redirect_uri: process.env.GITHUB_REDIRECT_URI!,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange OAuth code for access token
   */
  async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const { authentication } = await this.oauthApp.createToken({
        code,
      });

      return authentication.token;
    } catch (error) {
      console.error('[GitHub] Token exchange failed:', error);
      throw new Error('Failed to exchange code for token');
    }
  }

  /**
   * Get authenticated user info
   */
  async getAuthenticatedUser(accessToken: string): Promise<GitHubUser> {
    const octokit = new Octokit({ auth: accessToken });

    try {
      const { data } = await octokit.rest.users.getAuthenticated();
      return {
        login: data.login,
        id: data.id,
        avatar_url: data.avatar_url,
        html_url: data.html_url,
        name: data.name || data.login,
        email: data.email || '',
      };
    } catch (error) {
      console.error('[GitHub] Failed to get user info:', error);
      throw new Error('Failed to get GitHub user information');
    }
  }

  /**
   * Create a new repository
   */
  async createRepository(
    accessToken: string,
    name: string,
    description?: string,
    isPrivate = false
  ): Promise<GitHubRepo> {
    const octokit = new Octokit({ auth: accessToken });

    try {
      const { data } = await octokit.rest.repos.createForAuthenticatedUser({
        name,
        description: description || `Generated project: ${name}`,
        private: isPrivate,
        auto_init: false, // We'll push files ourselves
      });

      return {
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        html_url: data.html_url,
        clone_url: data.clone_url,
        ssh_url: data.ssh_url,
        private: data.private,
      };
    } catch (error) {
      console.error('[GitHub] Failed to create repository:', error);
      throw new Error('Failed to create GitHub repository');
    }
  }

  /**
   * Push files to repository
   */
  async pushFilesToRepo(
    accessToken: string,
    repoFullName: string,
    files: { path: string; content: string }[],
    commitMessage = 'Initial commit from Bether Studio'
  ): Promise<void> {
    const octokit = new Octokit({ auth: accessToken });
    const [owner, repo] = repoFullName.split('/');

    try {
      // Get the default branch
      const { data: repoInfo } = await octokit.rest.repos.get({
        owner,
        repo,
      });
      const defaultBranch = repoInfo.default_branch;

      // Create blobs for all files
      const blobs = await Promise.all(
        files.map(async (file) => {
          const { data } = await octokit.rest.git.createBlob({
            owner,
            repo,
            content: Buffer.from(file.content).toString('base64'),
            encoding: 'base64',
          });
          return {
            path: file.path,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: data.sha,
          };
        })
      );

      // Create tree
      const { data: tree } = await octokit.rest.git.createTree({
        owner,
        repo,
        tree: blobs,
      });

      // Create commit
      const { data: commit } = await octokit.rest.git.createCommit({
        owner,
        repo,
        message: commitMessage,
        tree: tree.sha,
        parents: [], // Initial commit has no parents
      });

      // Update the default branch reference
      await octokit.rest.git.updateRef({
        owner,
        repo,
        ref: `heads/${defaultBranch}`,
        sha: commit.sha,
      });

      console.log(`[GitHub] Successfully pushed ${files.length} files to ${repoFullName}`);
    } catch (error) {
      console.error('[GitHub] Failed to push files:', error);
      throw new Error('Failed to push files to GitHub repository');
    }
  }

  /**
   * Save GitHub integration for user
   */
  async saveUserIntegration(
    userId: string,
    accessToken: string,
    githubUser: GitHubUser
  ): Promise<void> {
    try {
      const { error } = await supabaseService.supabase
        .from('github_integrations')
        .upsert({
          userid: userId,
          accesstoken: accessToken, // In production, this should be encrypted
          scope: ['repo', 'user:email'],
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        }, {
          onConflict: 'userid'
        });

      if (error) {
        console.error('[GitHub] Failed to save integration:', error);
        throw new Error('Failed to save GitHub integration');
      }

      console.log(`[GitHub] Saved integration for user ${userId} (${githubUser.login})`);
    } catch (error) {
      console.error('[GitHub] Error saving integration:', error);
      throw error;
    }
  }

  /**
   * Get user's GitHub integration
   */
  async getUserIntegration(userId: string): Promise<{ accesstoken: string } | null> {
    try {
      const { data, error } = await supabaseService.supabase
        .from('github_integrations')
        .select('accesstoken')
        .eq('userid', userId)
        .eq('deletedat', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No integration found
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('[GitHub] Error getting integration:', error);
      return null;
    }
  }

  /**
   * Connect project to GitHub repository
   */
  async connectProjectToRepo(
    projectId: string,
    repoUrl: string,
    repoId: number
  ): Promise<void> {
    try {
      const { error } = await supabaseService.supabase
        .from('projects')
        .update({
          repoprovider: 'github',
          github_repo_url: repoUrl,
          github_repo_id: repoId,
          github_connected_at: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (error) {
        console.error('[GitHub] Failed to connect project to repo:', error);
        throw new Error('Failed to connect project to GitHub repository');
      }

      console.log(`[GitHub] Connected project ${projectId} to repository ${repoUrl}`);
    } catch (error) {
      console.error('[GitHub] Error connecting project:', error);
      throw error;
    }
  }
}

export const githubService = new GitHubService();