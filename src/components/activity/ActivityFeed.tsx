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
  WifiOff,
  Database,
  Cloud,
  CloudOff
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useActivitiesChannel } from '../../lib/websocket';
import { offlineActivityManager, useOfflineStatus, initializeOfflineSystem } from '../../lib/offline';
import { useAuthenticatedFetch } from '../../hooks/useAuthenticatedFetch';
import { OfflineStatusIndicator, ConnectionStatus } from '../ui/OfflineStatusIndicator';
import { ConflictResolutionModal } from '../ui/ConflictResolutionModal';
// import { useWebSocketContext } from '../../contexts/WebSocketContext';

interface ActivityItem {
  id: string;
  type: 'job' | 'conversation' | 'file' | 'system' | 'user_activity' | 'message' | 'deployment';
  title: string;
  description: string;
  status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  timestamp: string;
  level?: 'info' | 'warning' | 'error' | 'success';
  metadata?: {
    jobId?: string;
    conversationId?: string;
    messageId?: string;
    filePath?: string;
    jobType?: string;
    output?: string;
    error?: string;
    jobMetadata?: any;
    userId?: string;
    activityType?: string;
    messageContent?: string;
    messageRole?: string;
    messageType?: string;
    relatedJobId?: string;
    projectId?: string;
    deploymentId?: string;
    deploymentUrl?: string;
  };
}

interface ActivityFeedProps {
  projectId: string;
  className?: string;
}

export function ActivityFeed({ projectId, className = '' }: ActivityFeedProps) {
  const { session } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  
  // Offline system integration
  const { isOnline, stats: offlineStats } = useOfflineStatus();
  const [offlineSystemReady, setOfflineSystemReady] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  
  // New WebSocket channel system integration
  const {
    activities: realtimeActivities,
    lastActivity,
    connectionState,
    isConnected,
    getUserFriendlyStatus
  } = useActivitiesChannel(projectId, !!session);

  // Extract additional connection info for compatibility
  const connectionStatus = connectionState.connectionStatus;
  const wsError = connectionState.error;
  const reconnectAttempts = connectionState.reconnectAttempts;
  const maxReconnectAttempts = connectionState.maxReconnectAttempts;
  const hasError = connectionState.hasError;
  const canRetry = connectionState.canRetry;
  const isRetrying = connectionState.isRetrying;
  
  const [localActivities, setLocalActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [isPollingFallback, setIsPollingFallback] = useState(false);

  // Merge real-time and local activities
  const activities = [...realtimeActivities, ...localActivities]
    .filter((activity, index, arr) => 
      arr.findIndex(a => a.id === activity.id) === index // Remove duplicates
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());


  const loadActivities = async (silent = false, forceRefresh = false) => {
    if (!projectId) {
      setLocalActivities([]);
      setLoading(false);
      return;
    }

    if (!session) {
      setLocalActivities([]);
      setLoading(false);
      return;
    }

    try {
      if (!silent) setLoading(true);
      
      // Use offline system if available, fallback to direct API
      if (offlineSystemReady) {
        try {
          const activities = await offlineActivityManager.getActivities(projectId, forceRefresh);
          setLocalActivities(activities);
          return;
        } catch (error) {
          console.warn('[ActivityFeed] Offline system failed, falling back to direct API:', error);
        }
      }
      
      // Fallback to direct API call with automatic token refresh
      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/projects/${projectId}/activity?showAll=false&_t=${Date.now()}&_debug=true`);

      if (!response.ok) {
        console.error('[ActivityFeed] Failed to load activities:', response.status);
        if (response.status === 401) {
          console.error('[ActivityFeed] Authentication failed even after token refresh - user may need to sign in again');
        }
        setLocalActivities([]);
        return;
      }

      const data = await response.json();
      const activities = data.activities || data || [];
      setLocalActivities(activities);
    } catch (error) {
      console.error('[ActivityFeed] Error loading activities:', error);
      setLocalActivities([]);
    } finally {
      if (!silent) setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initialize offline system when session is available
  useEffect(() => {
    if (session && !offlineSystemReady) {
      initializeOfflineSystem().then((success) => {
        if (success) {
          setOfflineSystemReady(true);
          console.log('✅ Offline system ready for ActivityFeed');
          
          // Load initial conflicts
          loadConflicts();
        } else {
          console.warn('⚠️ Offline system failed to initialize, using fallback mode');
        }
      });
    }
  }, [session, offlineSystemReady]);

  // Load conflicts from offline manager
  const loadConflicts = async () => {
    try {
      const currentConflicts = offlineActivityManager.getConflicts();
      setConflicts(currentConflicts);
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  };

  // Periodically check for conflicts
  useEffect(() => {
    if (!offlineSystemReady) return;

    const conflictCheckInterval = setInterval(() => {
      loadConflicts();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(conflictCheckInterval);
  }, [offlineSystemReady]);

  useEffect(() => {
    if (session) {
      loadActivities();
    }
  }, [projectId, session, offlineSystemReady]);

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

  // Old handlers - no longer needed with new channel system
  /*
  // Handler for unified activity updates (new format from backend)
  const handleActivityUpdate = useCallback((event: any) => {
    console.log('📥 Unified activity update received:', event);
    
    if (!event.activity) {
      console.warn('⚠️ Activity update event missing activity data');
      return;
    }
    
    const activity = event.activity;
    
    setLocalActivities(prev => {
      // Find existing activity by ID
      const existingIndex = prev.findIndex(existing => existing.id === activity.id);
      
      if (existingIndex >= 0) {
        // Update existing activity
        const updated = [...prev];
        updated[existingIndex] = {
          ...activity,
          timestamp: activity.timestamp || updated[existingIndex].timestamp
        };
        console.log('🔄 Updated existing activity:', activity.id);
        return updated;
      } else {
        // Add new activity at the beginning
        console.log('➕ Added new activity:', activity.id);
        return [activity, ...prev.slice(0, 49)]; // Keep last 50 activities
      }
    });
  }, []);

  // Handler for real-time job status updates (legacy format - kept for backwards compatibility)
  const handleJobStatusUpdate = useCallback((event: any) => {
    console.log('🔄 Legacy job update received:', event.jobId, 'status:', event.status);
    console.log('🔍 Job event data:', event);
    
    setLocalActivities(prev => {
      // Find existing activity for this job
      const existingIndex = prev.findIndex(activity => 
        activity.metadata?.jobId === event.jobId
      );
      
      if (existingIndex >= 0) {
        // Update existing activity
        const updated = [...prev];
        const existingActivity = updated[existingIndex];
        const jobType = event.jobType || event.metadata?.jobType || existingActivity.metadata?.jobType || 'UNKNOWN';
        
        updated[existingIndex] = {
          ...existingActivity,
          title: jobType !== 'UNKNOWN' ? getJobTitle(jobType, event.status) : `Job ${event.status.toLowerCase()}`,
          description: jobType !== 'UNKNOWN' ? 
            getJobTypeDescription(jobType) : 
            `Job ${event.jobId} status changed to ${event.status}`,
          status: event.status,
          metadata: {
            ...existingActivity.metadata,
            jobType: jobType,
            ...event.metadata
          },
          timestamp: event.timestamp || existingActivity.timestamp
        };
        return updated;
      } else {
        // Create new activity for new job
        const jobType = event.jobType || event.metadata?.jobType || 'UNKNOWN';
        const newActivity: ActivityItem = {
          id: `job-${event.jobId}-${Date.now()}`,
          type: 'job',
          title: jobType !== 'UNKNOWN' ? getJobTitle(jobType, event.status) : `Job ${event.status.toLowerCase()}`,
          description: jobType !== 'UNKNOWN' ? 
            getJobTypeDescription(jobType) : 
            `Job ${event.jobId} status changed to ${event.status}`,
          status: event.status,
          timestamp: event.timestamp || new Date().toISOString(),
          metadata: {
            jobId: event.jobId,
            jobType: jobType,
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
    
    setLocalActivities(prev => {
      // Remove activity for deleted job
      const filtered = prev.filter(activity => 
        activity.metadata?.jobId !== event.jobId
      );
      
      console.log(`🔄 Removed job ${event.jobId} from activities (${prev.length} -> ${filtered.length} activities)`);
      return filtered;
    });
  }, []);

  // Handler for user activity events
  const handleUserActivity = useCallback((event: any) => {
    console.log('👤 Adding user activity:', event);
    
    const newActivity: ActivityItem = {
      id: `activity-${event.activityType}-${Date.now()}`,
      type: 'user_activity',
      title: event.activityType?.replace('_', ' ') || 'User Activity',
      description: event.description || 'User performed an action',
      timestamp: event.timestamp,
      level: event.level || 'info',
      metadata: {
        activityType: event.activityType,
        ...event.metadata
      }
    };
    
    setLocalActivities(prev => [newActivity, ...prev.slice(0, 49)]); // Keep last 50 activities
  }, []);

  // Handler for message activity events
  const handleMessageActivity = useCallback((event: any) => {
    console.log('💬 Adding message activity:', event);
    
    const roleEmoji = event.messageRole === 'user' ? '👤' : event.messageRole === 'assistant' ? '🤖' : '⚙️';
    const newActivity: ActivityItem = {
      id: `message-${event.messageId}-${Date.now()}`,
      type: 'message',
      title: `${roleEmoji} New ${event.messageRole} message`,
      description: event.messageContent ? 
        (event.messageContent.length > 100 ? event.messageContent.substring(0, 100) + '...' : event.messageContent) :
        `${event.messageRole} sent a message`,
      timestamp: event.timestamp,
      level: 'info',
      metadata: {
        messageId: event.messageId,
        conversationId: event.conversationId,
        messageContent: event.messageContent,
        messageRole: event.messageRole,
        messageType: event.messageType,
        relatedJobId: event.relatedJobId,
        projectId: event.projectId
      }
    };
    
    setLocalActivities(prev => [newActivity, ...prev.slice(0, 49)]);
  }, []);

  // Handler for conversation activity events
  const handleConversationActivity = useCallback((event: any) => {
    console.log('🗣️ Adding conversation activity:', event);
    
    const newActivity: ActivityItem = {
      id: `conversation-${event.conversationId}-${Date.now()}`,
      type: 'conversation',
      title: '🗣️ New conversation started',
      description: event.conversationTitle || 'Started a new conversation',
      timestamp: event.timestamp,
      level: 'success',
      metadata: {
        conversationId: event.conversationId,
        projectId: event.projectId
      }
    };
    
    setLocalActivities(prev => [newActivity, ...prev.slice(0, 49)]);
  }, []);

  // Handler for deployment activity events
  const handleDeploymentActivity = useCallback((event: any) => {
    console.log('🚀 Adding deployment activity:', event);
    
    const statusEmoji = event.status === 'COMPLETED' ? '✅' : event.status === 'FAILED' ? '❌' : '🔄';
    const newActivity: ActivityItem = {
      id: `deployment-${event.deploymentId}-${Date.now()}`,
      type: 'deployment',
      title: `${statusEmoji} Deployment ${event.status?.toLowerCase() || 'updated'}`,
      description: `Deployment status changed to ${event.status || 'unknown'}`,
      status: event.status,
      timestamp: event.timestamp,
      level: event.status === 'COMPLETED' ? 'success' : event.status === 'FAILED' ? 'error' : 'info',
      metadata: {
        deploymentId: event.deploymentId,
        projectId: event.projectId,
        deploymentUrl: event.url
      }
    };
    
    setLocalActivities(prev => [newActivity, ...prev.slice(0, 49)]);
  }, []);

  // Handler for system notifications
  const handleSystemNotification = useCallback((event: any) => {
    console.log('🔔 Adding system notification:', event);
    
    const levelEmoji = {
      'info': 'ℹ️',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌'
    }[event.level || 'info'] || 'ℹ️';
    
    const newActivity: ActivityItem = {
      id: `system-${Date.now()}`,
      type: 'system',
      title: `${levelEmoji} System ${event.level || 'notification'}`,
      description: event.description || 'System notification',
      timestamp: event.timestamp,
      level: event.level || 'info',
      metadata: event.metadata || {}
    };
    
    setLocalActivities(prev => [newActivity, ...prev.slice(0, 49)]);
  }, []);

  */
  // Note: Real-time updates are now handled directly by the new WebSocket channel system

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadActivities(true, true); // Force refresh from server
  };

  const getActivityIcon = (activity: ActivityItem) => {
    // Show optimistic indicator for optimistic updates
    if (activity.metadata?.optimistic) {
      return <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />;
    }
    
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
      case 'message':
        return activity.metadata?.messageRole === 'user' 
          ? <MessageCircle className="w-4 h-4 text-green-500" />
          : <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'user_activity':
        return <Activity className="w-4 h-4 text-purple-500" />;
      case 'deployment':
        return activity.status === 'COMPLETED'
          ? <CheckCircle className="w-4 h-4 text-green-500" />
          : activity.status === 'FAILED'
          ? <AlertCircle className="w-4 h-4 text-red-500" />
          : <Rocket className="w-4 h-4 text-indigo-500" />;
      case 'file':
        return <FileText className="w-4 h-4 text-purple-500" />;
      case 'system':
        // Use level-based icons for system notifications
        switch (activity.level) {
          case 'error':
            return <AlertCircle className="w-4 h-4 text-red-500" />;
          case 'warning':
            return <AlertCircle className="w-4 h-4 text-yellow-500" />;
          case 'success':
            return <CheckCircle className="w-4 h-4 text-green-500" />;
          default:
            return <GitCommit className="w-4 h-4 text-gray-500" />;
        }
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (activity: ActivityItem) => {
    // For job activities, use status-based coloring
    if (activity.type === 'job' && activity.status) {
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
    }
    
    // For other activities, use level-based coloring
    if (activity.level) {
      switch (activity.level) {
        case 'error': return 'text-red-600';
        case 'warning': return 'text-yellow-600';
        case 'success': return 'text-green-600';
        case 'info': return 'text-blue-600';
        default: return 'text-gray-600';
      }
    }
    
    // Default for activities without status or level
    return 'text-gray-600';
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

  const getJobTitle = (type: string, status: string) => {
    const typeMap: { [key: string]: string } = {
      'SCAFFOLD': 'Project Setup',
      'AI_ACTION': 'AI Code Generation', 
      'EDIT': 'Code Modification',
      'TEST': 'Test Execution',
      'DEPLOY': 'Deployment',
      'BUILD': 'Build Process'
    };
    
    const statusMap: { [key: string]: string } = {
      'PENDING': 'queued',
      'RUNNING': 'in progress',
      'COMPLETED': 'completed',
      'FAILED': 'failed',
      'CANCELLED': 'cancelled'
    };
    
    const jobType = typeMap[type] || type;
    const jobStatus = statusMap[status] || status.toLowerCase();
    
    return `${jobType} ${jobStatus}`;
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
          
          {/* Offline system status indicator */}
          {offlineSystemReady && (
            <OfflineStatusIndicator showStats={true} />
          )}
          
          {/* Conflicts indicator */}
          {conflicts.length > 0 && (
            <button
              onClick={() => setShowConflicts(true)}
              className="flex items-center space-x-1 bg-red-600 text-white px-2 py-1 rounded-full text-xs hover:bg-red-700 transition-colors"
              title={`${conflicts.length} sync conflict${conflicts.length !== 1 ? 's' : ''} need attention`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>{conflicts.length}</span>
            </button>
          )}
          
          {isPollingFallback && (
            <span className="text-xs text-yellow-400" title="Using polling fallback - updates every 10s">
              (polling)
            </span>
          )}
          
          {/* Enhanced WebSocket connection indicator */}
          <ConnectionStatus 
            isConnected={isConnected}
            isRetrying={isRetrying}
            hasError={hasError}
            errorSeverity={wsError?.severity}
            getUserFriendlyStatus={getUserFriendlyStatus}
          />
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
                    activity.metadata?.optimistic ? 'bg-purple-400' : // Optimistic activities get purple bar
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
                            <h4 className={`text-sm font-semibold ${activity.metadata?.optimistic ? 'text-purple-300' : 'text-white'}`}>
                              {activity.title}
                              {activity.metadata?.optimistic && (
                                <span className="ml-1 text-xs text-purple-400" title="Optimistic update - will sync when online">
                                  ⚡
                                </span>
                              )}
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
                          {(activity.status || activity.level || activity.metadata?.optimistic) && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              // Optimistic status override
                              activity.metadata?.optimistic ? 'bg-purple-100 text-purple-800' :
                              // Job status badges
                              activity.status === 'COMPLETED' && !activity.metadata?.error ? 'bg-green-100 text-green-800' :
                              activity.status === 'COMPLETED' && activity.metadata?.error ? 'bg-red-100 text-red-800' :
                              activity.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                              activity.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                              activity.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              activity.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
                              // Level-based badges for non-job activities
                              activity.level === 'error' ? 'bg-red-100 text-red-800' :
                              activity.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              activity.level === 'success' ? 'bg-green-100 text-green-800' :
                              activity.level === 'info' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.metadata?.optimistic ? (
                                'syncing...'
                              ) : activity.status ? (
                                activity.status === 'COMPLETED' && activity.metadata?.error 
                                  ? 'failed' 
                                  : activity.status.toLowerCase()
                              ) : (
                                activity.level || 'info'
                              )}
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

      {/* Conflict Resolution Modal */}
      <ConflictResolutionModal
        isOpen={showConflicts}
        onClose={() => setShowConflicts(false)}
        conflicts={conflicts}
        onConflictResolved={async (conflictId, resolution) => {
          try {
            await offlineActivityManager.resolveConflict(conflictId, resolution);
            await loadConflicts(); // Refresh conflicts list
          } catch (error) {
            console.error('Failed to resolve conflict:', error);
            throw error;
          }
        }}
      />
    </div>
  );
}