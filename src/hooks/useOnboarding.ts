'use client';

import { useState, useEffect } from 'react';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  hasCreatedFirstProject: boolean;
  hasConnectedGitHub: boolean;
  hasDeployedProject: boolean;
  lastOnboardingStep: number;
}

const ONBOARDING_STORAGE_KEY = 'celiador_onboarding_state';

export function useOnboarding(userId?: string) {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    hasSeenOnboarding: false,
    hasCreatedFirstProject: false,
    hasConnectedGitHub: false,
    hasDeployedProject: false,
    lastOnboardingStep: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load onboarding state from localStorage
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const storageKey = `${ONBOARDING_STORAGE_KEY}_${userId}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const parsedState = JSON.parse(stored);
        setOnboardingState(parsedState);
      }
    } catch (error) {
      console.error('[ONBOARDING] Failed to load onboarding state:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Save onboarding state to localStorage
  const saveOnboardingState = (newState: Partial<OnboardingState>) => {
    if (!userId) return;

    try {
      const updatedState = { ...onboardingState, ...newState };
      const storageKey = `${ONBOARDING_STORAGE_KEY}_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedState));
      setOnboardingState(updatedState);
    } catch (error) {
      console.error('[ONBOARDING] Failed to save onboarding state:', error);
    }
  };

  // Mark onboarding as completed
  const completeOnboarding = () => {
    saveOnboardingState({ hasSeenOnboarding: true });
  };

  // Mark first project creation
  const markFirstProjectCreated = () => {
    saveOnboardingState({ hasCreatedFirstProject: true });
  };

  // Mark GitHub connection
  const markGitHubConnected = () => {
    saveOnboardingState({ hasConnectedGitHub: true });
  };

  // Mark project deployment
  const markProjectDeployed = () => {
    saveOnboardingState({ hasDeployedProject: true });
  };

  // Update last onboarding step
  const updateLastStep = (step: number) => {
    saveOnboardingState({ lastOnboardingStep: step });
  };

  // Reset onboarding state (useful for testing)
  const resetOnboarding = () => {
    if (!userId) return;
    
    try {
      const storageKey = `${ONBOARDING_STORAGE_KEY}_${userId}`;
      localStorage.removeItem(storageKey);
      setOnboardingState({
        hasSeenOnboarding: false,
        hasCreatedFirstProject: false,
        hasConnectedGitHub: false,
        hasDeployedProject: false,
        lastOnboardingStep: 0,
      });
    } catch (error) {
      console.error('[ONBOARDING] Failed to reset onboarding state:', error);
    }
  };

  // Check if user should see onboarding
  const shouldShowOnboarding = !isLoading && !onboardingState.hasSeenOnboarding;

  // Check if user is new (no projects created)
  const isNewUser = !onboardingState.hasCreatedFirstProject;

  // Get onboarding progress
  const getOnboardingProgress = () => {
    const steps = [
      onboardingState.hasSeenOnboarding,
      onboardingState.hasCreatedFirstProject,
      onboardingState.hasConnectedGitHub,
      onboardingState.hasDeployedProject,
    ];
    
    const completedSteps = steps.filter(Boolean).length;
    const totalSteps = steps.length;
    
    return {
      completed: completedSteps,
      total: totalSteps,
      percentage: (completedSteps / totalSteps) * 100,
    };
  };

  return {
    onboardingState,
    isLoading,
    shouldShowOnboarding,
    isNewUser,
    completeOnboarding,
    markFirstProjectCreated,
    markGitHubConnected,
    markProjectDeployed,
    updateLastStep,
    resetOnboarding,
    getOnboardingProgress,
  };
}