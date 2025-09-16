import { supabase } from './supabase';

export class ApiClient {
  private static baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  private static async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No authentication session');
    
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
  }

  // Preview API methods
  static async startPreview(projectId: string, options: { name?: string; type?: string } = {}) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/preview/start`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: options.name || 'Project Preview',
        type: options.type || 'nextjs'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start preview');
    }

    return response.json();
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
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/preview/list`, {
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list previews');
    }

    return response.json();
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
}