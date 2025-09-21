import { UserSettings, UserSettingsUpdate } from './shared/types/user-settings';
import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';

export class SettingsAPI {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get current session token from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getSettings(): Promise<UserSettings> {
    const response = await this.makeRequest('/api/settings');
    return response.settings;
  }

  async updateSettings(updates: UserSettingsUpdate): Promise<UserSettings> {
    const response = await this.makeRequest('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.settings;
  }

  async resetSettings(): Promise<UserSettings> {
    const response = await this.makeRequest('/api/settings', {
      method: 'DELETE',
    });
    return response.settings;
  }
}

export const settingsAPI = new SettingsAPI();