'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';

interface Agent {
  id: string;
  type: 'architect' | 'performance' | 'security' | 'ux' | 'integration';
  status: 'active' | 'paused' | 'completed' | 'failed';
  progress: number;
  currentTask?: string;
  insights?: string[];
  suggestions?: Array<{
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    autoApplicable: boolean;
  }>;
  metadata?: {
    tokensUsed?: number;
    executionTime?: number;
    filesAnalyzed?: number;
  };
}

interface ProjectDNA {
  confidence: number;
  patterns: Array<{
    type: string;
    confidence: number;
    data?: any;
  }>;
  lastInsight: string;
  lastUpdated: string;
}

interface IntentExecution {
  intentId: string;
  userIntent: string;
  status: 'planning' | 'executing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
}

interface VisualContext {
  screenshotUrl?: string;
  uiElements?: any[];
  userInteractions?: any[];
  previewUrl?: string;
}

interface LivingEcosystemState {
  isEnabled: boolean;
  isConnected: boolean;
  agents: Agent[];
  projectDNA: ProjectDNA;
  activeIntent?: IntentExecution;
  visualContext?: VisualContext;
  lastError?: string;
}

interface ProcessIntentOptions {
  projectId: string;
  userId: string;
  visualContext?: VisualContext;
  projectContext?: {
    name?: string;
    description?: string;
    tech_stack?: string[];
    current_files?: string[];
    file_contents?: { [key: string]: string };
  };
}

export function useLivingEcosystem(projectId?: string) {
  const [state, setState] = useState<LivingEcosystemState>({
    isEnabled: false,
    isConnected: false,
    agents: [],
    projectDNA: {
      confidence: 0,
      patterns: [],
      lastInsight: 'No insights yet',
      lastUpdated: new Date().toISOString()
    }
  });

  const { isConnected: wsConnected, sendMessage, lastMessage } = useWebSocket({
    onMessage: (message) => {
      // Handle ecosystem-specific WebSocket messages
      handleWebSocketMessage(message);
    },
    channels: ['ai_agents', 'intent_execution', 'project_dna', 'visual_context']
  });
  const intentTimeouts = useRef(new Map<string, NodeJS.Timeout>());

  // Check ecosystem status and fetch real data from backend
  useEffect(() => {
    const isEnabled = process.env.NEXT_PUBLIC_LIVING_ECOSYSTEM_ENABLED === 'true';
    
    if (isEnabled) {
      fetchEcosystemStatus();
    } else {
      setState(prev => ({ 
        ...prev, 
        isEnabled: false,
        isConnected: false,
        agents: [],
        projectDNA: {
          confidence: 0,
          patterns: [],
          lastInsight: 'No insights yet',
          lastUpdated: new Date().toISOString()
        }
      }));
    }
  }, [wsConnected]);

  // Fetch ecosystem status and initialize connection
  const fetchEcosystemStatus = useCallback(async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/ecosystem/status`);
      
      if (response.ok) {
        const status = await response.json();
        console.log('[LivingEcosystem] Backend status:', status);
        
        setState(prev => ({ 
          ...prev, 
          isEnabled: status.available && status.featureFlags?.enabled,
          isConnected: status.available && wsConnected,
          agents: [], // Start with empty agents, will be populated when intents are processed
          projectDNA: {
            confidence: 0,
            patterns: [],
            lastInsight: 'Living Ecosystem connected - ready to analyze project',
            lastUpdated: new Date().toISOString()
          }
        }));
      } else {
        console.warn('[LivingEcosystem] Backend not available, using fallback');
        setState(prev => ({ 
          ...prev, 
          isEnabled: false,
          isConnected: false
        }));
      }
    } catch (error) {
      console.error('[LivingEcosystem] Failed to connect to backend:', error);
      setState(prev => ({ 
        ...prev, 
        isEnabled: false,
        isConnected: false,
        lastError: 'Failed to connect to Living Ecosystem backend'
      }));
    }
  }, [wsConnected]);

  // Handle WebSocket messages for ecosystem events
  const handleWebSocketMessage = useCallback((message: any) => {
    if (!state.isEnabled) return;

    // Route messages based on channel
    switch (message.channel) {
      case 'ai_agents':
        handleAgentEvent(message);
        break;
      case 'intent_execution':
        handleIntentEvent(message);
        break;
      case 'project_dna':
        handleProjectDNAEvent(message);
        break;
      case 'visual_context':
        handleVisualContextEvent(message);
        break;
    }
  }, [state.isEnabled]);

  const handleAgentEvent = useCallback((event: any) => {
    switch (event.type) {
      case 'agent_spawn':
        setState(prev => ({
          ...prev,
          agents: [...prev.agents.filter(a => a.id !== event.agentId), {
            id: event.agentId,
            type: event.agentType,
            status: 'active',
            progress: 0,
            currentTask: 'Initializing...'
          }]
        }));
        break;

      case 'agent_update':
        setState(prev => ({
          ...prev,
          agents: prev.agents.map(agent => 
            agent.id === event.agentId 
              ? { 
                  ...agent, 
                  status: event.status,
                  progress: event.progress,
                  currentTask: event.data?.executing || agent.currentTask,
                  metadata: event.data?.metadata
                }
              : agent
          )
        }));
        break;

      case 'agent_result':
        setState(prev => ({
          ...prev,
          agents: prev.agents.map(agent => 
            agent.id === event.agentId 
              ? { 
                  ...agent, 
                  status: 'completed',
                  progress: 100,
                  insights: event.data?.result?.recommendations ? [event.data.result.recommendations] : agent.insights,
                  suggestions: generateSuggestionsFromResult(event.data?.result)
                }
              : agent
          )
        }));
        break;
    }
  }, []);

  const handleIntentEvent = useCallback((event: any) => {
    switch (event.type) {
      case 'intent_received':
        setState(prev => ({
          ...prev,
          activeIntent: {
            intentId: event.intentId,
            userIntent: event.userIntent,
            status: 'planning',
            progress: 0
          }
        }));
        break;

      case 'intent_executing':
        setState(prev => ({
          ...prev,
          activeIntent: prev.activeIntent ? {
            ...prev.activeIntent,
            status: 'executing',
            progress: event.progress
          } : undefined
        }));
        break;

      case 'intent_completed':
        setState(prev => ({
          ...prev,
          activeIntent: prev.activeIntent ? {
            ...prev.activeIntent,
            status: 'completed',
            progress: 100,
            result: event.result
          } : undefined
        }));

        // Clear completed intent after delay
        if (event.intentId) {
          const timeout = setTimeout(() => {
            setState(prev => ({
              ...prev,
              activeIntent: prev.activeIntent?.intentId === event.intentId ? undefined : prev.activeIntent
            }));
          }, 5000);
          intentTimeouts.current.set(event.intentId, timeout);
        }
        break;

      case 'intent_failed':
        setState(prev => ({
          ...prev,
          activeIntent: prev.activeIntent ? {
            ...prev.activeIntent,
            status: 'failed',
            error: event.error
          } : undefined,
          lastError: event.error
        }));
        break;
    }
  }, []);

  const handleProjectDNAEvent = useCallback((event: any) => {
    switch (event.type) {
      case 'pattern_detected':
      case 'insight_generated':
        setState(prev => ({
          ...prev,
          projectDNA: {
            ...prev.projectDNA,
            patterns: [
              ...prev.projectDNA.patterns.filter(p => p.type !== event.patternType),
              {
                type: event.patternType,
                confidence: event.confidenceScore,
                data: event.patternData
              }
            ],
            lastInsight: event.patternData?.insight || `New ${event.patternType} pattern detected`,
            lastUpdated: new Date().toISOString(),
            confidence: Math.max(prev.projectDNA.confidence, event.confidenceScore)
          }
        }));
        break;
    }
  }, []);

  const handleVisualContextEvent = useCallback((event: any) => {
    switch (event.type) {
      case 'visual_context_captured':
        setState(prev => ({
          ...prev,
          visualContext: {
            ...prev.visualContext,
            screenshotUrl: event.data?.screenshotUrl,
            uiElements: event.data?.uiElements,
            previewUrl: event.data?.previewUrl
          }
        }));
        break;

      case 'ui_element_selected':
        setState(prev => ({
          ...prev,
          visualContext: {
            ...prev.visualContext,
            selectedElement: {
              id: event.elementId,
              coordinates: event.coordinates,
              codeMapping: event.data?.codeMapping
            }
          }
        }));
        break;
    }
  }, []);

  const processUserIntent = useCallback(async (
    userIntent: string,
    options: ProcessIntentOptions
  ): Promise<{
    intentId?: string;
    immediateResponse: string;
    usedEcosystem: boolean;
  }> => {
    if (!state.isEnabled || !state.isConnected) {
      return {
        immediateResponse: "Living Ecosystem is not enabled. Using standard AI processing...",
        usedEcosystem: false
      };
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/ecosystem/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIntent,
          projectContext: {
            projectId: options.projectId,
            userId: options.userId,
            ...options.projectContext
          },
          visualContext: options.visualContext
        })
      });

      const result = await response.json();
      console.log('[LivingEcosystem] Intent processing result:', result);

      if (result.success) {
        return {
          intentId: result.intentId,
          immediateResponse: result.response,
          usedEcosystem: result.usedLivingEcosystem
        };
      } else {
        throw new Error(result.error || 'Failed to process intent');
      }
    } catch (error) {
      console.error('[LivingEcosystem] Intent processing error:', error);
      setState(prev => ({
        ...prev,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      }));

      return {
        immediateResponse: "Error processing intent with Living Ecosystem. Please try again.",
        usedEcosystem: false
      };
    }
  }, [state.isEnabled, state.isConnected]);

  const captureVisualContext = useCallback(async (instanceId: string) => {
    if (!state.isEnabled) return null;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/api/ecosystem/visual-context/${instanceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeScreenshot: true,
          analyzeUIElements: true,
          mapToCode: false // Can be enabled later for performance
        })
      });

      const result = await response.json();
      console.log('[LivingEcosystem] Visual context capture result:', result);
      
      if (result.success && result.visualContext) {
        setState(prev => ({
          ...prev,
          visualContext: result.visualContext
        }));
        return result.visualContext;
      }
    } catch (error) {
      console.error('[LivingEcosystem] Error capturing visual context:', error);
    }

    return null;
  }, [state.isEnabled]);

  const controlAgent = useCallback(async (
    agentId: string,
    action: 'pause' | 'resume' | 'stop'
  ) => {
    if (!state.isEnabled || !wsConnected) return;

    sendMessage({
      type: 'agent_control',
      agentId,
      action,
      timestamp: new Date().toISOString()
    });
  }, [state.isEnabled, wsConnected, sendMessage]);

  const applySuggestion = useCallback(async (
    agentId: string,
    suggestionIndex: number
  ) => {
    if (!state.isEnabled) return;

    const agent = state.agents.find(a => a.id === agentId);
    const suggestion = agent?.suggestions?.[suggestionIndex];
    
    if (!suggestion) return;

    // For now, just log the action
    console.log('Applying suggestion:', suggestion.title);
    
    // TODO: Implement actual suggestion application
    // This would typically make API calls to modify code, update configurations, etc.
  }, [state.isEnabled, state.agents]);

  const isComplexIntent = useCallback((intent: string): boolean => {
    const complexKeywords = [
      'modernize', 'optimize', 'improve', 'refactor', 'redesign',
      'make it', 'change the', 'add feature', 'implement',
      'performance', 'security', 'accessibility', 'responsive',
      'mobile', 'desktop', 'user experience', 'design system'
    ];

    const intentLower = intent.toLowerCase();
    return complexKeywords.some(keyword => intentLower.includes(keyword));
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      intentTimeouts.current.forEach(timeout => clearTimeout(timeout));
      intentTimeouts.current.clear();
    };
  }, []);

  return {
    // State
    isEnabled: state.isEnabled,
    isConnected: state.isConnected,
    agents: state.agents,
    projectDNA: state.projectDNA,
    activeIntent: state.activeIntent,
    visualContext: state.visualContext,
    lastError: state.lastError,

    // Actions
    processUserIntent,
    captureVisualContext,
    controlAgent,
    applySuggestion,
    isComplexIntent,

    // Computed
    hasActiveAgents: state.agents.some(agent => agent.status === 'active'),
    ecosystemStatus: state.isEnabled 
      ? (state.isConnected ? 'connected' : 'connecting')
      : 'disabled'
  };
}

// Helper function to generate suggestions from agent results
function generateSuggestionsFromResult(result: any): Array<{
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  autoApplicable: boolean;
}> {
  if (!result?.recommendations) return [];

  // Parse recommendations text for actionable suggestions
  const recommendations = result.recommendations;
  const suggestions = [];

  if (recommendations.includes('optimization')) {
    suggestions.push({
      title: 'Apply Performance Optimizations',
      description: 'Implement suggested performance improvements',
      impact: 'high' as const,
      autoApplicable: true
    });
  }

  if (recommendations.includes('component')) {
    suggestions.push({
      title: 'Refactor Components',
      description: 'Apply suggested component structure improvements',
      impact: 'medium' as const,
      autoApplicable: false
    });
  }

  if (recommendations.includes('accessibility')) {
    suggestions.push({
      title: 'Improve Accessibility',
      description: 'Add ARIA labels and semantic markup',
      impact: 'high' as const,
      autoApplicable: true
    });
  }

  return suggestions;
}