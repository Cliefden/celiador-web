'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Play,
  FileText,
  MessageCircle,
  GitCommit,
  Loader2,
  ExternalLink,
  Eye
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ActivityItem {
  id: string;
  type: 'job' | 'conversation' | 'file' | 'system';
  title: string;
  description: string;
  status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  timestamp: string;
  metadata?: {
    jobId?: string;
    conversationId?: string;
    filePath?: string;
    messageId?: string;
  };
}

interface ActivityStreamProps {
  selectedProject: { id: string } | null;
  className?: string;
}

export function ActivityStream({ selectedProject, className = '' }: ActivityStreamProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const loadActivities = async () => {
      if (!selectedProject) {
        setActivities([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('[ActivityStream] No session available');
          setActivities([]);
          return;
        }
        
        const response = await fetch(`http://localhost:4000/projects/${selectedProject.id}/activity?showAll=${showAll}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          console.error('[ActivityStream] Failed to load activities:', response.status);
          setActivities([]);
          return;
        }

        const data = await response.json();
        setActivities(data.activities || []);
      } catch (error) {
        console.error('[ActivityStream] Error loading activities:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadActivities();
  }, [selectedProject, showAll]);

  const getJobTitle = (type: string, status: string) => {
    // Enhanced status messages for scaffold jobs
    if (type === 'SCAFFOLD') {
      switch (status) {
        case 'PENDING': return 'Setting up project template...';
        case 'RUNNING': return 'Creating project files...';
        case 'COMPLETED': return 'Project created successfully';
        case 'FAILED': return 'Project creation failed';
        case 'CANCELLED': return 'Project creation cancelled';
        default: return `Project scaffolding ${status.toLowerCase()}`;
      }
    }
    
    const typeMap: { [key: string]: string } = {
      'EDIT': 'Code Edited',
      'TEST': 'Tests Run',
      'DEPLOY': 'Deployed',
      'AI_ACTION': 'AI Actions Executed'
    };
    
    const statusMap: { [key: string]: string } = {
      'PENDING': 'pending',
      'RUNNING': 'in progress',
      'COMPLETED': 'completed',
      'FAILED': 'failed',
      'CANCELLED': 'cancelled'
    };
    
    return `${typeMap[type] || type} ${statusMap[status] || status}`;
  };

  const getActivityIcon = (activity: ActivityItem) => {
    if (activity.type === 'job') {
      switch (activity.status) {
        case 'RUNNING':
          return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
        case 'COMPLETED':
          return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'FAILED':
          return <AlertCircle className="w-4 h-4 text-red-500" />;
        case 'CANCELLED':
          return <Clock className="w-4 h-4 text-gray-500" />;
        default:
          return <Clock className="w-4 h-4 text-yellow-500" />;
      }
    }
    
    switch (activity.type) {
      case 'conversation':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'file':
        return <FileText className="w-4 h-4 text-purple-500" />;
      case 'system':
        return <GitCommit className="w-4 h-4 text-gray-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (activity: ActivityItem) => {
    if (activity.type !== 'job' || !activity.status) return null;
    
    const statusConfig: { [key: string]: { variant: 'default' | 'secondary' | 'destructive'; className: string } } = {
      'PENDING': { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' },
      'RUNNING': { variant: 'default', className: 'bg-blue-100 text-blue-800' },
      'COMPLETED': { variant: 'default', className: 'bg-green-100 text-green-800' },
      'FAILED': { variant: 'destructive', className: 'bg-red-100 text-red-800' },
      'CANCELLED': { variant: 'secondary', className: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusConfig[activity.status];
    if (!config) return null;
    
    return (
      <Badge className={config.className}>
        {activity.status.toLowerCase()}
      </Badge>
    );
  };

  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const handleViewActivity = (activity: ActivityItem) => {
    if (activity.metadata?.conversationId) {
      // Scroll to conversation/message - this could be enhanced with actual navigation
      console.log('Navigate to conversation:', activity.metadata.conversationId);
      // TODO: Implement actual navigation to conversation
    } else if (activity.metadata?.jobId) {
      // Show job details
      console.log('View job details:', activity.metadata.jobId);
      // TODO: Implement job details modal or navigation
    }
  };

  const displayedActivities = showAll ? activities : activities.slice(0, 5);

  if (loading) {
    return (
      <div className={`bg-muted/30 border-t p-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-3">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold">Recent Activity</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className={`bg-muted/30 border-t p-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-3">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold">Recent Activity</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Select a project to view activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-muted/30 border-t flex flex-col ${className}`}>
      <div className="p-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold">Recent Activity</h3>
            {isRefreshing && (
              <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
            )}
          </div>
          {activities.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-xs"
            >
              {showAll ? `Show Less (${activities.slice(0, 5).length})` : `Show All (${activities.length})`}
            </Button>
          )}
        </div>
        
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm">Start a conversation to see activity here</p>
          </div>
        ) : (
          <div className="space-y-2 flex-1 overflow-y-auto pr-2">
            {displayedActivities.map((activity) => (
              <Card key={activity.id} className="border-l-4 border-l-blue-500/20">
                <CardContent className="!p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {getActivityIcon(activity)}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium">{activity.title}</p>
                          {getStatusBadge(activity)}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getRelativeTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                    
                    {activity.metadata?.jobId && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-1"
                        title="View details"
                        onClick={() => handleViewActivity(activity)}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}