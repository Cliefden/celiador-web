'use client';

import { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Plus, 
  Settings, 
  Code, 
  Play, 
  GitBranch,
  FileText,
  Terminal,
  LogOut,
  User
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
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

interface SidebarProps {
  projects: Project[];
  selectedProject: Project | null;
  onProjectSelect: (project: Project) => void;
  onCreateProject: () => void;
  user: User;
  onLogout: () => void;
}

export function Sidebar({ projects, selectedProject, onProjectSelect, onCreateProject, user, onLogout }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'projects' | 'jobs' | 'settings'>('projects');

  return (
    <div className="w-80 h-screen bg-muted/30 border-r flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Bether Studio</h1>
        <p className="text-sm text-muted-foreground">AI-powered development</p>
      </div>

      {/* User Info */}
      <div className="p-4 border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{user.name || user.email}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={onLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            activeTab === 'projects' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FolderOpen className="w-4 h-4 inline mr-2" />
          Projects
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            activeTab === 'jobs' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Play className="w-4 h-4 inline mr-2" />
          Jobs
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 p-3 text-sm font-medium transition-colors ${
            activeTab === 'settings' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Projects</h2>
              <Button size="sm" onClick={onCreateProject}>
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </div>
            
            <div className="space-y-2">
              {projects.map((project) => (
                <Card 
                  key={project.id}
                  className={`cursor-pointer transition-colors ${
                    selectedProject?.id === project.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => onProjectSelect(project)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{project.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(project.updatedat).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        project.status === 'READY' ? 'bg-green-500' :
                        project.status === 'RUNNING' ? 'bg-yellow-500' :
                        'bg-gray-500'
                      }`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {projects.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No projects yet</p>
                  <p className="text-sm">Create your first project to get started</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <RecentJobs user={user} />
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Settings</h2>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  {user.name && (
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <p className="text-sm text-muted-foreground">{user.name}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">API Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Configure your OpenAI API key and other settings.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface Job {
  id: string;
  projectid: string;
  type: 'SCAFFOLD' | 'EDIT' | 'TEST' | 'DEPLOY' | 'AI_ACTION';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  prompt?: string;
  createdat: string;
  updatedat: string;
}

function RecentJobs({ user }: { user: User }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentJobs();
  }, []);

  const fetchRecentJobs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch recent jobs from the database directly
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('userid', user.id)
        .is('deletedat', null)
        .order('createdat', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching jobs:', error);
      } else {
        setJobs(data || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'COMPLETED': return <div className="w-2 h-2 rounded-full bg-green-500" />;
      case 'RUNNING': return <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />;
      case 'FAILED': return <div className="w-2 h-2 rounded-full bg-red-500" />;
      case 'CANCELLED': return <div className="w-2 h-2 rounded-full bg-gray-500" />;
      default: return <div className="w-2 h-2 rounded-full bg-yellow-500" />;
    }
  };

  const getTypeIcon = (type: Job['type']) => {
    switch (type) {
      case 'SCAFFOLD': return <FolderOpen className="w-4 h-4" />;
      case 'EDIT': return <FileText className="w-4 h-4" />;
      case 'TEST': return <Terminal className="w-4 h-4" />;
      case 'DEPLOY': return <GitBranch className="w-4 h-4" />;
      case 'AI_ACTION': return <Code className="w-4 h-4" />;
      default: return <Play className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Jobs</h2>
        <div className="text-center py-8 text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Recent Jobs</h2>
      
      {jobs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No jobs yet</p>
          <p className="text-sm">Create a project and start working</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <Card key={job.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(job.type)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{job.type}</span>
                        {getStatusIcon(job.status)}
                      </div>
                      {job.prompt && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {job.prompt}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.createdat).toLocaleDateString()} {new Date(job.createdat).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
