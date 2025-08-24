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

  useEffect(() => {
    const loadActivities = async () => {
      if (!selectedProject) {
        setActivities([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const activities: ActivityItem[] = [];

        // Get recent jobs
        const { data: jobs, error: jobsError } = await supabase
          .from('jobs')
          .select('*')
          .eq('projectid', selectedProject.id)
          .order('createdat', { ascending: false })
          .limit(10);

        if (jobsError) {
          console.error('Error fetching jobs:', jobsError);
        } else if (jobs) {
          jobs.forEach(job => {
            activities.push({
              id: `job-${job.id}`,
              type: 'job',
              title: getJobTitle(job.type, job.status),
              description: job.prompt || `${job.type} job`,
              status: job.status,
              timestamp: job.createdat,
              metadata: { jobId: job.id }
            });
          });
        }

        // Get recent messages
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('*, conversations!inner(projectid)')
          .eq('conversations.projectid', selectedProject.id)
          .order('createdat', { ascending: false })
          .limit(5);

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
        } else if (messages) {
          messages.forEach(message => {
            if (message.role === 'assistant' && message.relatedjobid) {
              activities.push({
                id: `message-${message.id}`,
                type: 'conversation',
                title: 'AI Response with Actions',
                description: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
                timestamp: message.createdat,
                metadata: { 
                  messageId: message.id,
                  conversationId: message.conversationid,
                  jobId: message.relatedjobid
                }
              });
            }
          });
        }

        // Sort all activities by timestamp
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setActivities(activities);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
    
    // Refresh activities every 30 seconds
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
  }, [selectedProject]);

  const getJobTitle = (type: string, status: string) => {
    const typeMap: { [key: string]: string } = {
      'SCAFFOLD': 'Project Scaffolded',
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
    <div className={`bg-muted/30 border-t ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold">Recent Activity</h3>
          </div>
          {activities.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-xs"
            >
              {showAll ? 'Show Less' : 'Show All'}
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
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {displayedActivities.map((activity) => (
              <Card key={activity.id} className="border-l-4 border-l-blue-500/20">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 min-w-0 flex-1">
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
                      <Button variant="ghost" size="sm" className="p-1">
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