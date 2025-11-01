'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketChannelManager, ChannelSubscription, WebSocketConnectionState, WebSocketMessage } from './WebSocketChannelManager';
import { useAuth } from '../../contexts/AuthContext';

// Global manager instance (singleton)
let globalManager: WebSocketChannelManager | null = null;

// Hook options
export interface UseWebSocketChannelOptions {
  enabled?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

// Hook return type
export interface UseWebSocketChannelReturn {
  // Connection state
  connectionState: WebSocketConnectionState;
  
  // Subscribe to a channel
  subscribe: <TData = any>(subscription: ChannelSubscription<TData>) => () => void;
  
  // Helper methods
  isConnected: boolean;
  isRetrying: boolean;
  getUserFriendlyStatus: () => string;
}

// Helper function to get WebSocket URL
const getWebSocketUrl = (): string => {
  if (typeof window === 'undefined') return '';
  
  const baseUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
  
  if (baseUrl.startsWith('https://')) {
    return baseUrl.replace('https://', 'wss://').replace(/\/+$/, '');
  } else {
    return baseUrl.replace('http://', 'ws://').replace(/\/+$/, '');
  }
};

// Main hook for WebSocket channel management
export function useWebSocketChannel(options: UseWebSocketChannelOptions = {}): UseWebSocketChannelReturn {
  const { session } = useAuth();
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>({
    isConnected: false,
    connectionStatus: 'Disconnected',
    error: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: options.maxReconnectAttempts || 5,
    hasError: false,
    canRetry: false,
    isRetrying: false,
    getUserFriendlyStatus: () => 'Disconnected'
  });

  const managerRef = useRef<WebSocketChannelManager | null>(null);
  const currentTokenRef = useRef<string | null>(null);
  const { enabled = true, maxReconnectAttempts = 5, reconnectDelay = 1000 } = options;

  // Initialize manager only when enabled or when we don't have a working manager
  useEffect(() => {
    if (!enabled || !session?.access_token) {
      return;
    }

    const url = getWebSocketUrl();
    const needsNewManager = !globalManager || 
                          globalManager.getConnectionState().connectionStatus === 'Connection failed' ||
                          currentTokenRef.current !== session.access_token;
    
    // Create or reuse global manager only when necessary
    if (needsNewManager) {
      
      if (globalManager) {
        globalManager.disconnect();
      }
      
      globalManager = new WebSocketChannelManager({
        url,
        token: session.access_token,
        maxReconnectAttempts,
        reconnectDelay,
        enabled
      });

      // Set up connection state listener
      globalManager.setOnConnectionChange((state) => {
        setConnectionState(state);
      });

      // Connect
      globalManager.connect();
      
      // Update token ref
      currentTokenRef.current = session.access_token;
    }

    managerRef.current = globalManager;

    // Make manager globally accessible for entity client
    (globalThis as any).__wsChannelManager = globalManager;

    // Set initial state from manager
    setConnectionState(globalManager.getConnectionState());

    return () => {
      // Don't disconnect on component unmount - keep global connection
      managerRef.current = null;
    };
  }, [enabled, !!session?.access_token]); // Simplified dependencies - only track if we have a token, not the token value

  // Subscribe function
  const subscribe = useCallback(<TData = any>(subscription: ChannelSubscription<TData>) => {
    if (!managerRef.current) {
      console.warn('WebSocket manager not initialized, cannot subscribe to channel:', subscription.channel);
      return () => {}; // Return empty unsubscribe function
    }

    return managerRef.current.subscribe(subscription);
  }, []);

  return {
    connectionState,
    subscribe,
    isConnected: connectionState.isConnected,
    isRetrying: connectionState.isRetrying,
    getUserFriendlyStatus: connectionState.getUserFriendlyStatus
  };
}

// Specialized hook for activities channel - subscribes to multiple backend channels
export function useActivitiesChannel(projectId: string, enabled = true) {
  const { subscribe, ...rest } = useWebSocketChannel({ enabled });
  const [activities, setActivities] = useState<any[]>([]);
  const [lastActivity, setLastActivity] = useState<any>(null);

  // Helper function to convert generic entity events to activity format (stabilized)
  const convertEntityToActivity = useCallback((message: any, eventType: string): any | null => {
    const { entityType, entityData, entityId } = message;
    
    const actionWord = eventType === 'entity_created' ? 'created' :
                      eventType === 'entity_updated' ? 'updated' : 'deleted';
    
    switch (entityType) {
      case 'jobs':
        // Use the same formatting logic as the API endpoint
        const getJobTitle = (type: string, status: string): string => {
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

        const getJobTypeDescription = (jobType: string): string => {
          const descriptions: { [key: string]: string } = {
            'SCAFFOLD': 'Setting up project structure and dependencies',
            'AI_ACTION': 'AI-powered code generation and modification',
            'EDIT': 'Manual code editing and file modifications',
            'TEST': 'Running tests and validation',
            'DEPLOY': 'Deploying application to hosting platform',
            'BUILD': 'Building and compiling project'
          };
          return descriptions[jobType] || jobType;
        };

        return {
          id: entityData.id || `${entityType}-${actionWord}-${entityId}-${Date.now()}`,
          type: 'job',
          title: getJobTitle(entityData.type || 'Job', entityData.status || 'UNKNOWN'),
          description: entityData.prompt || getJobTypeDescription(entityData.type || 'Job'),
          timestamp: entityData.updatedat || entityData.createdat || message.timestamp || new Date().toISOString(),
          status: entityData.status,
          level: entityData.status === 'COMPLETED' ? 'success' : 
                 entityData.status === 'FAILED' ? 'error' : 
                 entityData.status === 'RUNNING' ? 'info' : 
                 eventType === 'entity_deleted' ? 'warning' : 'info',
          metadata: {
            jobId: entityData.id,
            jobType: entityData.type,
            output: entityData.output,
            error: entityData.error,
            jobMetadata: entityData.metadata,
            entityType,
            entityId,
            action: actionWord,
            ...entityData
          }
        };

      case 'messages':
        return {
          id: `${entityType}-${actionWord}-${entityId}-${Date.now()}`,
          type: 'message',
          title: `Message ${actionWord}`,
          description: entityData.content ? 
            (entityData.content.length > 100 ? `${entityData.content.substring(0, 100)}...` : entityData.content) :
            `Message ${actionWord}`,
          timestamp: message.timestamp || new Date().toISOString(),
          level: 'info',
          metadata: {
            entityType,
            entityId,
            action: actionWord,
            ...entityData
          }
        };

      case 'conversations':
        return {
          id: `${entityType}-${actionWord}-${entityId}-${Date.now()}`,
          type: 'conversation',
          title: `Conversation ${actionWord}`,
          description: `Conversation ${actionWord}`,
          timestamp: message.timestamp || new Date().toISOString(),
          level: 'info',
          metadata: {
            entityType,
            entityId,
            action: actionWord,
            ...entityData
          }
        };

      case 'projects':
        return {
          id: `${entityType}-${actionWord}-${entityId}-${Date.now()}`,
          type: 'project',
          title: `Project ${actionWord}`,
          description: `Project ${entityData.name || entityId} ${actionWord}`,
          timestamp: message.timestamp || new Date().toISOString(),
          level: eventType === 'entity_created' ? 'success' : 
                 eventType === 'entity_deleted' ? 'warning' : 'info',
          metadata: {
            entityType,
            entityId,
            action: actionWord,
            ...entityData
          }
        };

      default:
        // Generic fallback for unknown entity types
        return {
          id: `${entityType}-${actionWord}-${entityId}-${Date.now()}`,
          type: entityType,
          title: `${entityType} ${actionWord}`,
          description: `${entityType} ${actionWord}`,
          timestamp: message.timestamp || new Date().toISOString(),
          level: eventType === 'entity_created' ? 'success' : 
                 eventType === 'entity_deleted' ? 'warning' : 'info',
          metadata: {
            entityType,
            entityId,
            action: actionWord,
            ...entityData
          }
        };
    }
  }, []); // Removed dependencies to prevent recreation

  // Helper function to convert backend events to activity format (stabilized)
  const convertToActivity = useCallback((message: any): any | null => {
    // Backend sends events directly, not wrapped in WebSocketMessage format
    const { type, projectId: eventProjectId } = message;
    
    console.log('🔍 Converting message to activity:', { 
      messageType: type, 
      eventProjectId, 
      currentProjectId: projectId,
      fullMessage: message 
    });
    
    // Only process events for the current project
    if (eventProjectId && eventProjectId !== projectId) {
      console.log('❌ Skipping - wrong project:', eventProjectId, 'vs', projectId);
      return null;
    }

    switch (type) {
      // New generic entity events
      case 'entity_created':
      case 'entity_updated': 
      case 'entity_deleted':
        return convertEntityToActivity(message, type);
      
      // Legacy job events -> activities
      case 'job_status_change':
        return {
          id: `job-${message.jobId}-${Date.now()}`,
          type: 'job',
          title: `${message.jobType || 'Job'} ${message.status?.toLowerCase() || 'update'}`,
          description: `${message.jobType || 'Job'} ${message.status?.toLowerCase() || 'updated'}`,
          status: message.status,
          timestamp: message.timestamp || new Date().toISOString(),
          level: message.status === 'COMPLETED' ? 'success' : 
                 message.status === 'FAILED' ? 'error' : 
                 message.status === 'RUNNING' ? 'info' : 'warning',
          metadata: {
            jobId: message.jobId,
            jobType: message.jobType,
            projectId: message.projectId,
            output: message.output,
            error: message.error,
            ...message.metadata
          }
        };

      case 'job_deleted':
        return {
          id: `job-deleted-${message.jobId || Date.now()}`,
          type: 'job',
          title: 'Job Deleted',
          description: `Job ${message.jobId} was deleted`,
          timestamp: message.timestamp || new Date().toISOString(),
          level: 'warning',
          metadata: {
            jobId: message.jobId,
            projectId: message.projectId,
            action: 'deleted'
          }
        };

      // Message events -> activities  
      case 'message_created':
        return {
          id: `message-${message.messageId || Date.now()}`,
          type: 'message',
          title: `New ${message.messageRole || 'Unknown'} Message`,
          description: message.messageContent ? 
            (message.messageContent.length > 100 ? `${message.messageContent.substring(0, 100)}...` : message.messageContent) :
            'New message in conversation',
          timestamp: message.timestamp || new Date().toISOString(),
          level: 'info',
          metadata: {
            messageId: message.messageId,
            conversationId: message.conversationId,
            messageContent: message.messageContent,
            messageRole: message.messageRole,
            messageType: message.messageType,
            relatedJobId: message.relatedJobId,
            projectId: message.projectId
          }
        };

      // Conversation events -> activities
      case 'conversation_created':
        return {
          id: `conversation-${message.conversationId || Date.now()}`,
          type: 'conversation',
          title: message.conversationTitle || 'New Conversation',
          description: 'A new conversation was created',
          timestamp: message.timestamp || new Date().toISOString(),
          level: 'info',
          metadata: {
            conversationId: message.conversationId,
            projectId: message.projectId
          }
        };

      // Deployment events -> activities
      case 'deployment_status_change':
      case 'deployment_created':
        return {
          id: `deployment-${message.deploymentId || Date.now()}`,
          type: 'deployment',
          title: 'Deployment Update',
          description: `Deployment status: ${message.status || 'unknown'}`,
          timestamp: message.timestamp || new Date().toISOString(),
          level: message.status === 'SUCCESS' ? 'success' : 
                 message.status === 'FAILED' ? 'error' : 'info',
          metadata: {
            deploymentId: message.deploymentId,
            deploymentUrl: message.url,
            projectId: message.projectId,
            status: message.status
          }
        };

      // System events -> activities
      case 'user_activity':
        return {
          id: `user-activity-${Date.now()}`,
          type: 'user_activity',
          title: message.title || 'User Activity',
          description: message.description || 'User performed an action',
          timestamp: message.timestamp || new Date().toISOString(),
          level: message.level || 'info',
          metadata: {
            userId: message.userId,
            activityType: message.activityType,
            projectId: message.projectId,
            ...message.metadata
          }
        };

      case 'system_notification':
        return {
          id: `system-${Date.now()}`,
          type: 'system',
          title: message.title || 'System Notification',
          description: message.description || message.message || 'System notification',
          timestamp: message.timestamp || new Date().toISOString(),
          level: message.level || 'info',
          metadata: message.metadata || {}
        };

      // Unified activity format (if backend sends this)
      case 'activity_update':
        return message.activity;

      default:
        return null;
    }
  }, [projectId, convertEntityToActivity]); // Only essential dependencies

  useEffect(() => {
    if (!enabled || !projectId) {
      return;
    }

    // Subscribe to all channels that can generate activities
    const unsubscribeJobs = subscribe({
      channel: 'jobs',
      onMessage: (message) => {
        console.log('📥 Raw jobs channel message:', message);
        console.log('🔍 Message details:', { 
          type: message.type, 
          entityType: message.entityType, 
          projectId: message.projectId,
          currentProjectId: projectId 
        });
        const activity = convertToActivity(message);
        if (activity) {
          console.log('📥 Job activity created:', activity);
          try {
            setActivities(prev => {
              console.log('🔄 Adding activity to state, current count:', prev.length);
              const newActivities = [activity, ...prev.slice(0, 49)];
              console.log('✅ Activities updated, new count:', newActivities.length);
              return newActivities;
            });
            setLastActivity(activity);
            console.log('✅ LastActivity updated');
          } catch (error) {
            console.error('❌ Error updating activities state:', error);
          }
        } else {
          console.log('❌ No activity generated from jobs message - reason unknown');
        }
      },
      onError: (error) => console.error('Jobs channel error:', error),
      enabled
    });

    const unsubscribeConversations = subscribe({
      channel: 'conversations',
      onMessage: (message) => {
        const activity = convertToActivity(message);
        if (activity) {
          console.log('📥 Conversation activity:', activity);
          setActivities(prev => [activity, ...prev.slice(0, 49)]);
          setLastActivity(activity);
        }
      },
      onError: (error) => console.error('Conversations channel error:', error),
      enabled
    });

    const unsubscribeDeployments = subscribe({
      channel: 'deployments',
      onMessage: (message) => {
        const activity = convertToActivity(message);
        if (activity) {
          console.log('📥 Deployment activity:', activity);
          setActivities(prev => [activity, ...prev.slice(0, 49)]);
          setLastActivity(activity);
        }
      },
      onError: (error) => console.error('Deployments channel error:', error),
      enabled
    });

    const unsubscribeSystem = subscribe({
      channel: 'system_notifications',
      onMessage: (message) => {
        const activity = convertToActivity(message);
        if (activity) {
          console.log('📥 System activity:', activity);
          setActivities(prev => [activity, ...prev.slice(0, 49)]);
          setLastActivity(activity);
        }
      },
      onError: (error) => console.error('System notifications channel error:', error),
      enabled
    });

    // Return cleanup function that unsubscribes from all channels
    return () => {
      unsubscribeJobs();
      unsubscribeConversations();
      unsubscribeDeployments();
      unsubscribeSystem();
    };
  }, [subscribe, projectId, enabled]); // Removed callback dependencies to prevent constant recreation

  return {
    ...rest,
    activities,
    lastActivity,
    clearActivities: () => setActivities([])
  };
}

// Specialized hook for conversations channel
export function useConversationsChannel(conversationId?: string, enabled = true) {
  const { subscribe, ...rest } = useWebSocketChannel({ enabled });
  const [messages, setMessages] = useState<any[]>([]);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const unsubscribe = subscribe({
      channel: 'conversations',
      onMessage: (message) => {
        console.log('📥 Conversations channel message:', message);
        
        // Handle conversation-related messages
        switch (message.type) {
          case 'message_created':
            if (!conversationId || message.data?.conversationId === conversationId) {
              setMessages(prev => [...prev, message.data]);
              setLastMessage(message.data);
            }
            break;
            
          case 'message_updated':
            if (!conversationId || message.data?.conversationId === conversationId) {
              setMessages(prev => prev.map(msg => 
                msg.id === message.message.id ? { ...msg, ...message.data } : msg
              ));
              setLastMessage(message.data);
            }
            break;
            
          case 'conversation_created':
          case 'conversation_updated':
            setLastMessage(message.data);
            break;
        }
      },
      onError: (error) => {
        console.error('Conversations channel error:', error);
      },
      enabled
    });

    return unsubscribe;
  }, [subscribe, conversationId, enabled]);

  return {
    ...rest,
    messages,
    lastMessage,
    clearMessages: () => setMessages([])
  };
}

// Specialized hook for jobs channel
export function useJobsChannel(projectId?: string, enabled = true) {
  const { subscribe, ...rest } = useWebSocketChannel({ enabled });
  const [jobs, setJobs] = useState<any[]>([]);
  const [lastJobUpdate, setLastJobUpdate] = useState<any>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const unsubscribe = subscribe({
      channel: 'jobs',
      onMessage: (message) => {
        console.log('📥 Jobs channel message:', message);
        
        // Handle job-related messages
        switch (message.type) {
          case 'job_created':
          case 'job_updated':
          case 'job_completed':
          case 'job_failed':
            if (!projectId || message.data?.projectId === projectId) {
              setJobs(prev => {
                const existingIndex = prev.findIndex(job => job.id === message.message.id);
                if (existingIndex >= 0) {
                  const updated = [...prev];
                  updated[existingIndex] = { ...updated[existingIndex], ...message.data };
                  return updated;
                } else {
                  return [message.data, ...prev];
                }
              });
              setLastJobUpdate(message.data);
            }
            break;
        }
      },
      onError: (error) => {
        console.error('Jobs channel error:', error);
      },
      enabled
    });

    return unsubscribe;
  }, [subscribe, projectId, enabled]);

  return {
    ...rest,
    jobs,
    lastJobUpdate,
    clearJobs: () => setJobs([])
  };
}

// Global cleanup function (for app-level cleanup)
export function disconnectWebSocket(): void {
  if (globalManager) {
    globalManager.disconnect();
    globalManager = null;
  }
}