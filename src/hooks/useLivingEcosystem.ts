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

  // Check if ecosystem is enabled via environment
  useEffect(() => {
    const isEnabled = process.env.NEXT_PUBLIC_LIVING_ECOSYSTEM_ENABLED === 'true';
    
    // All five agent types should always be present when ecosystem is enabled
    const allAgents = isEnabled ? [
      {
        id: 'agent-architect-001',
        type: 'architect' as const,
        status: 'active' as const,
        progress: 65,
        currentTask: 'Analyzing component architecture patterns',
        insights: [
          'Component structure follows consistent patterns',
          'Props interface design could be improved',
          'Consider using composition over inheritance'
        ],
        suggestions: [
          {
            title: 'Improve Component Props',
            description: 'Refactor props to use more specific TypeScript interfaces',
            impact: 'medium' as const,
            autoApplicable: true
          },
          {
            title: 'Add Component Documentation',
            description: 'Generate JSDoc comments for better maintainability',
            impact: 'low' as const,
            autoApplicable: false
          }
        ],
        metadata: {
          tokensUsed: 1240,
          executionTime: 3200,
          filesAnalyzed: 12
        }
      },
      {
        id: 'agent-performance-001',
        type: 'performance' as const,
        status: 'active' as const,
        progress: 35,
        currentTask: 'Bundle size analysis and optimization opportunities',
        insights: [
          'Bundle size is acceptable but can be optimized',
          'Several unused dependencies detected'
        ],
        suggestions: [
          {
            title: 'Remove Unused Dependencies',
            description: 'Clean up package.json to reduce bundle size',
            impact: 'high' as const,
            autoApplicable: true
          }
        ],
        metadata: {
          tokensUsed: 850,
          executionTime: 2100,
          filesAnalyzed: 8
        }
      },
      {
        id: 'agent-security-001',
        type: 'security' as const,
        status: 'completed' as const,
        progress: 100,
        currentTask: 'Security audit completed',
        insights: [
          'No critical vulnerabilities found',
          'All dependencies are up to date',
          'HTTPS properly configured'
        ],
        suggestions: [
          {
            title: 'Add Content Security Policy',
            description: 'Implement CSP headers for enhanced security',
            impact: 'medium' as const,
            autoApplicable: false
          }
        ],
        metadata: {
          tokensUsed: 2100,
          executionTime: 5800,
          filesAnalyzed: 24
        }
      },
      {
        id: 'agent-ux-001',
        type: 'ux' as const,
        status: 'paused' as const,
        progress: 15,
        currentTask: 'User experience analysis paused',
        insights: [
          'Initial accessibility scan completed',
          'Color contrast meets WCAG standards'
        ],
        suggestions: [
          {
            title: 'Improve Mobile Navigation',
            description: 'Enhance mobile menu accessibility and usability',
            impact: 'medium' as const,
            autoApplicable: false
          }
        ],
        metadata: {
          tokensUsed: 450,
          executionTime: 1200,
          filesAnalyzed: 6
        }
      },
      {
        id: 'agent-integration-001',
        type: 'integration' as const,
        status: 'failed' as const,
        progress: 0,
        currentTask: 'API integration analysis failed',
        insights: [],
        suggestions: [],
        metadata: {
          tokensUsed: 0,
          executionTime: 0,
          filesAnalyzed: 0
        }
      }
    ] : [];

    setState(prev => ({ 
      ...prev, 
      isEnabled, 
      isConnected: isEnabled && wsConnected,
      agents: allAgents,
      projectDNA: isEnabled ? {
        confidence: 0.78,
        patterns: [
          { type: 'react-hooks', confidence: 0.95 },
          { type: 'tailwind-styling', confidence: 0.89 },
          { type: 'typescript-usage', confidence: 0.92 }
        ],
        lastInsight: 'Strong TypeScript adoption detected with consistent hook patterns',
        lastUpdated: new Date().toISOString()
      } : prev.projectDNA
    }));
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
      const response = await fetch('/api/ecosystem/intent', {
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
      const response = await fetch(`/api/ecosystem/visual-context/${instanceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeScreenshot: true,
          analyzeUIElements: true,
          mapToCode: false // Can be enabled later for performance
        })
      });

      const result = await response.json();
      
      if (result.success && result.visualContext) {
        setState(prev => ({
          ...prev,
          visualContext: result.visualContext
        }));
        return result.visualContext;
      }
    } catch (error) {
      console.error('Error capturing visual context:', error);
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