'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { CreateProjectModal } from '../project/CreateProjectModal';
import { FloatingWindowController } from './FloatingWindowController';
import { LivingEcosystemAssistant } from '../ai-assistant/LivingEcosystemAssistant';
import { useLivingEcosystem } from '../../hooks/useLivingEcosystem';
import { useOnboarding } from '../../hooks/useOnboarding';
import { 
  Plus, 
  Sparkles,
  Brain,
  Zap,
  Shield,
  Palette,
  Link,
  LogOut,
  User,
  Monitor,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Play
} from 'lucide-react';
import { CeliadorLogo } from '../ui/celiador-logo';
import { OnboardingFlow } from '../onboarding/OnboardingFlow';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  templatekey: string;
  repoprovider: string;
  repoowner: string;
  reponame: string;
  createdat: string;
  updatedat: string;
}

interface LivingEcosystemDashboardProps {
  initialUser: User;
  onLogout: () => void;
}

export function LivingEcosystemDashboard({ initialUser, onLogout }: LivingEcosystemDashboardProps) {
  const [user] = useState<User>(initialUser);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Living Ecosystem state
  const {
    isEnabled,
    isConnected,
    agents,
    projectDNA,
    activeIntent,
    ecosystemStatus
  } = useLivingEcosystem(selectedProject?.id);

  // Onboarding
  const {
    showOnboarding,
    currentStep,
    completeStep,
    skipOnboarding
  } = useOnboarding();

  const fetchProjects = useCallback(async () => {
    try {
      console.log('[LivingEcosystem] Starting project fetch...');
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('[LivingEcosystem] No active session');
        return;
      }

      console.log('[LivingEcosystem] Session found, fetching projects...');
      const backendUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/projects`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      console.log('[LivingEcosystem] Response status:', response.status);
      if (response.ok) {
        const fetchedProjects = await response.json();
        console.log('[LivingEcosystem] Fetched projects:', fetchedProjects.length, fetchedProjects);
        setProjects(fetchedProjects);
        
        // Auto-select first project if none selected
        if (fetchedProjects.length > 0 && !selectedProject) {
          console.log('[LivingEcosystem] Auto-selecting project:', fetchedProjects[0].name);
          setSelectedProject(fetchedProjects[0]);
        }
      } else {
        console.error('[LivingEcosystem] Failed to fetch projects:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('[LivingEcosystem] Error fetching projects:', error);
    } finally {
      setLoading(false);
      console.log('[LivingEcosystem] Project fetch completed');
    }
  }, [selectedProject]);

  useEffect(() => {
    // Only fetch projects if we have a user
    if (user && user.id) {
      console.log('[LivingEcosystem] User available, fetching projects...');
      fetchProjects();
    } else {
      console.log('[LivingEcosystem] No user available yet');
    }
  }, [user, fetchProjects]);

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    setSelectedProject(newProject);
    setShowCreateProject(false);
  };

  const getAgentStatusSummary = () => {
    const active = agents.filter(a => a.status === 'active').length;
    const completed = agents.filter(a => a.status === 'completed').length;
    const total = agents.length;
    
    return { active, completed, total };
  };

  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'architect': return Brain;
      case 'performance': return Zap;
      case 'security': return Shield;
      case 'ux': return Palette;
      case 'integration': return Link;
      default: return Activity;
    }
  };

  const getAgentColor = (type: string, status: string) => {
    if (status === 'failed') return 'text-red-400 bg-red-900/20';
    if (status === 'completed') return 'text-green-400 bg-green-900/20';
    if (status === 'active') {
      switch (type) {
        case 'architect': return 'text-blue-400 bg-blue-900/20';
        case 'performance': return 'text-yellow-400 bg-yellow-900/20';
        case 'security': return 'text-red-400 bg-red-900/20';
        case 'ux': return 'text-purple-400 bg-purple-900/20';
        case 'integration': return 'text-green-400 bg-green-900/20';
        default: return 'text-gray-400 bg-gray-900/20';
      }
    }
    return 'text-gray-400 bg-gray-900/20';
  };

  if (showOnboarding) {
    return <OnboardingFlow onComplete={skipOnboarding} />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Navigation */}
      <div className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <CeliadorLogo className="w-8 h-8" />
              <div>
                <div className="relative">
                  <h1 className="text-xl font-bold text-white">
                    Living Ecosystem
                    {isEnabled && isConnected && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-900/50 text-teal-300 border border-teal-500/50 animate-pulse">
                        <div className="w-2 h-2 bg-teal-400 rounded-full mr-1 animate-ping" />
                        LIVE
                      </span>
                    )}
                  </h1>
                  <p className="text-sm text-gray-400">
                    {isEnabled ? (
                      isConnected ? (
                        <span>🤖 {agents.filter(a => a.status === 'active').length} agents coordinating</span>
                      ) : '🟡 Establishing neural connections...'
                    ) : (
                      '💤 Neural network dormant'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Ecosystem Status */}
            <div className="flex items-center space-x-6">
              {isEnabled && (
                <div className="flex items-center space-x-4 bg-gray-800/50 rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span className="text-sm text-white">Living Ecosystem</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <span>{getAgentStatusSummary().active} active</span>
                    <span>•</span>
                    <span>{getAgentStatusSummary().total} total</span>
                  </div>
                </div>
              )}

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-white">{user.email.split('@')[0]}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
                    <button
                      onClick={onLogout}
                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2 rounded-lg"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Main Dashboard Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column - Project Management */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Project Selection */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Projects</h2>
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New</span>
                </button>
              </div>

{loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-2 text-gray-400">Loading projects...</span>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">📁</div>
                  <p>No projects found</p>
                  <p className="text-sm text-gray-500 mt-2">Create your first project to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500 mb-2">
                    {projects.length} project{projects.length !== 1 ? 's' : ''} found
                  </div>
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        console.log('[LivingEcosystem] Selecting project:', project.name);
                        setSelectedProject(project);
                        // Add haptic feedback
                        if ('vibrate' in navigator) {
                          navigator.vibrate(50);
                        }
                      }}
                      className={`w-full text-left p-4 rounded-lg border transition-colors ${
                        selectedProject?.id === project.id
                          ? 'bg-teal-900/30 border-teal-600/50 text-white'
                          : 'bg-gray-700/30 border-gray-600/50 text-gray-300 hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{project.name}</h3>
                          <p className="text-sm text-gray-400">{project.templatekey}</p>
                        </div>
                        <div className={`relative w-2 h-2 rounded-full ${
                          project.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                        }`}>
                          {project.status === 'active' && (
                            <div className="absolute inset-0 bg-green-500 rounded-full animate-ping" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Project DNA */}
            {selectedProject && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Brain className="w-5 h-5 text-teal-400" />
                  <h3 className="text-lg font-semibold text-white">Project DNA</h3>
                  <span className="text-sm text-teal-400 bg-teal-900/30 px-2 py-1 rounded">
                    {Math.round(projectDNA.confidence * 100)}%
                  </span>
                </div>

                <div className="space-y-3">
                  {projectDNA.patterns.map((pattern, index) => (
                    <div key={index} className="flex items-center justify-between group">
                      <span className="text-sm text-gray-300 capitalize group-hover:text-white transition-colors">
                        {pattern.type.replace('-', ' ')}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="relative w-16 bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-teal-500 via-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-1000 shadow-lg"
                            style={{ 
                              width: `${pattern.confidence * 100}%`,
                              boxShadow: `0 0 8px rgba(20, 184, 166, 0.5)`
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                        </div>
                        <span className="text-xs text-gray-400 w-8 group-hover:text-teal-300 transition-colors">
                          {Math.round(pattern.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-gray-700/30 rounded-lg">
                  <p className="text-sm text-gray-300">{projectDNA.lastInsight}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Last updated: {new Date(projectDNA.lastUpdated).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}

            {/* Active Intent Status */}
            {activeIntent && (
              <div className="bg-gradient-to-br from-teal-900/30 to-blue-900/30 border border-teal-600/50 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="relative w-3 h-3">
                    <div className="absolute w-3 h-3 bg-teal-400 rounded-full animate-ping" />
                    <div className="w-3 h-3 bg-teal-400 rounded-full" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Active Intent</h3>
                </div>
                
                <p className="text-gray-300 mb-4">"{activeIntent.userIntent}"</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-teal-400">{activeIntent.progress}%</span>
                  </div>
                  <div className="relative w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-teal-500 via-cyan-400 to-blue-500 h-3 rounded-full transition-all duration-500 shadow-lg"
                      style={{ 
                        width: `${activeIntent.progress}%`,
                        boxShadow: '0 0 12px rgba(20, 184, 166, 0.6)'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </div>
                  <p className="text-xs text-gray-400 capitalize">{activeIntent.status}</p>
                </div>
              </div>
            )}
          </div>

          {/* Center Column - AI Assistant */}
          <div className="xl:col-span-1">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
              <LivingEcosystemAssistant projectId={selectedProject?.id} className="h-full" />
            </div>
          </div>

          {/* Right Column - Agent Status & Insights */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Active Agents */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">AI Agents</h3>
                <div className="flex items-center space-x-2">
                  {isConnected && (
                    <div className="relative w-2 h-2">
                      <div className="absolute w-2 h-2 bg-green-500 rounded-full animate-ping" />
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                  )}
                  <span className="text-sm text-gray-400">
                    {getAgentStatusSummary().active} active
                  </span>
                </div>
              </div>

              {agents.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No agents currently active</p>
                  <p className="text-xs text-gray-500">Send a complex intent to spawn agents</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {agents.map((agent) => {
                    const IconComponent = getAgentIcon(agent.type);
                    const colorClass = getAgentColor(agent.type, agent.status);
                    
                    return (
                      <div key={agent.id} className={`rounded-lg p-3 ${colorClass.split(' ')[1]} border border-transparent hover:border-teal-500/30 transition-all duration-300 group`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <IconComponent className={`w-4 h-4 ${colorClass.split(' ')[0]} transition-all duration-300 group-hover:scale-110`} />
                              {agent.status === 'active' && (
                                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 to-blue-500/20 rounded-full animate-pulse" />
                              )}
                            </div>
                            <span className="font-medium text-white capitalize group-hover:text-teal-300 transition-colors">
                              {agent.type} Agent
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {agent.status === 'active' && <Play className="w-3 h-3 text-green-400" />}
                            {agent.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-400" />}
                            {agent.status === 'failed' && <AlertCircle className="w-3 h-3 text-red-400" />}
                            {agent.status === 'paused' && <Clock className="w-3 h-3 text-yellow-400" />}
                            <span className="text-xs text-gray-400">{agent.progress}%</span>
                          </div>
                        </div>
                        
                        {agent.currentTask && (
                          <p className="text-xs text-gray-300 mb-2">{agent.currentTask}</p>
                        )}
                        
                        {agent.progress > 0 && agent.status !== 'completed' && (
                          <div className="relative w-full bg-gray-700 rounded-full h-1 overflow-hidden">
                            <div 
                              className={`h-1 rounded-full transition-all duration-300 ${
                                agent.status === 'active' ? 'bg-gradient-to-r from-teal-500 to-cyan-400 shadow-teal-400/50' : 'bg-gray-500'
                              }`}
                              style={{ 
                                width: `${agent.progress}%`,
                                boxShadow: agent.status === 'active' ? '0 0 6px rgba(20, 184, 166, 0.5)' : 'none'
                              }}
                            />
                            {agent.status === 'active' && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* System Metrics */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-teal-400" />
                <span>System Metrics</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center group cursor-default">
                  <div className="text-2xl font-bold text-teal-400 transition-all duration-300 group-hover:text-3xl group-hover:text-teal-300">{projects.length}</div>
                  <div className="text-xs text-gray-400 group-hover:text-gray-300">Projects</div>
                  <div className="w-full h-1 bg-teal-500/20 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full transition-all duration-1000" style={{ width: projects.length > 0 ? '100%' : '0%' }} />
                  </div>
                </div>
                <div className="text-center group cursor-default">
                  <div className="text-2xl font-bold text-blue-400 transition-all duration-300 group-hover:text-3xl group-hover:text-blue-300">{agents.length}</div>
                  <div className="text-xs text-gray-400 group-hover:text-gray-300">Total Agents</div>
                  <div className="w-full h-1 bg-blue-500/20 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: agents.length > 0 ? `${(agents.length / 5) * 100}%` : '0%' }} />
                  </div>
                </div>
                <div className="text-center group cursor-default">
                  <div className="text-2xl font-bold text-green-400 transition-all duration-300 group-hover:text-3xl group-hover:text-green-300">
                    {getAgentStatusSummary().completed}
                  </div>
                  <div className="text-xs text-gray-400 group-hover:text-gray-300">Completed</div>
                  <div className="w-full h-1 bg-green-500/20 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: agents.length > 0 ? `${(getAgentStatusSummary().completed / agents.length) * 100}%` : '0%' }} />
                  </div>
                </div>
                <div className="text-center group cursor-default">
                  <div className="text-2xl font-bold text-yellow-400 transition-all duration-300 group-hover:text-3xl group-hover:text-yellow-300">
                    {Math.round(projectDNA.confidence * 100)}%
                  </div>
                  <div className="text-xs text-gray-400 group-hover:text-gray-300">DNA Score</div>
                  <div className="w-full h-1 bg-yellow-500/20 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full transition-all duration-1000" style={{ width: `${projectDNA.confidence * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Floating Window Controller */}
      <FloatingWindowController 
        projectId={selectedProject?.id}
        className="fixed bottom-6 right-6"
      />

      {/* Create Project Modal */}
      {showCreateProject && (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  );
}