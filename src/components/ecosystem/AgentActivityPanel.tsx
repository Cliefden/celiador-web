'use client';

import { useState, useEffect } from 'react';
import { CheckIcon, ClockIcon, X, PlayIcon, PauseIcon } from 'lucide-react';
import { useLivingEcosystem } from '../../hooks/useLivingEcosystem';
import { ProactiveAI } from '../ai-assistant/ProactiveAI';

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

interface AgentActivityPanelProps {
  projectId?: string;
  userId?: string;
  className?: string;
  onAgentAction?: (agentId: string, action: 'pause' | 'resume' | 'stop') => void;
  onSuggestionApply?: (agentId: string, suggestionIndex: number) => void;
  onTriggerIntent?: (intent: string) => Promise<void>;
}

const getAgentConfig = (type: Agent['type']) => {
  switch (type) {
    case 'architect':
      return {
        icon: '🏗️',
        name: 'Architect',
        color: 'blue',
        description: 'Code structure & patterns'
      };
    case 'performance':
      return {
        icon: '⚡',
        name: 'Performance',
        color: 'yellow',
        description: 'Speed & optimization'
      };
    case 'security':
      return {
        icon: '🔒',
        name: 'Security',
        color: 'red',
        description: 'Safety & vulnerabilities'
      };
    case 'ux':
      return {
        icon: '🎨',
        name: 'UX',
        color: 'purple',
        description: 'User experience'
      };
    case 'integration':
      return {
        icon: '🔗',
        name: 'Integration',
        color: 'green',
        description: 'APIs & services'
      };
    default:
      return {
        icon: '🤖',
        name: 'Agent',
        color: 'gray',
        description: 'AI Assistant'
      };
  }
};

const getStatusIcon = (status: Agent['status']) => {
  switch (status) {
    case 'active':
      return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />;
    case 'paused':
      return <PauseIcon className="w-3 h-3 text-yellow-500" />;
    case 'completed':
      return <CheckIcon className="w-3 h-3 text-green-500" />;
    case 'failed':
      return <X className="w-3 h-3 text-red-500" />;
    default:
      return <ClockIcon className="w-3 h-3 text-gray-500" />;
  }
};

const getColorClasses = (color: string, variant: 'bg' | 'border' | 'text' = 'bg') => {
  const colorMap = {
    blue: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700' },
    yellow: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700' },
    red: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700' },
    purple: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700' },
    green: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' },
    gray: { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700' }
  };
  
  return colorMap[color as keyof typeof colorMap]?.[variant] || colorMap.gray[variant];
};

function AgentCard({ agent, onAction, onSuggestionApply }: {
  agent: Agent;
  onAction?: (action: 'pause' | 'resume' | 'stop') => void;
  onSuggestionApply?: (suggestionIndex: number) => void;
}) {
  const config = getAgentConfig(agent.type);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`border rounded-lg p-4 ${getColorClasses(config.color, 'bg')} ${getColorClasses(config.color, 'border')}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{config.icon}</div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className={`font-semibold ${getColorClasses(config.color, 'text')}`}>
                {config.name} Agent
              </h3>
              {getStatusIcon(agent.status)}
            </div>
            <p className="text-xs text-gray-600">{config.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {agent.status === 'active' && onAction && (
            <button
              onClick={() => onAction('pause')}
              className="p-1 hover:bg-white hover:bg-opacity-50 rounded"
              title="Pause agent"
            >
              <PauseIcon className="w-4 h-4 text-gray-600" />
            </button>
          )}
          {agent.status === 'paused' && onAction && (
            <button
              onClick={() => onAction('resume')}
              className="p-1 hover:bg-white hover:bg-opacity-50 rounded"
              title="Resume agent"
            >
              <PlayIcon className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {agent.status !== 'completed' && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{agent.progress}%</span>
          </div>
          <div className="w-full h-2 bg-white bg-opacity-60 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ease-out ${
                agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
              }`}
              style={{ width: `${agent.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Current Task */}
      {agent.currentTask && (
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-700 mb-1">Current Task</div>
          <div className="text-sm text-gray-600 bg-white bg-opacity-50 rounded p-2">
            {agent.currentTask}
          </div>
        </div>
      )}

      {/* Insights */}
      {agent.insights && agent.insights.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-medium text-gray-700 mb-2 flex items-center space-x-1 hover:underline"
          >
            <span>💡 Insights ({agent.insights.length})</span>
            <span>{isExpanded ? '▼' : '▶'}</span>
          </button>
          
          {isExpanded && (
            <div className="space-y-2">
              {agent.insights.map((insight, index) => (
                <div key={index} className="text-sm text-gray-600 bg-white bg-opacity-50 rounded p-2">
                  {insight}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      {agent.suggestions && agent.suggestions.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-700 mb-2">
            🎯 Suggestions
          </div>
          <div className="space-y-2">
            {agent.suggestions.map((suggestion, index) => (
              <div key={index} className="bg-white bg-opacity-60 rounded-lg p-3">
                <div className="flex items-start justify-between mb-1">
                  <div className="text-sm font-medium text-gray-800">
                    {suggestion.title}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    suggestion.impact === 'high' ? 'bg-red-100 text-red-700' :
                    suggestion.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {suggestion.impact}
                  </div>
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  {suggestion.description}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {suggestion.autoApplicable ? '🚀 Auto-applicable' : '👨‍💻 Manual review needed'}
                  </div>
                  {onSuggestionApply && (
                    <button
                      onClick={() => onSuggestionApply(index)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        suggestion.autoApplicable
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {suggestion.autoApplicable ? 'Apply' : 'Review'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      {agent.metadata && (
        <div className="text-xs text-gray-500 border-t border-white border-opacity-50 pt-2">
          <div className="flex justify-between">
            {agent.metadata.tokensUsed && (
              <span>Tokens: {agent.metadata.tokensUsed.toLocaleString()}</span>
            )}
            {agent.metadata.executionTime && (
              <span>Time: {(agent.metadata.executionTime / 1000).toFixed(1)}s</span>
            )}
            {agent.metadata.filesAnalyzed && (
              <span>Files: {agent.metadata.filesAnalyzed}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AgentActivityPanel({ projectId, userId, className = "", onAgentAction, onSuggestionApply, onTriggerIntent }: AgentActivityPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Get ecosystem data from hook with safe fallbacks
  const {
    isEnabled = false,
    agents = [],
    controlAgent,
    applySuggestion
  } = useLivingEcosystem(projectId) || {};
  
  // Don't render if ecosystem is not enabled or no agents
  if (!isEnabled || agents.length === 0) {
    return null;
  }

  // Use hook functions if available, otherwise use props
  const handleAgentAction = onAgentAction || controlAgent;
  const handleSuggestionApply = onSuggestionApply || applySuggestion;

  return (
    <div className={`fixed right-0 top-0 h-full bg-white shadow-2xl border-l border-gray-200 transition-all duration-300 z-40 ${
      isMinimized ? 'w-12' : 'w-96'
    } ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          {!isMinimized && (
            <>
              <div>
                <h2 className="font-semibold text-gray-900">AI Agents</h2>
                <p className="text-sm text-gray-500">
                  {agents.filter(a => a.status === 'active').length} active, {agents.length} total
                </p>
              </div>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 hover:bg-gray-200 rounded-lg"
                title="Minimize panel"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
          
          {isMinimized && (
            <button
              onClick={() => setIsMinimized(false)}
              className="w-full h-full flex items-center justify-center hover:bg-gray-200 rounded"
              title="Expand agent panel"
            >
              <div className="transform -rotate-90 text-xs font-medium text-gray-700">
                🤖 {agents.filter(a => a.status === 'active').length}
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Agent List */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Proactive AI Suggestions */}
          {projectId && (
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-3">💡 AI Suggestions</div>
              <ProactiveAI 
                projectId={projectId} 
                agents={agents || []} 
                isEnabled={isEnabled}
                onTriggerIntent={onTriggerIntent}
              />
            </div>
          )}
          
          {agents.length > 0 && (
            <div className="text-sm font-medium text-gray-700 mb-3">🤖 Active Agents</div>
          )}
          
          {agents
            .sort((a, b) => {
              // Active agents first
              if (a.status === 'active' && b.status !== 'active') return -1;
              if (b.status === 'active' && a.status !== 'active') return 1;
              return 0;
            })
            .map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onAction={handleAgentAction ? (action) => handleAgentAction(agent.id, action) : undefined}
                onSuggestionApply={handleSuggestionApply ? (index) => handleSuggestionApply(agent.id, index) : undefined}
              />
            ))}
        </div>
      )}
      
      {/* Footer */}
      {!isMinimized && agents.length > 0 && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}