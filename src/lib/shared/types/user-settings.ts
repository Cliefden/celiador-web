export interface UserSettings {
  id: string;
  user_id: string;
  
  // Appearance & Display
  theme: 'light' | 'dark' | 'system';
  editor_font_size: number;
  editor_tab_size: number;
  editor_line_numbers: boolean;
  editor_minimap: boolean;
  sidebar_width: number;
  layout_density: 'compact' | 'comfortable';
  
  // AI & Development
  ai_model: string;
  ai_response_style: 'concise' | 'balanced' | 'detailed';
  auto_save_enabled: boolean;
  auto_save_interval: number;
  preview_auto_refresh: boolean;
  
  // Notifications
  job_notifications: boolean;
  ai_sound_alerts: boolean;
  desktop_notifications: boolean;
  email_weekly_digest: boolean;
  
  // Performance
  cache_enabled: boolean;
  debug_mode: boolean;
  
  // Audit trail
  creator: string | null;
  updater: string | null;
  deleter: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserSettingsUpdate {
  // Appearance & Display
  theme?: 'light' | 'dark' | 'system';
  editor_font_size?: number;
  editor_tab_size?: number;
  editor_line_numbers?: boolean;
  editor_minimap?: boolean;
  sidebar_width?: number;
  layout_density?: 'compact' | 'comfortable';
  
  // AI & Development
  ai_model?: string;
  ai_response_style?: 'concise' | 'balanced' | 'detailed';
  auto_save_enabled?: boolean;
  auto_save_interval?: number;
  preview_auto_refresh?: boolean;
  
  // Notifications
  job_notifications?: boolean;
  ai_sound_alerts?: boolean;
  desktop_notifications?: boolean;
  email_weekly_digest?: boolean;
  
  // Performance
  cache_enabled?: boolean;
  debug_mode?: boolean;
}

export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'id' | 'user_id' | 'creator' | 'updater' | 'deleter' | 'created_at' | 'updated_at' | 'deleted_at'> = {
  // Appearance & Display
  theme: 'system',
  editor_font_size: 14,
  editor_tab_size: 2,
  editor_line_numbers: true,
  editor_minimap: true,
  sidebar_width: 300,
  layout_density: 'comfortable',
  
  // AI & Development
  ai_model: 'claude-3.5-sonnet',
  ai_response_style: 'balanced',
  auto_save_enabled: true,
  auto_save_interval: 30,
  preview_auto_refresh: true,
  
  // Notifications
  job_notifications: true,
  ai_sound_alerts: false,
  desktop_notifications: true,
  email_weekly_digest: true,
  
  // Performance
  cache_enabled: true,
  debug_mode: false,
};