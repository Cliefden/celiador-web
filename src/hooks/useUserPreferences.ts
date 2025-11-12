'use client';

import { useState, useEffect } from 'react';

export type DashboardMode = 'classic' | 'ai-enhanced';

interface UserPreferences {
  dashboardMode: DashboardMode;
  aiAssistantWidth: number;
  dismissedInsights: string[];
  autoEnableAI: boolean;
}

const defaultPreferences: UserPreferences = {
  dashboardMode: 'classic',
  aiAssistantWidth: 384,
  dismissedInsights: [],
  autoEnableAI: true,
};

const STORAGE_KEY = 'celiador-user-preferences';

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      } catch (error) {
        console.warn('Failed to save user preferences:', error);
      }
    }
  }, [preferences, isLoaded]);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  const setDashboardMode = (mode: DashboardMode) => {
    updatePreferences({ dashboardMode: mode });
  };

  const setAiAssistantWidth = (width: number) => {
    updatePreferences({ aiAssistantWidth: Math.max(300, Math.min(800, width)) });
  };

  const dismissInsight = (insightId: string) => {
    updatePreferences({ 
      dismissedInsights: [...preferences.dismissedInsights, insightId] 
    });
  };

  const clearDismissedInsights = () => {
    updatePreferences({ dismissedInsights: [] });
  };

  const setAutoEnableAI = (enabled: boolean) => {
    updatePreferences({ autoEnableAI: enabled });
  };

  return {
    preferences,
    isLoaded,
    setDashboardMode,
    setAiAssistantWidth,
    dismissInsight,
    clearDismissedInsights,
    setAutoEnableAI,
    updatePreferences,
  };
}