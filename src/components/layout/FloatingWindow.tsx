'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Files, MessageSquare, Settings, Activity, Code2, Github, Triangle, Bot, CheckIcon, ClockIcon, PlayIcon, PauseIcon, RefreshCw } from 'lucide-react';
import { ProjectFileExplorer } from '../file-tree/ProjectFileExplorer';
import { ActivityFeed } from '../activity/ActivityFeed';
import { GitHubIntegrationPanel } from '../integrations/GitHubIntegrationPanel';
import { VercelIntegrationPanel } from '../integrations/VercelIntegrationPanel';
import { FloatingSettingsPanel } from '../settings/FloatingSettingsPanel';
import { useOfflineConversation } from '../conversation/useOfflineConversation';
import { MessageList } from '../conversation/MessageList';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { AgentActivityPanel } from '../ecosystem/AgentActivityPanel';
import { useLivingEcosystem } from '../../hooks/useLivingEcosystem';

export type FloatingWindowContent = 'files' | 'chat' | 'activity' | 'settings' | 'code' | 'integrations' | 'agents';

interface FloatingWindowProps {
  isOpen: boolean;
  onClose: () => void;
  content: FloatingWindowContent;
  projectId?: string;
  onFileSelect?: (filePath: string) => void;
  selectedFile?: string | null;
}

const contentConfig = {
  files: {
    title: 'Project Files',
    icon: Files,
    description: 'Browse and manage your project files'
  },
  chat: {
    title: 'AI Assistant',
    icon: MessageSquare,
    description: 'Chat with AI about your project'
  },
  activity: {
    title: 'Activity',
    icon: Activity,
    description: 'View project activity and logs'
  },
  settings: {
    title: 'Settings',
    icon: Settings,
    description: 'Configure project settings'
  },
  code: {
    title: 'Code Assistant',
    icon: Code2,
    description: 'AI-powered code assistance'
  },
  integrations: {
    title: 'Integrations',
    icon: Github,
    description: 'Manage GitHub and Vercel integrations'
  },
  agents: {
    title: 'AI Agents',
    icon: Bot,
    description: 'Living Ecosystem AI agent status and control'
  }
};

export function FloatingWindow({
  isOpen,
  onClose,
  content,
  projectId,
  onFileSelect,
  selectedFile
}: FloatingWindowProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready, then slide in
      const timer = setTimeout(() => setIsAnimating(false), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const config = contentConfig[content];
  const IconComponent = config.icon;

  const renderContent = () => {
    switch (content) {
      case 'files':
        return projectId ? (
          <ProjectFileExplorer
            projectId={projectId}
            onFileSelect={onFileSelect || (() => {})}
            selectedFile={selectedFile}
            className="h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-300">
            <p>No project selected</p>
          </div>
        );
      
      case 'chat':
        return (
          <ConversationFloatingPanel projectId={projectId} />
        );
      
      case 'activity':
        return projectId ? (
          <ActivityFeed
            projectId={projectId}
            className="h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-300">
            <p>No project selected</p>
          </div>
        );
      
      case 'settings':
        return (
          <FloatingSettingsPanel className="h-full" />
        );
      
      case 'code':
        return (
          <div className="p-4 h-full flex items-center justify-center text-gray-300">
            <div className="text-center">
              <Code2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Code assistant coming soon...</p>
            </div>
          </div>
        );
      
      case 'integrations':
        return projectId ? (
          <IntegrationsTabPanel projectId={projectId} />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-300">
            <p>No project selected</p>
          </div>
        );
      
      case 'agents':
        return (
          <FloatingAgentsPanel projectId={projectId} />
        );
      
      default:
        return (
          <div className="p-4 h-full flex items-center justify-center text-gray-300">
            <p>Content not found</p>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 z-[60] ${
          isAnimating ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={onClose}
      />
      
      {/* Floating Window */}
      <div className={`
        fixed right-0 top-0 h-full w-96 bg-gray-900 shadow-2xl z-[70]
        transform transition-transform duration-300 ease-out
        ${isAnimating ? 'translate-x-full' : 'translate-x-0'}
        flex flex-col border-l border-gray-700
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <IconComponent className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white">{config.title}</h2>
              <p className="text-xs text-gray-400">{config.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </>
  );
}

{/* Integrations Tab Panel Component */}
interface IntegrationsTabPanelProps {
  projectId: string;
}

function IntegrationsTabPanel({ projectId }: IntegrationsTabPanelProps) {
  const [activeTab, setActiveTab] = useState<'github' | 'vercel'>('github');

  return (
    <div className="h-full flex flex-col">
      {/* Tab Header */}
      <div className="flex border-b border-gray-700 bg-gray-800/50">
        <button
          onClick={() => setActiveTab('github')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'github'
              ? 'bg-gray-700 text-white border-b-2 border-teal-400'
              : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          <Github className="w-4 h-4" />
          <span>GitHub</span>
        </button>
        <button
          onClick={() => setActiveTab('vercel')}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'vercel'
              ? 'bg-gray-700 text-white border-b-2 border-teal-400'
              : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          <Triangle className="w-4 h-4" />
          <span>Vercel</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'github' ? (
          <GitHubIntegrationPanel
            projectId={projectId}
            className="h-full overflow-y-auto"
          />
        ) : (
          <VercelIntegrationPanel
            projectId={projectId}
            className="h-full overflow-y-auto"
          />
        )}
      </div>
    </div>
  );
}

// Conversation Floating Panel Component
interface ConversationFloatingPanelProps {
  projectId?: string;
}

function ConversationFloatingPanel({ projectId }: ConversationFloatingPanelProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { 
    conversation, 
    messages, 
    sendMessage, 
    loading: conversationLoading,
    isOnline: conversationOnline,
    hasPendingMessages,
    shouldScrollToBottom
  } = useOfflineConversation(projectId);

  // Auto-scroll messages to bottom when shouldScrollToBottom is true
  useEffect(() => {
    if (shouldScrollToBottom && messagesContainerRef.current) {
      console.log('🔽 FloatingPanel: Auto-scrolling to bottom (shouldScrollToBottom trigger)');
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [shouldScrollToBottom, messages]);

  // Auto-scroll to bottom when messages are first loaded (on refresh/page load)
  useEffect(() => {
    if (messages && messages.length > 0 && messagesContainerRef.current) {
      console.log('🔽 FloatingPanel: Auto-scrolling on load:', messages.length, 'messages');
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 200);
    }
  }, [messages?.length]);

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const messageText = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      await sendMessage(messageText, 'text');
      // Focus input after message is sent
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('[ConversationFloatingPanel] Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-300">
        <p>No project selected</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-300">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <MessageList 
          messages={messages || []}
          isStreaming={false}
          className="space-y-4"
        />
      </div>
      
      {/* Message Input */}
      <div className="border-t border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about your project..."
            disabled={isLoading || conversationLoading}
            className="flex-1 bg-gray-800 border-gray-600 text-white"
          />
          <Button 
            type="submit" 
            disabled={!message.trim() || isLoading || conversationLoading}
            size="icon"
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isLoading ? '⏳' : '→'}
          </Button>
        </form>
        {hasPendingMessages && (
          <div className="text-xs text-orange-400 mt-2">
            📤 {conversationOnline ? 'Syncing...' : 'Messages queued for sync'}
          </div>
        )}
      </div>
    </div>
  );
}

// Floating Action Button Component
interface FloatingActionButtonProps {
  content: FloatingWindowContent;
  onClick: () => void;
  className?: string;
}

export function FloatingActionButton({ content, onClick, className = '' }: FloatingActionButtonProps) {
  const config = contentConfig[content];
  const IconComponent = config.icon;

  return (
    <button
      onClick={onClick}
      className={`
        w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 
        hover:from-teal-600 hover:to-cyan-600
        rounded-full shadow-lg hover:shadow-xl
        flex items-center justify-center
        transition-all duration-200 transform hover:scale-105
        text-white
        ${className}
      `}
      title={config.title}
    >
      <IconComponent className="w-5 h-5" />
    </button>
  );
}

// Floating Agents Panel Component
interface FloatingAgentsPanelProps {
  projectId?: string;
}

function FloatingAgentsPanel({ projectId }: FloatingAgentsPanelProps) {
  // Import the existing AgentActivityPanel as a floating version
  // We need to modify it to work without the fixed positioning
  return (
    <div className="h-full">
      <AgentActivityPanelFloating projectId={projectId} />
    </div>
  );
}

// Modified version of AgentActivityPanel for floating window use

function AgentActivityPanelFloating({ projectId }: { projectId?: string }) {
  // Get ecosystem data from hook with safe fallbacks
  const {
    isEnabled = false,
    agents = [],
    controlAgent,
    applySuggestion
  } = useLivingEcosystem(projectId) || {};
  
  // Show message if not enabled or no agents
  if (!isEnabled) {
    return (
      <div className="h-full flex items-center justify-center text-gray-300">
        <div className="text-center">
          <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Living Ecosystem is disabled</p>
          <p className="text-sm text-gray-500 mt-2">Enable in environment to see AI agents</p>
        </div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-300">
        <div className="text-center">
          <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No active agents</p>
          <p className="text-sm text-gray-500 mt-2">Send complex intents to spawn AI agents</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-700 p-4 bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">AI Agents</h3>
            <p className="text-sm text-gray-400">
              {agents.filter(a => a.status === 'active').length} active, {agents.length} total
            </p>
          </div>
        </div>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {agents
          .sort((a, b) => {
            // Active agents first
            if (a.status === 'active' && b.status !== 'active') return -1;
            if (b.status === 'active' && a.status !== 'active') return 1;
            return 0;
          })
          .map((agent) => (
            <AgentCardFloating
              key={agent.id}
              agent={agent}
              onAction={controlAgent ? (action) => controlAgent(agent.id, action) : undefined}
              onSuggestionApply={applySuggestion ? (index) => applySuggestion(agent.id, index) : undefined}
            />
          ))}
      </div>
      
      {/* Footer */}
      <div className="border-t border-gray-700 p-4 bg-gray-800/50">
        <div className="text-xs text-gray-400 text-center">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

// Simplified Agent Card for floating window
function AgentCardFloating({ agent, onAction, onSuggestionApply }: {
  agent: any;
  onAction?: (action: 'pause' | 'resume' | 'stop') => void;
  onSuggestionApply?: (suggestionIndex: number) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getAgentConfig = (type: string) => {
    switch (type) {
      case 'architect': return { icon: '🏗️', name: 'Architect', color: 'blue' };
      case 'performance': return { icon: '⚡', name: 'Performance', color: 'yellow' };
      case 'security': return { icon: '🔒', name: 'Security', color: 'red' };
      case 'ux': return { icon: '🎨', name: 'UX', color: 'purple' };
      case 'integration': return { icon: '🔗', name: 'Integration', color: 'green' };
      default: return { icon: '🤖', name: 'Agent', color: 'gray' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />;
      case 'paused': return <PauseIcon className="w-3 h-3 text-yellow-500" />;
      case 'completed': return <CheckIcon className="w-3 h-3 text-green-500" />;
      case 'failed': return <X className="w-3 h-3 text-red-500" />;
      default: return <ClockIcon className="w-3 h-3 text-gray-500" />;
    }
  };

  const config = getAgentConfig(agent.type);

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{config.icon}</div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-white">
                {config.name} Agent
              </h4>
              {getStatusIcon(agent.status)}
            </div>
            <p className="text-xs text-gray-400">{agent.progress}% complete</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {agent.status === 'active' && onAction && (
            <button
              onClick={() => onAction('pause')}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
              title="Pause agent"
            >
              <PauseIcon className="w-4 h-4" />
            </button>
          )}
          {agent.status === 'paused' && onAction && (
            <button
              onClick={() => onAction('resume')}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
              title="Resume agent"
            >
              <PlayIcon className="w-4 h-4" />
            </button>
          )}
          {agent.status === 'failed' && onAction && (
            <button
              onClick={() => onAction('resume')}
              className="p-1 hover:bg-gray-700 rounded text-green-400 hover:text-green-300"
              title="Restart agent"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {agent.status !== 'completed' && (
        <div className="mb-3">
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ease-out ${
                agent.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
              }`}
              style={{ width: `${agent.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Current Task */}
      {agent.currentTask && (
        <div className="mb-3">
          <div className="text-sm text-gray-300 bg-gray-700 rounded p-2">
            {agent.currentTask}
          </div>
        </div>
      )}

      {/* Expandable Content */}
      {(agent.insights?.length || agent.suggestions?.length) && (
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-teal-400 hover:text-teal-300 flex items-center space-x-1"
          >
            <span>
              {agent.insights?.length ? `💡 ${agent.insights.length} insights` : ''}
              {agent.insights?.length && agent.suggestions?.length ? ', ' : ''}
              {agent.suggestions?.length ? `🎯 ${agent.suggestions.length} suggestions` : ''}
            </span>
            <span>{isExpanded ? '▼' : '▶'}</span>
          </button>
          
          {isExpanded && (
            <div className="mt-3 space-y-2">
              {/* Insights */}
              {agent.insights?.map((insight, index) => (
                <div key={index} className="text-sm text-gray-300 bg-gray-700 rounded p-2">
                  💡 {insight}
                </div>
              ))}
              
              {/* Suggestions */}
              {agent.suggestions?.map((suggestion, index) => (
                <div key={index} className="text-sm bg-gray-700 rounded p-3">
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-medium text-white">{suggestion.title}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      suggestion.impact === 'high' ? 'bg-red-600 text-white' :
                      suggestion.impact === 'medium' ? 'bg-yellow-600 text-white' :
                      'bg-green-600 text-white'
                    }`}>
                      {suggestion.impact}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-2">{suggestion.description}</p>
                  {onSuggestionApply && (
                    <button
                      onClick={() => onSuggestionApply(index)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        suggestion.autoApplicable
                          ? 'bg-teal-600 text-white hover:bg-teal-700'
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                    >
                      {suggestion.autoApplicable ? 'Apply' : 'Review'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}