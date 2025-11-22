import { supabase } from './supabase';

export class ApiClient {
  private static baseUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';

  // Debug method to log configuration
  static logConfig() {
    console.log('[ApiClient] Configuration:');
    console.log('  Base URL:', this.baseUrl);
    console.log('  Environment NEXT_PUBLIC_ORCHESTRATOR_URL:', process.env.NEXT_PUBLIC_ORCHESTRATOR_URL);
  }

  private static async getAuthHeaders() {
    let { data: { session }, error } = await supabase.auth.getSession();
    
    // Check if session is expired or invalid
    const now = Math.floor(Date.now() / 1000);
    const isExpired = session?.expires_at && session.expires_at < now;
    
    if (!session || error || isExpired) {
      console.log('[ApiClient] Session expired or invalid, attempting refresh...');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        throw new Error('No authentication session available and refresh failed');
      }
      
      session = refreshData.session;
      console.log('[ApiClient] Token refreshed successfully');
    }
    
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
  }

  // Preview API methods
  static async startPreview(projectId: string, options: { name?: string; type?: string } = {}) {
    const url = `${this.baseUrl}/projects/${projectId}/preview/start`;
    console.log('[ApiClient] Starting preview for project:', projectId, 'URL:', url);
    
    try {
      const headers = await this.getAuthHeaders();
      console.log('[ApiClient] Auth headers obtained, making request...');
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: options.name || 'Project Preview',
          type: options.type || 'nextjs'
        })
      });

      console.log('[ApiClient] Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          console.error('[ApiClient] Failed to parse error response:', e);
        }
        console.error('[ApiClient] Preview start failed:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('[ApiClient] Preview started successfully:', result);
      return result;
    } catch (error) {
      console.error('[ApiClient] Network or other error starting preview:', error);
      throw error;
    }
  }

  static async stopPreview(projectId: string, previewId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/preview/${previewId}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to stop preview');
    }

    return response.json();
  }

  static async getPreviewStatus(projectId: string, previewId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/preview/${previewId}/status`, {
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get preview status');
    }

    return response.json();
  }

  static async listPreviews(projectId: string) {
    const url = `${this.baseUrl}/projects/${projectId}/preview/list`;
    console.log('[ApiClient] Listing previews for project:', projectId, 'URL:', url);
    
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(url, {
        headers
      });

      console.log('[ApiClient] List previews response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          console.error('[ApiClient] Failed to parse list previews error response:', e);
        }
        console.error('[ApiClient] List previews failed:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('[ApiClient] List previews successful:', result);
      return result;
    } catch (error) {
      console.error('[ApiClient] Network or other error listing previews:', error);
      throw error;
    }
  }

  // File upload method
  static async uploadFile(projectId: string, fileName: string, content: string, path?: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/files/upload`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fileName,
        content,
        path
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload file');
    }

    return response.json();
  }

  // Project methods
  static async getProjects() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/projects`, {
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch projects');
    }

    return response.json();
  }

  static async getProject(projectId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch project');
    }

    return response.json();
  }

  static async createProject(projectData: any) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify(projectData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create project');
    }

    return response.json();
  }

  static async deleteProject(projectId: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/projects/${projectId}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete project');
    }

    return response.json();
  }

  // Job methods
  static async getJobs(projectId: string, type?: string, status?: string) {
    const headers = await this.getAuthHeaders();
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    
    const queryString = params.toString();
    const url = `${this.baseUrl}/projects/${projectId}/jobs${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch jobs');
    }

    return response.json();
  }

  static async createJob(projectId: string, jobData: { type: string; prompt: string }) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/jobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(jobData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create job');
    }

    return response.json();
  }

  // Utility method to get base URL
  static getBaseUrl() {
    return this.baseUrl;
  }

  // Generic authenticated fetch method with retry logic
  static async authenticatedFetch(endpoint: string, options: RequestInit = {}) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers
        }
      });

      // If not a 401 error, handle normally
      if (response.status !== 401) {
        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(error.error || `Request failed with status ${response.status}`);
        }
        return response.json();
      }

      // Handle 401 error with retry
      console.log('[ApiClient] 401 error, attempting token refresh...');
      
      // Force refresh session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshData.session) {
        throw new Error('Authentication failed - unable to refresh token');
      }

      console.log('[ApiClient] Token refreshed, retrying request...');
      
      // Retry with fresh token
      const retryHeaders = {
        ...headers,
        'Authorization': `Bearer ${refreshData.session.access_token}`,
        ...options.headers
      };
      
      const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: retryHeaders
      });

      if (retryResponse.status === 401) {
        throw new Error('Authentication failed even after token refresh - user may need to sign in again');
      }

      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `Request failed with status ${retryResponse.status}`);
      }

      return retryResponse.json();

    } catch (error) {
      console.error('[ApiClient] Request failed:', error);
      throw error;
    }
  }
}