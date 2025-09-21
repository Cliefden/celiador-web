'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserSettings, UserSettingsUpdate, DEFAULT_USER_SETTINGS } from '../lib/shared/types/user-settings';
import { settingsAPI } from '../lib/settings-api';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  updateSettings: (updates: UserSettingsUpdate) => Promise<void>;
  resetSettings: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    if (!user) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const userSettings = await settingsAPI.getSettings();
      setSettings(userSettings);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
      // Use defaults if fetch fails
      setSettings({
        id: '',
        user_id: user.id,
        ...DEFAULT_USER_SETTINGS,
        creator: null,
        updater: null,
        deleter: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: UserSettingsUpdate) => {
    if (!user || !settings) return;

    try {
      setError(null);
      const updatedSettings = await settingsAPI.updateSettings(updates);
      setSettings(updatedSettings);
      
      // Apply theme changes immediately
      if (updates.theme) {
        applyTheme(updates.theme);
      }
    } catch (err) {
      console.error('Failed to update settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    }
  };

  const resetSettings = async () => {
    if (!user) return;

    try {
      setError(null);
      const defaultSettings = await settingsAPI.resetSettings();
      setSettings(defaultSettings);
      
      // Apply theme changes immediately
      applyTheme(defaultSettings.theme);
    } catch (err) {
      console.error('Failed to reset settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
      throw err;
    }
  };

  const refreshSettings = async () => {
    await fetchSettings();
  };

  // Apply theme to document
  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    if (theme === 'system') {
      // Remove explicit theme classes and let CSS media query handle it
      root.classList.remove('light', 'dark');
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
    }
  };

  // Initialize settings when user changes
  useEffect(() => {
    if (!authLoading) {
      fetchSettings();
    }
  }, [user, authLoading]);

  // Apply theme on settings load
  useEffect(() => {
    if (settings?.theme) {
      applyTheme(settings.theme);
    }
  }, [settings?.theme]);

  const value: SettingsContextType = {
    settings,
    isLoading,
    error,
    updateSettings,
    resetSettings,
    refreshSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}