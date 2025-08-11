'use client';

import { useState } from 'react';
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
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Recent Jobs</h2>
            <div className="text-center py-8 text-muted-foreground">
              <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Job history coming soon</p>
            </div>
          </div>
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
