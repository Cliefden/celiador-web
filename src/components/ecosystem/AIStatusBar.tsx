'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useLivingEcosystem } from '../../hooks/useLivingEcosystem';

interface Agent {
  id: string;
  type: 'architect' | 'performance' | 'security' | 'ux' | 'integration';
  status: 'active' | 'paused' | 'completed' | 'failed';
  progress: number;
  currentTask?: string;
}

interface ProjectDNA {
  confidence: number;
  patterns: Array<{
    type: string;
    confidence: number;
  }>;
  lastInsight: string;
}

interface AIStatusBarProps {
  projectId?: string;
  userId?: string;
  className?: string;
  onToggleDetails?: () => void;
}

const getAgentIcon = (type: Agent['type']) => {
  switch (type) {
    case 'architect': return '🏗️';
    case 'performance': return '⚡';
    case 'security': return '🔒';
    case 'ux': return '🎨';
    case 'integration': return '🔗';
    default: return '🤖';
  }
};

const getAgentColor = (status: Agent['status']) => {
  switch (status) {
    case 'active': return 'text-green-600 bg-green-100';
    case 'paused': return 'text-yellow-600 bg-yellow-100';
    case 'completed': return 'text-blue-600 bg-blue-100';
    case 'failed': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export function AIStatusBar({ projectId, userId, className = "", onToggleDetails }: AIStatusBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get ecosystem data from hook with safe fallbacks
  const {
    isEnabled = false,
    isConnected = false,
    agents = [],
    projectDNA = { confidence: 0, patterns: [], lastInsight: "No insights yet" },
    ecosystemStatus = 'disabled'
  } = useLivingEcosystem(projectId) || {};
  
  const activeAgents = agents.filter(agent => agent.status === 'active');
  const totalProgress = agents.length > 0 
    ? Math.round(agents.reduce((sum, agent) => sum + agent.progress, 0) / agents.length)
    : 0;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggleDetails?.();
  };

  // Show different status based on ecosystem state
  if (!isEnabled) {
    return (
      <div className={`bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-4 py-2 ${className}`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-sm text-gray-700 font-medium">AI Assistant</span>
              <span className="text-xs text-amber-600">Standard Mode</span>
            </div>
          </div>
          
          <div className="text-xs text-gray-600">
            ℹ️ Connecting to Living Ecosystem...
          </div>
        </div>
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 px-4 py-2 ${className}`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              <span className="text-sm text-gray-600 font-medium">Living Ecosystem</span>
              <span className="text-xs text-green-600">{isConnected ? 'Connected' : 'Connecting...'}</span>
            </div>
            
            <div className="text-xs text-gray-500">
              🧬 DNA Confidence: {Math.round(projectDNA.confidence * 100)}%
            </div>
          </div>
          
          <div className="text-xs text-gray-500">
            💡 {projectDNA.lastInsight}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-gray-800 to-gray-900 text-white border-b border-gray-700 ${className}`}>
      {/* Main Status Bar */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-semibold">Living Ecosystem Active</span>
              <span className="text-gray-300">
                {activeAgents.length} agent{activeAgents.length !== 1 ? 's' : ''} working
              </span>
            </div>
            
            {/* Agent Icons */}
            <div className="flex items-center space-x-1">
              {agents.slice(0, 5).map((agent) => (
                <div
                  key={agent.id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    agent.status === 'active' 
                      ? 'bg-white bg-opacity-20 ring-2 ring-white ring-opacity-50' 
                      : 'bg-white bg-opacity-10'
                  }`}
                  title={`${agent.type} agent - ${agent.status}`}
                >
                  {getAgentIcon(agent.type)}
                </div>
              ))}
              {agents.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-white bg-opacity-10 flex items-center justify-center text-xs">
                  +{agents.length - 5}
                </div>
              )}
            </div>

            {/* Progress */}
            <div className="flex items-center space-x-2">
              <div className="w-24 h-2 bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-400 transition-all duration-500 ease-out"
                  style={{ width: `${totalProgress}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">{totalProgress}%</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm">
              🧬 DNA: {Math.round(projectDNA.confidence * 100)}%
            </div>
            
            <button
              onClick={handleToggle}
              className="flex items-center space-x-1 px-3 py-1 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-all"
            >
              <span className="text-sm">Details</span>
              {isExpanded ? (
                <ChevronUpIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="bg-gray-800 border-t border-gray-600">
          <div className="px-4 py-3 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Active Agents */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white">Active Agents</h4>
                {activeAgents.map((agent) => (
                  <div key={agent.id} className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{getAgentIcon(agent.type)}</span>
                      <span className="font-medium capitalize">{agent.type}</span>
                      <div className="ml-auto text-xs bg-gray-600 text-white px-2 py-1 rounded-full">
                        {agent.progress}%
                      </div>
                    </div>
                    {agent.currentTask && (
                      <div className="text-xs text-gray-300 mt-1">
                        {agent.currentTask}
                      </div>
                    )}
                    <div className="w-full h-1 bg-gray-600 rounded-full mt-2">
                      <div 
                        className="h-full bg-green-400 rounded-full transition-all duration-300"
                        style={{ width: `${agent.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Project DNA */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white">Project DNA</h4>
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Overall Confidence</span>
                      <span className="font-semibold">{Math.round(projectDNA.confidence * 100)}%</span>
                    </div>
                    {projectDNA.patterns.slice(0, 3).map((pattern, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-xs text-gray-300 capitalize">{pattern.type}</span>
                        <span className="text-xs font-medium">{Math.round(pattern.confidence * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Insights */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white">Latest Insight</h4>
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="text-sm text-gray-300">
                    💡 {projectDNA.lastInsight}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}