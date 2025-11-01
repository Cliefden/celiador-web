'use client';

import { useState, useEffect } from 'react';
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
  Wifi,
  WifiOff
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useActivitiesChannel } from '../../lib/websocket';

interface ActivityItem {
  id: string;
  type: 'job' | 'conversation' | 'file' | 'system' | 'user_activity' | 'message' | 'deployment';
  title: string;
  description: string;
  status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  timestamp: string;
  level?: 'info' | 'warning' | 'error' | 'success';
  metadata?: any;
}

interface ActivityFeedProps {
  projectId: string;
  className?: string;
}

export function ActivityFeedExample({ projectId, className = '' }: ActivityFeedProps) {
  const { session } = useAuth();
  const [localActivities, setLocalActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use the new WebSocket channel system
  const {
    activities: realtimeActivities,
    lastActivity,
    connectionState,
    isConnected,
    getUserFriendlyStatus
  } = useActivitiesChannel(projectId, !!session);

  // Load initial activities from API
  useEffect(() => {
    if (!projectId || !session) return;

    const loadActivities = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/projects/${projectId}/activity`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load activities: ${response.statusText}`);
        }

        const data = await response.json();
        setLocalActivities(data.activities || []);
      } catch (err) {
        console.error('Error loading activities:', err);
        setError(err instanceof Error ? err.message : 'Failed to load activities');
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [projectId, session]);

  // Merge real-time and local activities
  const allActivities = [...realtimeActivities, ...localActivities]
    .filter((activity, index, arr) => 
      arr.findIndex(a => a.id === activity.id) === index // Remove duplicates
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Activity type icons
  const getActivityIcon = (type: string, status?: string) => {
    switch (type) {
      case 'job':
        if (status === 'RUNNING') return <Loader2 className="h-4 w-4 animate-spin" />;
        if (status === 'COMPLETED') return <CheckCircle className="h-4 w-4 text-green-500" />;
        if (status === 'FAILED') return <AlertCircle className="h-4 w-4 text-red-500" />;
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'conversation':
      case 'message':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'file':
        return <FileText className="h-4 w-4 text-purple-500" />;
      case 'deployment':
        return <Rocket className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading activities...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm font-medium">
            {getUserFriendlyStatus()}
          </span>
        </div>
        
        {lastActivity && (
          <div className="text-xs text-gray-500">
            Last update: {new Date(lastActivity.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Activities List */}
      <div className="space-y-2">
        {allActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No activities yet</p>
          </div>
        ) : (
          allActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type, activity.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </h4>
                  <time className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </time>
                </div>
                
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
                
                {activity.status && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-2 ${
                    activity.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    activity.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                    activity.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {activity.status}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Connection Debug Info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <summary>Debug Info</summary>
          <pre className="mt-2 whitespace-pre-wrap">
            {JSON.stringify({
              isConnected,
              status: connectionState.connectionStatus,
              reconnectAttempts: connectionState.reconnectAttempts,
              realtimeActivitiesCount: realtimeActivities.length,
              localActivitiesCount: localActivities.length,
              totalActivitiesCount: allActivities.length
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}