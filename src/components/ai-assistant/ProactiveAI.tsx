'use client';

import { useState, useEffect } from 'react';
import { Brain, Lightbulb, Zap, AlertTriangle } from 'lucide-react';

interface ProactiveAIProps {
  projectId?: string;
  agents: any[];
  isEnabled: boolean;
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

export function ProactiveAI({ projectId, agents, isEnabled }: ProactiveAIProps) {
  const [activeInsights, setActiveInsights] = useState<AIInsight[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Generate proactive insights based on project state
  useEffect(() => {
    if (!isEnabled || !projectId) return;

    const generateInsights = () => {
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

      // Performance insights
      if (Math.random() > 0.3) {
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

      // Security insights
      if (Math.random() > 0.4) {
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

      // Code quality insights
      if (Math.random() > 0.2) {
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
      setActiveInsights(newInsights.slice(0, 2)); // Show max 2 at a time
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
                  onClick={() => {
                    // This would trigger the AI action
                    console.log('AI Action:', insight.action);
                    dismissInsight(insight.id);
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