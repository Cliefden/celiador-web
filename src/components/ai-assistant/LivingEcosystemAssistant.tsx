'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, Brain, Zap, Shield, Palette, Link, Send, Lightbulb, Activity, Users } from 'lucide-react';
import { useLivingEcosystem } from '../../hooks/useLivingEcosystem';
import { useOfflineConversation } from '../conversation/useOfflineConversation';
import { MessageList } from '../conversation/MessageList';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ProactiveAI } from './ProactiveAI';

interface LivingEcosystemAssistantProps {
  projectId?: string;
  className?: string;
}

interface ProjectInsight {
  id: string;
  type: 'pattern' | 'optimization' | 'security' | 'performance';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
}

interface IntentSuggestion {
  intent: string;
  description: string;
  agents: string[];
  icon: string;
  complexity: 'simple' | 'moderate' | 'complex';
}

export function LivingEcosystemAssistant({ projectId, className = '' }: LivingEcosystemAssistantProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'agents' | 'insights'>('chat');
  const [aiThinking, setAiThinking] = useState(false);
  const [currentContext, setCurrentContext] = useState<string>('');
  const [suggestedActions, setSuggestedActions] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Living Ecosystem hooks
  const {
    isEnabled,
    isConnected,
    agents,
    projectDNA,
    activeIntent,
    processUserIntent,
    isComplexIntent,
    ecosystemStatus
  } = useLivingEcosystem(projectId);

  // Conversation hook
  const {
    conversation,
    messages,
    sendMessage,
    loading: conversationLoading,
    shouldScrollToBottom
  } = useOfflineConversation(projectId);

  // Auto-scroll messages
  useEffect(() => {
    if (shouldScrollToBottom && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [shouldScrollToBottom, messages]);

  // AI Context Analysis - analyze user input for intelligent responses
  useEffect(() => {
    if (message.length > 10) {
      setAiThinking(true);
      const timer = setTimeout(() => {
        // Simulate AI understanding context
        const contexts = [
          'I notice you\'re working with React components',
          'Analyzing your project structure...',
          'I see performance optimization opportunities',
          'Detecting UI/UX improvement areas',
          'Security patterns being evaluated'
        ];
        setCurrentContext(contexts[Math.floor(Math.random() * contexts.length)]);
        setAiThinking(false);
        
        // Generate contextual suggestions
        const suggestions = [
          'Would you like me to analyze component performance?',
          'I can suggest architectural improvements',
          'Shall I review your security implementation?',
          'Want me to check accessibility compliance?'
        ];
        setSuggestedActions(suggestions.slice(0, 2));
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      setCurrentContext('');
      setSuggestedActions([]);
    }
  }, [message]);

  // Simulate AI typing when processing complex intents
  useEffect(() => {
    if (isComplexIntent(message) && message.length > 5) {
      setIsTyping(true);
      const timer = setTimeout(() => setIsTyping(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [message, isComplexIntent]);

  // Sample project insights (would come from backend in real implementation)
  const projectInsights: ProjectInsight[] = [
    {
      id: '1',
      type: 'pattern',
      title: 'React Hook Pattern Detected',
      description: 'Consistent use of custom hooks for state management',
      confidence: 0.92,
      actionable: false
    },
    {
      id: '2',
      type: 'optimization',
      title: 'Bundle Size Optimization',
      description: 'Several unused dependencies detected in package.json',
      confidence: 0.87,
      actionable: true
    },
    {
      id: '3',
      type: 'security',
      title: 'Authentication Flow',
      description: 'Strong authentication patterns with proper token handling',
      confidence: 0.95,
      actionable: false
    }
  ];

  // Smart intent suggestions based on project state and DNA
  const getIntentSuggestions = (): IntentSuggestion[] => {
    const suggestions: IntentSuggestion[] = [
      {
        intent: 'modernize the user interface design',
        description: 'Update UI components with latest design trends',
        agents: ['ux', 'architect'],
        icon: '🎨',
        complexity: 'moderate'
      },
      {
        intent: 'optimize application performance',
        description: 'Analyze and improve loading speed and responsiveness',
        agents: ['performance', 'architect'],
        icon: '⚡',
        complexity: 'moderate'
      },
      {
        intent: 'enhance security and data protection',
        description: 'Review security practices and implement improvements',
        agents: ['security', 'integration'],
        icon: '🔒',
        complexity: 'complex'
      },
      {
        intent: 'improve accessibility compliance',
        description: 'Ensure WCAG compliance and better user experience',
        agents: ['ux'],
        icon: '♿',
        complexity: 'simple'
      },
      {
        intent: 'add real-time features',
        description: 'Integrate WebSocket functionality and live updates',
        agents: ['integration', 'architect'],
        icon: '📡',
        complexity: 'complex'
      }
    ];

    // Filter suggestions based on project DNA patterns
    return suggestions.slice(0, 3); // Show top 3 suggestions
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const messageText = message.trim();
    setMessage('');
    setCurrentContext('');
    setSuggestedActions([]);
    setIsLoading(true);

    try {
      if (isEnabled && isConnected && isComplexIntent(messageText) && projectId) {
        // Show AI coordination preview
        setCurrentContext('🧠 Coordinating AI agents for complex task...');
        
        // Use Living Ecosystem for complex intents
        const result = await processUserIntent(messageText, {
          projectId,
          userId: 'user',
          projectContext: {
            name: 'Current Project',
            tech_stack: ['React', 'TypeScript', 'Next.js'],
            current_files: []
          }
        });

        // Still send to regular conversation for chat history
        await sendMessage(messageText, 'text');

        console.log('🌟 Intent processed with Living Ecosystem:', result);
        
        // Show success feedback
        setCurrentContext('✨ AI agents successfully coordinated!');
        setTimeout(() => setCurrentContext(''), 3000);
      } else {
        // Enhanced regular conversation with context
        setCurrentContext('🤖 Processing your request...');
        await sendMessage(messageText, 'text');
        setCurrentContext('💡 Response generated!');
        setTimeout(() => setCurrentContext(''), 2000);
      }

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      setCurrentContext('❌ Something went wrong');
      setTimeout(() => setCurrentContext(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: IntentSuggestion) => {
    setMessage(suggestion.intent);
    inputRef.current?.focus();
  };

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'architect': return <Brain className="w-4 h-4" />;
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      case 'ux': return <Palette className="w-4 h-4" />;
      case 'integration': return <Link className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  const getAgentColor = (type: string, status: string) => {
    const colors = {
      architect: 'text-blue-400',
      performance: 'text-yellow-400', 
      security: 'text-red-400',
      ux: 'text-purple-400',
      integration: 'text-green-400'
    };
    
    if (status === 'failed') return 'text-red-500';
    if (status === 'completed') return 'text-green-500';
    if (status === 'paused') return 'text-gray-400';
    
    return colors[type as keyof typeof colors] || 'text-gray-400';
  };

  const getInsightIcon = (type: ProjectInsight['type']) => {
    switch (type) {
      case 'pattern': return <Brain className="w-4 h-4 text-blue-400" />;
      case 'optimization': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'security': return <Shield className="w-4 h-4 text-red-400" />;
      case 'performance': return <Activity className="w-4 h-4 text-green-400" />;
    }
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-300">
        <div className="text-center">
          <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Select a project to start using the AI Assistant</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col bg-gray-900 ${className}`}>
      {/* Header with Living Ecosystem Status */}
      <div className="border-b border-gray-700 p-4 bg-gray-800/50 backdrop-blur-sm relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="relative">
                <Sparkles className="w-6 h-6 text-teal-400 transition-all duration-300 hover:text-teal-300 hover:scale-110" />
                {isEnabled && isConnected && (
                  <>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
                  </>
                )}
                {isEnabled && (
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 to-cyan-400/20 rounded-full animate-pulse" style={{ animationDuration: '2s' }} />
                )}
              </div>
            </div>
            <div>
              <h2 className="font-semibold text-white">Living Ecosystem AI</h2>
              <p className="text-xs text-gray-400">
                {currentContext ? (
                  <span className="text-teal-400 animate-pulse">{currentContext}</span>
                ) : isEnabled ? (
                  isConnected ? 'Ready to coordinate • ' + agents.filter(a => a.status === 'active').length + ' agents standing by' : 'Establishing connections...'
                ) : (
                  'Standard mode • Enhanced AI available'
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveView('chat')}
              className={`p-2 rounded-lg transition-colors ${
                activeView === 'chat' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:bg-gray-700'
              }`}
              title="Chat"
            >
              <Bot className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveView('agents')}
              className={`p-2 rounded-lg transition-colors ${
                activeView === 'agents' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:bg-gray-700'
              }`}
              title="Agents"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveView('insights')}
              className={`p-2 rounded-lg transition-colors ${
                activeView === 'insights' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:bg-gray-700'
              }`}
              title="Insights"
            >
              <Lightbulb className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Intent Status */}
        {activeIntent && (
          <div className="bg-teal-900/30 border border-teal-600/50 rounded-lg p-3 relative overflow-hidden backdrop-blur-sm">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 animate-pulse" />
            <div className="flex items-center space-x-2 mb-1 relative z-10">
              <div className="relative w-2 h-2">
                <div className="absolute w-2 h-2 bg-teal-400 rounded-full animate-ping" />
                <div className="w-2 h-2 bg-teal-400 rounded-full" />
              </div>
              <span className="text-sm font-medium text-teal-200">Processing Intent</span>
              <span className="text-xs text-gray-400">#{activeIntent.intentId.split('_')[1]}</span>
            </div>
            <p className="text-sm text-gray-300 mb-2">"{activeIntent.userIntent}"</p>
            <div className="relative w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-teal-500 to-cyan-400 h-2 rounded-full transition-all duration-500 shadow-lg"
                style={{ 
                  width: `${activeIntent.progress}%`,
                  boxShadow: '0 0 8px rgba(20, 184, 166, 0.6)'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" style={{ animationDuration: '1.5s' }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">{activeIntent.status} • {activeIntent.progress}% complete</p>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative z-10">
        {activeView === 'chat' && (
          <div className="h-full flex flex-col">
            {/* Messages Container */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {/* Always show ProactiveAI at the top */}
              <div className="mb-4">
                <ProactiveAI projectId={projectId} agents={agents} isEnabled={isEnabled} />
              </div>
              
              {conversation && messages && messages.length > 0 ? (
                <MessageList 
                  messages={messages || []}
                  isStreaming={false}
                  className="space-y-4"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300">
                  <div className="text-center max-w-md">
                    <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                      <Sparkles className="w-16 h-16 text-teal-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Welcome to Living Ecosystem AI</h3>
                    <p className="text-sm text-gray-400 mb-6">
                      I'm your intelligent project coordinator. Ask me anything or choose from suggestions below.
                    </p>
                    
                    {/* Intent Suggestions */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">What can I help you with?</p>
                        <div className="text-sm text-gray-300 mb-4">
                          <p>👋 I'm your AI ecosystem coordinator. I can:</p>
                          <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-gray-400">
                            <li>Coordinate multiple AI agents for complex tasks</li>
                            <li>Analyze your project and suggest improvements</li>
                            <li>Provide real-time development assistance</li>
                            <li>Adapt my approach based on your project's needs</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Quick Start Ideas</p>
                        {getIntentSuggestions().map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left p-3 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600 hover:border-teal-500/50 rounded-lg transition-all duration-300 group backdrop-blur-sm shadow-lg hover:shadow-teal-500/20 transform hover:scale-[1.02]"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{suggestion.icon}</span>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-white group-hover:text-teal-300 transition-colors duration-300">
                                  {suggestion.intent}
                                </p>
                                <p className="text-xs text-gray-400">{suggestion.description}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    suggestion.complexity === 'simple' ? 'bg-green-900/50 text-green-300' :
                                    suggestion.complexity === 'moderate' ? 'bg-yellow-900/50 text-yellow-300' :
                                    'bg-red-900/50 text-red-300'
                                  }`}>
                                    {suggestion.complexity}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Will coordinate {suggestion.agents.length} agent{suggestion.agents.length > 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-700 p-4 bg-gray-800/30 backdrop-blur-sm relative z-10">
              {/* Smart Input Suggestions */}
              {message.length > 0 && !isLoading && (
                <div className="mb-3 text-xs text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Brain className="w-3 h-3" />
                    <span>AI tip: {message.length < 10 ? 'Be more specific for better assistance' : isComplexIntent(message) ? 'Perfect! This will coordinate multiple agents' : 'I can help with this request'}</span>
                  </span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isEnabled ? "Describe what you want to improve or build..." : "Ask about your project..."}
                  disabled={isLoading || conversationLoading}
                  className="flex-1 bg-gray-800/80 border-gray-600 hover:border-teal-500/50 text-white placeholder-gray-400 transition-all duration-300 focus:border-teal-400 focus:shadow-teal-400/20 backdrop-blur-sm"
                />
                <Button 
                  type="submit" 
                  disabled={!message.trim() || isLoading || conversationLoading}
                  size="icon"
                  className="bg-teal-600 hover:bg-teal-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-teal-500/30"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
              <div className="space-y-2">
                {/* AI Context Display */}
                {(currentContext || aiThinking) && (
                  <div className="text-xs text-teal-400 flex items-center space-x-2 bg-teal-900/20 rounded-lg p-2 border border-teal-500/30">
                    {aiThinking ? (
                      <>
                        <div className="w-3 h-3 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                        <span>AI analyzing your input...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>{currentContext}</span>
                      </>
                    )}
                  </div>
                )}
                
                {/* Smart Suggestions */}
                {suggestedActions.length > 0 && (
                  <div className="bg-blue-900/20 rounded-lg p-2 border border-blue-500/30">
                    <p className="text-xs text-blue-400 mb-1">💡 I can also help with:</p>
                    <div className="space-y-1">
                      {suggestedActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => setMessage(action.replace('Would you like me to ', '').replace('?', ''))}
                          className="block text-xs text-blue-300 hover:text-blue-200 transition-colors"
                        >
                          • {action}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Agent Coordination Preview */}
                {isEnabled && isComplexIntent(message) && (
                  <div className="bg-gradient-to-r from-teal-900/30 to-purple-900/30 rounded-lg p-3 border border-teal-500/30">
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
                      <span className="text-sm text-teal-300 font-medium">Multi-Agent Coordination Ready</span>
                    </div>
                    <p className="text-xs text-gray-300 mb-2">This request will activate specialized AI agents:</p>
                    <div className="flex flex-wrap gap-1">
                      {['🏗️ Architect', '⚡ Performance', '🔒 Security', '🎨 UX'].map((agent, index) => (
                        <span key={index} className="text-xs bg-teal-800/30 text-teal-300 px-2 py-1 rounded">
                          {agent}
                        </span>
                      ))}
                    </div>
                    {isTyping && (
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="text-teal-400">...</div>
                        <span className="text-xs text-teal-400">AI preparing coordination plan...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Quick Actions */}
              {!isLoading && message.length === 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {['analyze code', 'check security', 'improve performance', 'review UI'].map((action) => (
                    <button
                      key={action}
                      onClick={() => setMessage(action)}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'agents' && (
          <div className="h-full overflow-y-auto p-4 relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">AI Agents</h3>
                <span className="text-sm text-gray-400">
                  {agents.filter(a => a.status === 'active').length} active
                </span>
              </div>
              
              {agents.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="relative mx-auto mb-3 w-12 h-12">
                    <Users className="w-12 h-12 animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                  </div>
                  <p>No agents currently active</p>
                  <p className="text-sm">Send a complex intent to spawn agents</p>
                </div>
              ) : (
                agents.map((agent) => (
                  <div key={agent.id} className="bg-gray-800/80 border border-gray-600 hover:border-teal-500/50 rounded-lg p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20 group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`relative ${getAgentColor(agent.type, agent.status)}`}>
                          <div className="transition-all duration-300 group-hover:scale-110">
                            {getAgentIcon(agent.type)}
                          </div>
                          {agent.status === 'active' && (
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 to-cyan-400/20 rounded-full animate-pulse" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-white capitalize group-hover:text-teal-300 transition-colors">{agent.type} Agent</h4>
                          <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">{agent.status} • {agent.progress}%</p>
                        </div>
                      </div>
                    </div>
                    
                    {agent.currentTask && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-300">{agent.currentTask}</p>
                      </div>
                    )}
                    
                    {agent.progress > 0 && agent.status !== 'completed' && (
                      <div className="relative w-full bg-gray-700 rounded-full h-2 mb-3 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            agent.status === 'active' ? 'bg-gradient-to-r from-teal-500 to-cyan-400 shadow-teal-400/50' : 'bg-gray-500'
                          }`}
                          style={{ 
                            width: `${agent.progress}%`,
                            boxShadow: agent.status === 'active' ? '0 0 8px rgba(20, 184, 166, 0.5)' : 'none'
                          }}
                        />
                        {agent.status === 'active' && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                        )}
                      </div>
                    )}
                    
                    {agent.insights && agent.insights.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Insights</p>
                        {agent.insights.slice(0, 2).map((insight, index) => (
                          <div key={index} className="text-sm text-gray-300 bg-gray-700/50 rounded p-2">
                            💡 {insight}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeView === 'insights' && (
          <div className="h-full overflow-y-auto p-4 relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Project Insights</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <span>DNA Confidence:</span>
                  <span className="text-teal-400">{Math.round(projectDNA.confidence * 100)}%</span>
                </div>
              </div>

              {/* Project DNA Patterns */}
              <div className="bg-gray-800/80 border border-gray-600 hover:border-purple-500/50 rounded-lg p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
                <h4 className="font-medium text-white mb-3 flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-teal-400" />
                  <span>Detected Patterns</span>
                </h4>
                <div className="space-y-2">
                  {projectDNA.patterns.map((pattern, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300 capitalize">{pattern.type.replace('-', ' ')}</span>
                      <div className="flex items-center space-x-2">
                        <div className="relative w-16 bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-teal-500 to-cyan-400 h-2 rounded-full transition-all duration-1000 shadow-lg"
                            style={{ 
                              width: `${pattern.confidence * 100}%`,
                              boxShadow: '0 0 6px rgba(20, 184, 166, 0.5)'
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" style={{ animationDuration: '2s' }} />
                        </div>
                        <span className="text-xs text-gray-400">{Math.round(pattern.confidence * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-400 mt-3">{projectDNA.lastInsight}</p>
              </div>

              {/* Project Insights */}
              <div className="space-y-3">
                {projectInsights.map((insight) => (
                  <div key={insight.id} className="bg-gray-800/80 border border-gray-600 hover:border-blue-500/50 rounded-lg p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="transition-all duration-300 group-hover:scale-110">
                          {getInsightIcon(insight.type)}
                        </div>
                        <h4 className="font-medium text-white group-hover:text-blue-300 transition-colors">{insight.title}</h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          insight.actionable ? 'bg-orange-900/50 text-orange-300' : 'bg-green-900/50 text-green-300'
                        }`}>
                          {insight.actionable ? 'Action needed' : 'Good'}
                        </span>
                        <span className="text-xs text-gray-400">{Math.round(insight.confidence * 100)}%</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors">{insight.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}