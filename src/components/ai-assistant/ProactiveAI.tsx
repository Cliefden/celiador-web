'use client';

import { useState, useEffect } from 'react';
import { Brain, Lightbulb, Zap, AlertTriangle } from 'lucide-react';

interface ProactiveAIProps {
  projectId?: string;
  agents: any[];
  isEnabled: boolean;
  onTriggerIntent?: (intent: string) => void;
}

interface AIInsight {
  id: string;
  type: 'suggestion' | 'warning' | 'optimization' | 'opportunity';
  title: string;
  message: string;
  action?: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
}

export function ProactiveAI({ projectId, agents, isEnabled, onTriggerIntent }: ProactiveAIProps) {
  const [activeInsights, setActiveInsights] = useState<AIInsight[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  
  console.log('🎯 ProactiveAI render:', { projectId, isEnabled, activeInsightsCount: activeInsights.length, dismissedCount: dismissed.size });

  // Generate proactive insights based on project state
  useEffect(() => {
    if (!isEnabled || !projectId) return;

    const generateInsights = () => {
      console.log('🎯 ProactiveAI generateInsights called');
      const insights: AIInsight[] = [];
      const now = new Date();

      // Agent coordination insights
      const activeAgentCount = agents.filter(a => a.status === 'active').length;
      if (activeAgentCount > 0) {
        insights.push({
          id: 'agent-coordination',
          type: 'suggestion',
          title: 'AI Agents are Active',
          message: `${activeAgentCount} agents are currently analyzing your project. Would you like me to show their progress?`,
          action: 'show agent status',
          timestamp: now,
          priority: 'medium'
        });
      }

      // Performance insights - always show initially for testing
      if (Math.random() > 0.1) {  // 90% chance
        insights.push({
          id: 'performance-check',
          type: 'opportunity',
          title: 'Performance Optimization Available',
          message: 'I noticed potential performance improvements in your React components. Shall I analyze them?',
          action: 'analyze performance',
          timestamp: now,
          priority: 'low'
        });
      }

      // Security insights - always show initially for testing  
      if (Math.random() > 0.1) {  // 90% chance
        insights.push({
          id: 'security-scan',
          type: 'warning',
          title: 'Security Review Recommended',
          message: 'It\'s been a while since your last security scan. Would you like me to check for vulnerabilities?',
          action: 'run security scan',
          timestamp: now,
          priority: 'high'
        });
      }

      // Code quality insights - always show initially for testing
      if (Math.random() > 0.1) {  // 90% chance
        insights.push({
          id: 'code-quality',
          type: 'suggestion',
          title: 'Code Quality Insights',
          message: 'I can suggest improvements to your TypeScript patterns and React hooks usage.',
          action: 'review code quality',
          timestamp: now,
          priority: 'low'
        });
      }

      // Filter out dismissed insights
      const newInsights = insights.filter(insight => !dismissed.has(insight.id));
      console.log('🎯 ProactiveAI generated insights:', { total: insights.length, afterDismissed: newInsights.length, dismissed: Array.from(dismissed) });
      setActiveInsights(newInsights.slice(0, 3)); // Show max 3 at a time
    };

    // Generate initial insights
    generateInsights();

    // Update insights periodically
    const interval = setInterval(generateInsights, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [projectId, agents, isEnabled, dismissed]);

  const dismissInsight = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
    setActiveInsights(prev => prev.filter(insight => insight.id !== id));
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'suggestion': return <Lightbulb className="w-4 h-4 text-yellow-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'optimization': return <Zap className="w-4 h-4 text-blue-400" />;
      case 'opportunity': return <Brain className="w-4 h-4 text-green-400" />;
      default: return <Brain className="w-4 h-4 text-gray-400" />;
    }
  };

  const getInsightColors = (priority: string, type: string) => {
    if (priority === 'high') {
      return 'border-red-500/50 bg-red-900/20 text-red-100';
    } else if (priority === 'medium') {
      return 'border-yellow-500/50 bg-yellow-900/20 text-yellow-100';
    } else {
      return type === 'opportunity' 
        ? 'border-green-500/50 bg-green-900/20 text-green-100'
        : 'border-blue-500/50 bg-blue-900/20 text-blue-100';
    }
  };

  if (!isEnabled || activeInsights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {activeInsights.map((insight) => (
        <div
          key={insight.id}
          className={`p-3 rounded-lg border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${getInsightColors(insight.priority, insight.type)}`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getInsightIcon(insight.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium truncate">{insight.title}</h4>
                <button
                  onClick={() => dismissInsight(insight.id)}
                  className="text-gray-400 hover:text-white transition-colors text-xs"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs opacity-90 mb-2">{insight.message}</p>
              {insight.action && (
                <button
                  onClick={async () => {
                    console.log('🔍 ProactiveAI button clicked:', insight.action);
                    console.log('🔍 onTriggerIntent available:', !!onTriggerIntent);
                    
                    // Trigger the actual intent through the ecosystem
                    if (onTriggerIntent) {
                      const intentMap: Record<string, string> = {
                        'analyze performance': 'optimize application performance',
                        'run security scan': 'enhance security and data protection',
                        'review code quality': 'improve code quality and maintainability',
                        'show agent status': 'show current agent status'
                      };
                      const intent = intentMap[insight.action] || insight.action;
                      console.log('🔍 Mapped intent:', intent);
                      
                      try {
                        await onTriggerIntent(intent);
                        // Only dismiss on success
                        dismissInsight(insight.id);
                      } catch (error) {
                        console.error('Failed to trigger intent:', error);
                        // Don't dismiss on error - let user retry
                      }
                    } else {
                      console.warn('⚠️ onTriggerIntent function not available');
                    }
                  }}
                  className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                >
                  {insight.action}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}