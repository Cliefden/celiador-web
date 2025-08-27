'use client';

import { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Plus, 
  Settings, 
  MessageCircle, 
  Play, 
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  User,
  LogOut,
  Zap,
  FileText,
  Cpu,
  Trash2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { supabase } from '../../lib/supabase';

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

interface ProjectStats {
  conversationCount: number;
  runningJobs: number;
  recentActivity: string;
}

interface ProjectSidebarProps {
  projects: Project[];
  selectedProject: Project | null;
  onProjectSelect: (project: Project) => void;
  onCreateProject: () => void;
  onDeleteProject: (project: Project) => void;
  user: User;
  onLogout: () => void;
}

export function ProjectSidebar({ 
  projects, 
  selectedProject, 
  onProjectSelect, 
  onCreateProject, 
  onDeleteProject,
  user, 
  onLogout 
}: ProjectSidebarProps) {
  const [projectStats, setProjectStats] = useState<{ [key: string]: ProjectStats }>({});
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);

  // Load project statistics
  useEffect(() => {
    const loadProjectStats = async () => {
      const stats: { [key: string]: ProjectStats } = {};
      
      for (const project of projects) {
        try {
          // Get conversation count
          const { data: conversations } = await supabase
            .from('conversations')
            .select('id')
            .eq('projectid', project.id)
            .eq('status', 'ACTIVE');

          // Get running jobs count
          const { data: jobs } = await supabase
            .from('jobs')
            .select('id, status, createdat')
            .eq('projectid', project.id)
            .order('createdat', { ascending: false })
            .limit(5);

          const runningJobs = jobs?.filter(job => job.status === 'RUNNING').length || 0;
          const recentJob = jobs?.[0];
          
          stats[project.id] = {
            conversationCount: conversations?.length || 0,
            runningJobs,
            recentActivity: recentJob ? new Date(recentJob.createdat).toLocaleDateString() : 'No activity'
          };
        } catch (error) {
          console.error(`Error loading stats for project ${project.id}:`, error);
          stats[project.id] = {
            conversationCount: 0,
            runningJobs: 0,
            recentActivity: 'No activity'
          };
        }
      }
      
      setProjectStats(stats);
    };

    if (projects.length > 0) {
      loadProjectStats();
    }
  }, [projects]);

  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const getProjectStatusIcon = (project: Project) => {
    const stats = projectStats[project.id];
    if (stats?.runningJobs > 0) {
      return <Play className="w-3 h-3 text-blue-500 animate-pulse" />;
    }
    if (project.status === 'READY') {
      return <CheckCircle className="w-3 h-3 text-green-500" />;
    }
    return <Clock className="w-3 h-3 text-gray-500" />;
  };

  return (
    <div className="w-80 h-screen bg-muted/30 border-r flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Bether Studio</h1>
        <p className="text-sm text-muted-foreground">Conversational Development</p>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user.name || user.email}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setShowSettings(!showSettings)}
              className="p-1"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onLogout} className="p-1">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b bg-blue-50/50">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Workspace Tools</h3>
            <div className="space-y-1">
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                <Cpu className="w-3 h-3 mr-2" />
                AI Models & Settings
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                <Zap className="w-3 h-3 mr-2" />
                API Keys
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs">
                <FileText className="w-3 h-3 mr-2" />
                Service Integrations
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Projects */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Active Projects</h2>
            <Button size="sm" onClick={onCreateProject}>
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
          
          <div className="space-y-2">
            {projects.map((project) => {
              const stats = projectStats[project.id];
              const isExpanded = expandedProjects.has(project.id);
              const isSelected = selectedProject?.id === project.id;
              
              return (
                <Card 
                  key={project.id}
                  className={`cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <CardContent className="p-3">
                    <div
                      onClick={() => onProjectSelect(project)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <div className="flex items-center space-x-1">
                          {getProjectStatusIcon(project)}
                          <h3 className="font-medium truncate">{project.name}</h3>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleProjectExpansion(project.id);
                        }}
                        className="p-1"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Project Stats */}
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{stats?.conversationCount || 0}</span>
                        </div>
                        {stats?.runningJobs > 0 && (
                          <div className="flex items-center space-x-1 text-blue-600">
                            <Play className="w-3 h-3" />
                            <span>{stats.runningJobs}</span>
                          </div>
                        )}
                      </div>
                      <span>{new Date(project.updatedat).toLocaleDateString()}</span>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && stats && (
                      <div className="mt-3 pt-2 border-t border-muted space-y-2">
                        <div className="text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Template:</span>
                            <span className="font-mono text-xs">{project.templatekey}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Repository:</span>
                            <span className="font-mono text-xs">{project.repoowner}/{project.reponame}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Last Activity:</span>
                            <span>{stats.recentActivity}</span>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="space-y-2">
                            <div className="flex space-x-1">
                              <Button variant="outline" size="sm" className="text-xs flex-1">
                                <MessageCircle className="w-3 h-3 mr-1" />
                                Chat
                              </Button>
                              <Button variant="outline" size="sm" className="text-xs flex-1">
                                <FolderOpen className="w-3 h-3 mr-1" />
                                Files
                              </Button>
                            </div>
                            <Button 
                              variant="destructive" 
                              size="sm" 
                              className="text-xs w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to delete "${project.name}"? This will permanently delete the project and all its files. This action cannot be undone.`)) {
                                  onDeleteProject(project);
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete Project
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            
            {projects.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No projects yet</p>
                <p className="text-sm">Create your first project to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}