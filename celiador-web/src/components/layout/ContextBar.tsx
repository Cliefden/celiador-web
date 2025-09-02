'use client';

import { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  MessageCircle, 
  Play, 
  CheckCircle,
  Clock,
  Search,
  ChevronDown,
  Activity,
  GitBranch,
  Settings
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { supabase } from '../../lib/supabase';
import { DeploymentButtons } from '../integrations/DeploymentButtons';

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

interface Conversation {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ActivitySummary {
  runningJobs: number;
  completedToday: number;
  lastActivity: string;
  recentFiles: string[];
}

interface ContextBarProps {
  selectedProject: Project | null;
  conversation: Conversation | null;
  onSearch?: (query: string) => void;
}

export function ContextBar({ selectedProject, conversation, onSearch }: ContextBarProps) {
  const [activity, setActivity] = useState<ActivitySummary>({
    runningJobs: 0,
    completedToday: 0,
    lastActivity: 'No recent activity',
    recentFiles: []
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Load activity summary for selected project
  useEffect(() => {
    const loadActivitySummary = async () => {
      if (!selectedProject) {
        setActivity({
          runningJobs: 0,
          completedToday: 0,
          lastActivity: 'No project selected',
          recentFiles: []
        });
        return;
      }

      try {
        // Get running jobs
        const { data: runningJobs } = await supabase
          .from('jobs')
          .select('id')
          .eq('projectid', selectedProject.id)
          .eq('status', 'RUNNING');

        // Get completed jobs today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data: completedToday } = await supabase
          .from('jobs')
          .select('id')
          .eq('projectid', selectedProject.id)
          .eq('status', 'COMPLETED')
          .gte('updatedat', today.toISOString());

        // Get last activity
        const { data: lastJob } = await supabase
          .from('jobs')
          .select('createdat, type, status')
          .eq('projectid', selectedProject.id)
          .order('createdat', { ascending: false })
          .limit(1);

        const lastActivity = lastJob?.[0] 
          ? `${lastJob[0].type} ${lastJob[0].status.toLowerCase()} ${getRelativeTime(lastJob[0].createdat)}`
          : 'No recent activity';

        setActivity({
          runningJobs: runningJobs?.length || 0,
          completedToday: completedToday?.length || 0,
          lastActivity,
          recentFiles: [] // TODO: Get from file system API
        });
      } catch (error) {
        console.error('Error loading activity summary:', error);
      }
    };

    loadActivitySummary();
    
    // Refresh every 30 seconds if there are running jobs
    const interval = setInterval(() => {
      if (activity.runningJobs > 0) {
        loadActivitySummary();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedProject, activity.runningJobs]);

  const getRelativeTime = (dateString: string) => {
    if (!dateString) return 'unknown';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'unknown';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const getProjectStatusBadge = () => {
    if (!selectedProject) return null;
    
    if (activity.runningJobs > 0) {
      return (
        <Badge variant="default" className="bg-blue-500">
          <Play className="w-3 h-3 mr-1" />
          {activity.runningJobs} active
        </Badge>
      );
    }
    
    if (selectedProject.status === 'READY') {
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          Ready
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary">
        <Clock className="w-3 h-3 mr-1" />
        Idle
      </Badge>
    );
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="bg-white border-b px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Project & Conversation Info */}
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          {selectedProject ? (
            <>
              <div className="flex items-center space-x-2 min-w-0">
                <FolderOpen className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="font-semibold truncate">{selectedProject.name}</h1>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <GitBranch className="w-3 h-3" />
                    <span className="truncate">{selectedProject.templatekey}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {getProjectStatusBadge()}
              </div>

              {conversation && (
                <>
                  <div className="h-6 border-l border-muted" />
                  <div className="flex items-center space-x-2 min-w-0">
                    <MessageCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{conversation.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Updated {getRelativeTime(conversation.updatedAt)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <FolderOpen className="w-5 h-5" />
              <span>No project selected</span>
            </div>
          )}
        </div>

        {/* Center: Activity Summary */}
        {selectedProject && (
          <div className="hidden md:flex flex-col items-start space-y-2 px-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Status:</span>
                <span>{activity.lastActivity}</span>
              </div>
              
              {activity.completedToday > 0 && (
                <div className="flex items-center space-x-1 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-muted-foreground">{activity.completedToday} completed today</span>
                </div>
              )}
            </div>
            
            {/* Deployment Buttons - underneath status */}
            <div className="flex items-center space-x-2">
              <DeploymentButtons 
                projectId={selectedProject.id} 
                onDeploymentStart={() => {
                  console.log('Deployment started');
                }}
                onDeploymentComplete={(result) => {
                  console.log('Deployment completed:', result);
                }}
                compact={true}
              />
            </div>
          </div>
        )}

        {/* Right: Search & Actions */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files, conversations..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Bottom: Quick Stats */}
      {selectedProject && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>Repository: {selectedProject.repoowner || 'No repository'}/{selectedProject.reponame || 'assigned'}</span>
              <span>Provider: {selectedProject.repoprovider || 'none'}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {activity.runningJobs > 0 && (
                <span className="text-blue-600 font-medium">
                  {activity.runningJobs} job{activity.runningJobs !== 1 ? 's' : ''} running
                </span>
              )}
              <span>Last updated: {getRelativeTime(selectedProject.updatedat || new Date().toISOString())}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}