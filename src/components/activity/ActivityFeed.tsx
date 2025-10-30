'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Loader2,
  MessageCircle,
  FileText,
  GitCommit,
  RefreshCw,
  Code,
  Settings,
  Zap,
  Play,
  Package,
  Rocket,
  ChevronDown,
  ChevronRight,
  Wifi,
  WifiOff
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSimpleWebSocket } from '../../hooks/useSimpleWebSocket';
// import { useWebSocketContext } from '../../contexts/WebSocketContext';

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
    jobType?: string;
    output?: string;
    error?: string;
    jobMetadata?: any;
    userId?: string;
  };
}

interface ActivityFeedProps {
  projectId: string;
  className?: string;
}

export function ActivityFeed({ projectId, className = '' }: ActivityFeedProps) {
  const { session } = useAuth();
  
  // WebSocket URL logic: production uses same origin with wss, development uses separate port
  const getWebSocketUrl = () => {
    if (typeof window === 'undefined') return '';
    
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Development mode - use separate WebSocket port
      return 'ws://localhost:8081';
    } else {
      // Production mode - use same origin with WebSocket protocol
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}`;
    }
  };

  // WebSocket integration with enhanced error handling
  const { 
    isConnected, 
    connectionStatus, 
    lastMessage, 
    error: wsError,
    reconnectAttempts,
    maxReconnectAttempts,
    hasError,
    canRetry,
    isRetrying,
    getUserFriendlyStatus
  } = useSimpleWebSocket({
    url: getWebSocketUrl(),
    token: session?.access_token || '',
    enabled: !!session?.access_token,
    maxReconnectAttempts: 3, // Reduce retries for better UX
    reconnectDelay: 2000, // 2 second initial delay
    onMessage: (data) => {
      // Handle real-time messages here
      if (data.type === 'job_status_change') {
        // Accept job updates for current project or system-level jobs (testing)
        if (data.projectId === projectId || data.userId === 'system') {
          console.log('📥 Real-time job update:', data);
          handleJobStatusUpdate(data);
        }
      } else if (data.type === 'job_deleted') {
        // Handle job deletion - filter by project
        if (data.projectId === projectId || data.userId === 'system') {
          console.log('🗑️ Real-time job deletion:', data);
          handleJobDeletion(data);
        }
      }
    },
    onError: (error) => {
      // Enhanced error handling with user-friendly messages
      // The hook already handles most logging appropriately based on error severity
      if (error.severity === 'high') {
        // Only show user-facing notification for high-severity errors
        console.warn(`⚠️ Activity feed: ${error.userMessage}`);
        if (error.suggestedAction) {
          console.info(`💡 Suggestion: ${error.suggestedAction}`);
        }
      }
      // Low and medium severity errors are already handled appropriately by the hook
    }
  });
  
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [isPollingFallback, setIsPollingFallback] = useState(false);


  const loadActivities = async (silent = false) => {
    if (!projectId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    if (!session) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      if (!silent) setLoading(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/projects/${projectId}/activity?showAll=false&_t=${Date.now()}&_debug=true`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        console.error('[ActivityFeed] Failed to load activities:', response.status);
        setActivities([]);
        return;
      }

      const data = await response.json();
      const activities = data.activities || data || [];
      setActivities(activities);
    } catch (error) {
      console.error('[ActivityFeed] Error loading activities:', error);
      setActivities([]);
    } finally {
      if (!silent) setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadActivities();
    }
  }, [projectId, session]);

  // Fallback polling when WebSocket is persistently failing
  useEffect(() => {
    const shouldPoll = hasError && !canRetry && reconnectAttempts >= maxReconnectAttempts;
    
    if (shouldPoll && !isPollingFallback) {
      console.info('🔄 WebSocket: Max retries reached, enabling polling fallback for reliable updates');
      setIsPollingFallback(true);
      
      const pollInterval = setInterval(() => {
        if (session && projectId) {
          loadActivities(true); // Silent refresh
        }
      }, 10000); // Poll every 10 seconds
      
      return () => {
        clearInterval(pollInterval);
        setIsPollingFallback(false);
      };
    } else if (!shouldPoll && isPollingFallback) {
      setIsPollingFallback(false);
    }
  }, [hasError, canRetry, reconnectAttempts, maxReconnectAttempts, session, projectId, isPollingFallback]);

  // Handler for real-time job status updates
  const handleJobStatusUpdate = useCallback((event: any) => {
    console.log('🔄 Updating activity for job:', event.jobId, 'status:', event.status);
    
    setActivities(prev => {
      // Find existing activity for this job
      const existingIndex = prev.findIndex(activity => 
        activity.metadata?.jobId === event.jobId
      );
      
      if (existingIndex >= 0) {
        // Update existing activity
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          status: event.status,
          metadata: {
            ...updated[existingIndex].metadata,
            ...event.metadata
          },
          timestamp: event.timestamp || updated[existingIndex].timestamp
        };
        return updated;
      } else {
        // Create new activity for new job
        const newActivity: ActivityItem = {
          id: `job-${event.jobId}-${Date.now()}`,
          type: 'job',
          title: `Job ${event.status.toLowerCase()}`,
          description: `Job ${event.jobId} status changed to ${event.status}`,
          status: event.status,
          timestamp: event.timestamp || new Date().toISOString(),
          metadata: {
            jobId: event.jobId,
            jobType: event.metadata?.jobType || 'UNKNOWN',
            ...event.metadata
          }
        };
        return [newActivity, ...prev];
      }
    });
  }, []);

  // Handler for real-time job deletion
  const handleJobDeletion = useCallback((event: any) => {
    console.log('🗑️ Removing activity for deleted job:', event.jobId);
    
    setActivities(prev => {
      // Remove activity for deleted job
      const filtered = prev.filter(activity => 
        activity.metadata?.jobId !== event.jobId
      );
      
      console.log(`🔄 Removed job ${event.jobId} from activities (${prev.length} -> ${filtered.length} activities)`);
      return filtered;
    });
  }, []);

  // Note: Real-time updates are now handled directly in the useSimpleWebSocket onMessage callback

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadActivities(true);
  };

  const getActivityIcon = (activity: ActivityItem) => {
    if (activity.type === 'job') {
      // Status takes priority over job type - show status-based icons first
      switch (activity.status) {
        case 'RUNNING':
          return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
        case 'FAILED':
          return <AlertCircle className="w-4 h-4 text-red-500" />;
        case 'CANCELLED':
          return <AlertCircle className="w-4 h-4 text-gray-500" />;
        case 'PENDING':
          return <Clock className="w-4 h-4 text-yellow-500" />;
        case 'COMPLETED':
          // For completed jobs, show success icon only if no error metadata exists
          if (activity.metadata?.error) {
            return <AlertCircle className="w-4 h-4 text-red-500" />;
          }
          break; // Fall through to job type specific icons for successful completion
        default:
          // Unknown status - show job type specific icon or generic
          break;
      }
      
      // For successful completion or unknown status, show job type specific icons
      const jobType = activity.metadata?.jobType;
      switch (jobType) {
        case 'SCAFFOLD':
          return activity.status === 'COMPLETED' 
            ? <CheckCircle className="w-4 h-4 text-green-500" />
            : <Settings className="w-4 h-4 text-purple-500" />;
        case 'AI_ACTION':
          return activity.status === 'COMPLETED' 
            ? <CheckCircle className="w-4 h-4 text-green-500" />
            : <Zap className="w-4 h-4 text-yellow-500" />;
        case 'EDIT':
          return activity.status === 'COMPLETED' 
            ? <CheckCircle className="w-4 h-4 text-green-500" />
            : <Code className="w-4 h-4 text-blue-500" />;
        case 'TEST':
          return activity.status === 'COMPLETED' 
            ? <CheckCircle className="w-4 h-4 text-green-500" />
            : <Play className="w-4 h-4 text-green-500" />;
        case 'BUILD':
          return activity.status === 'COMPLETED' 
            ? <CheckCircle className="w-4 h-4 text-green-500" />
            : <Package className="w-4 h-4 text-orange-500" />;
        case 'DEPLOY':
          return activity.status === 'COMPLETED' 
            ? <CheckCircle className="w-4 h-4 text-green-500" />
            : <Rocket className="w-4 h-4 text-indigo-500" />;
        default:
          // Unknown job type - only show success for truly completed jobs without errors
          return activity.status === 'COMPLETED' 
            ? <CheckCircle className="w-4 h-4 text-green-500" />
            : <Clock className="w-4 h-4 text-gray-500" />;
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

  const getStatusColor = (activity: ActivityItem) => {
    if (activity.type !== 'job' || !activity.status) return 'text-gray-600';
    
    switch (activity.status) {
      case 'PENDING': return 'text-yellow-600';
      case 'RUNNING': return 'text-blue-600';
      case 'COMPLETED': 
        // If job is marked completed but has error metadata, show as failed
        return activity.metadata?.error ? 'text-red-600' : 'text-green-600';
      case 'FAILED': return 'text-red-600';
      case 'CANCELLED': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

  const toggleExpanded = (activityId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedCards(newExpanded);
  };

  const getJobTypeDescription = (jobType: string) => {
    const descriptions: { [key: string]: string } = {
      'SCAFFOLD': 'Setting up project structure and dependencies',
      'AI_ACTION': 'AI-powered code generation and modification',
      'EDIT': 'Manual code editing and file modifications',
      'TEST': 'Running tests and validation checks',
      'BUILD': 'Compiling and building the project',
      'DEPLOY': 'Deploying to production environment'
    };
    return descriptions[jobType] || jobType;
  };

  const formatOutput = (output: string | undefined) => {
    if (!output) return null;
    try {
      const parsed = JSON.parse(output);
      if (parsed.actions && Array.isArray(parsed.actions)) {
        return `Generated ${parsed.actions.length} action(s)`;
      }
      if (parsed.files && Array.isArray(parsed.files)) {
        return `Modified ${parsed.files.length} file(s)`;
      }
    } catch {
      // Not JSON, return truncated string
    }
    return output.length > 100 ? output.substring(0, 100) + '...' : output;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-32 ${className}`}>
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Loading activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-gray-400" />
          <h3 className="font-medium text-white">Activity</h3>
          {isPollingFallback && (
            <span className="text-xs text-yellow-400" title="Using polling fallback - updates every 10s">
              (polling)
            </span>
          )}
          {/* Enhanced WebSocket connection indicator */}
          {isConnected ? (
            <Wifi 
              className="w-3 h-3 text-green-400" 
              title={`Real-time: ${getUserFriendlyStatus()}`} 
            />
          ) : isRetrying ? (
            <Loader2 
              className="w-3 h-3 text-blue-400 animate-spin" 
              title={getUserFriendlyStatus()} 
            />
          ) : wsError?.type === 'authentication' && wsError.isTokenExpired ? (
            <RefreshCw 
              className="w-3 h-3 text-yellow-400 animate-spin" 
              title={getUserFriendlyStatus()} 
            />
          ) : hasError && wsError?.severity === 'high' ? (
            <AlertCircle 
              className="w-3 h-3 text-red-400" 
              title={getUserFriendlyStatus()} 
            />
          ) : hasError && wsError?.severity === 'medium' ? (
            <AlertCircle 
              className="w-3 h-3 text-yellow-400" 
              title={getUserFriendlyStatus()} 
            />
          ) : (
            <WifiOff 
              className="w-3 h-3 text-gray-500" 
              title={getUserFriendlyStatus()} 
            />
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Refresh activity"
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <Activity className="w-8 h-8 text-gray-500 mb-3" />
            <p className="text-sm text-gray-300 mb-1">No recent activity</p>
            <p className="text-xs text-gray-400">Start building to see activity here</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {activities.slice(0, 10).map((activity) => {
              const isExpanded = expandedCards.has(activity.id);
              const hasDetails = activity.metadata?.output || activity.metadata?.error || activity.metadata?.jobType;
              
              return (
                <div
                  key={activity.id}
                  className="relative group bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-sm overflow-hidden"
                >
                  {/* Status indicator bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    activity.status === 'COMPLETED' && !activity.metadata?.error ? 'bg-green-400' :
                    activity.status === 'COMPLETED' && activity.metadata?.error ? 'bg-red-400' :
                    activity.status === 'RUNNING' ? 'bg-blue-400' :
                    activity.status === 'FAILED' ? 'bg-red-400' :
                    activity.status === 'PENDING' ? 'bg-yellow-400' :
                    activity.status === 'CANCELLED' ? 'bg-gray-400' :
                    'bg-gray-300'
                  }`} />
                  
                  {/* Main card content */}
                  <div 
                    className={`p-3 ml-2 ${hasDetails ? 'cursor-pointer' : ''}`}
                    onClick={() => hasDetails && toggleExpanded(activity.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-semibold text-white">
                              {activity.title}
                            </h4>
                            {hasDetails && (
                              <button className="text-gray-400 hover:text-gray-300">
                                {isExpanded ? (
                                  <ChevronDown className="w-3 h-3" />
                                ) : (
                                  <ChevronRight className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
                            {getRelativeTime(activity.timestamp)}
                          </span>
                        </div>
                        
                        {/* Job type description for jobs */}
                        {activity.metadata?.jobType && (
                          <p className="text-xs text-gray-400 mb-1">
                            {getJobTypeDescription(activity.metadata.jobType)}
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-300 leading-relaxed mb-2">
                          {activity.description}
                        </p>
                        
                        {/* Status badge and quick info */}
                        <div className="flex items-center justify-between">
                          {activity.status && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              activity.status === 'COMPLETED' && !activity.metadata?.error ? 'bg-green-100 text-green-800' :
                              activity.status === 'COMPLETED' && activity.metadata?.error ? 'bg-red-100 text-red-800' :
                              activity.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                              activity.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                              activity.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              activity.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.status === 'COMPLETED' && activity.metadata?.error 
                                ? 'failed' 
                                : activity.status.toLowerCase()
                              }
                            </span>
                          )}
                          
                          {/* Quick output summary */}
                          {activity.metadata?.output && !isExpanded && (
                            <span className="text-xs text-gray-400">
                              {formatOutput(activity.metadata.output)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded details */}
                    {isExpanded && hasDetails && (
                      <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                        {activity.metadata?.output && (
                          <div>
                            <div className="text-xs font-medium text-gray-300 mb-1">Output:</div>
                            <div className="text-xs text-gray-300 bg-gray-900 p-2 rounded font-mono">
                              {activity.metadata.output.length > 500 
                                ? activity.metadata.output.substring(0, 500) + '...'
                                : activity.metadata.output
                              }
                            </div>
                          </div>
                        )}
                        
                        {activity.metadata?.error && (
                          <div>
                            <div className="text-xs font-medium text-red-400 mb-1">Error:</div>
                            <div className="text-xs text-red-300 bg-red-900/20 p-2 rounded font-mono">
                              {activity.metadata.error}
                            </div>
                          </div>
                        )}
                        
                        {activity.metadata?.jobMetadata && (
                          <div>
                            <div className="text-xs font-medium text-gray-300 mb-1">Metadata:</div>
                            <div className="text-xs text-gray-300 bg-gray-900 p-2 rounded font-mono">
                              {JSON.stringify(activity.metadata.jobMetadata, null, 2)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}