'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketChannelManager, ChannelSubscription, WebSocketConnectionState, WebSocketMessage } from './WebSocketChannelManager';
import { useAuth } from '../../contexts/AuthContext';

// Local interfaces for activity formatting
interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  status?: string;
  timestamp: string;
  level?: 'info' | 'warning' | 'error' | 'success';
  metadata?: any;
}

type EntityAction = 'created' | 'updated' | 'deleted';

// Shared formatting utilities (copied from backend)
function getJobTitle(type: string, status: string): string {
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
  
  const jobType = typeMap[type] || (type || 'Unknown');
  const jobStatus = statusMap[status] || (status ? status.toLowerCase() : 'unknown');
  
  return `${jobType} ${jobStatus}`;
}

function getJobTypeDescription(jobType: string): string {
  const descriptions: { [key: string]: string } = {
    'SCAFFOLD': 'Setting up project structure and dependencies',
    'AI_ACTION': 'AI-powered code generation and modification',
    'EDIT': 'Manual code editing and file modifications',
    'TEST': 'Running tests and validation checks',
    'BUILD': 'Compiling and building the project',
    'DEPLOY': 'Deploying to production environment'
  };
  return descriptions[jobType] || jobType;
}

function getEntityActivityLevel(entityType: string, action: EntityAction, status?: string): 'info' | 'warning' | 'error' | 'success' {
  if (entityType === 'jobs' && status) {
    if (status === 'COMPLETED') return 'success';
    if (status === 'FAILED') return 'error';
    if (status === 'RUNNING') return 'info';
  }
  
  switch (action) {
    case 'created':
      return 'success';
    case 'deleted':
      return 'warning';
    case 'updated':
    default:
      return 'info';
  }
}

function formatJobAsActivity(job: any, action: EntityAction, userId?: string): ActivityItem {
  const level = getEntityActivityLevel('jobs', action, job.status);
  
  // Special handling for deleted jobs
  const title = action === 'deleted' 
    ? `Job deleted` 
    : getJobTitle(job.type, job.status);
    
  const description = action === 'deleted'
    ? `Job was deleted`
    : (job.prompt || getJobTypeDescription(job.type));
  
  return {
    id: job.id,
    type: 'job',
    title,
    description,
    timestamp: job.updatedat || job.createdat,
    status: job.status,
    level,
    metadata: {
      jobId: job.id,
      jobType: job.type,
      output: job.output,
      error: job.error,
      jobMetadata: job.metadata,
      userId: userId,
      entityType: 'jobs',
      entityId: job.id,
      action
    }
  };
}

function formatConversationAsActivity(conversation: any, action: EntityAction): ActivityItem {
  const level = getEntityActivityLevel('conversations', action);
  const actionWord = action === 'created' ? 'started' : action === 'deleted' ? 'deleted' : 'updated';
  
  return {
    id: `conv_${conversation.id}`,
    type: 'conversation',
    title: `Conversation ${actionWord}`,
    description: conversation.title || 'Untitled conversation',
    timestamp: conversation.updatedat || conversation.createdat,
    level,
    metadata: {
      conversationId: conversation.id,
      projectId: conversation.projectid || conversation.projectId,
      entityType: 'conversations',
      entityId: conversation.id,
      action
    }
  };
}

function formatMessageAsActivity(message: any, action: EntityAction): ActivityItem {
  const roleEmoji = message.role === 'user' ? '👤' : message.role === 'assistant' ? '🤖' : '⚙️';
  const level = getEntityActivityLevel('messages', action);
  const actionWord = action === 'created' ? 'New' : action === 'deleted' ? 'Deleted' : 'Updated';
  
  return {
    id: `message_${message.id}`,
    type: 'message',
    title: `${roleEmoji} ${actionWord} ${message.role} message`,
    description: message.content ? 
      (message.content.length > 100 ? message.content.substring(0, 100) + '...' : message.content) :
      `${message.role} sent a message`,
    timestamp: message.updatedat || message.createdat,
    level,
    metadata: {
      messageId: message.id,
      conversationId: message.conversationid || message.conversationId,
      messageContent: message.content,
      messageRole: message.role,
      messageType: message.messagetype || message.messageType,
      relatedJobId: message.relatedjobid || message.relatedJobId,
      projectId: message.projectid || message.projectId,
      entityType: 'messages',
      entityId: message.id,
      action
    }
  };
}

function formatProjectAsActivity(project: any, action: EntityAction): ActivityItem {
  const level = getEntityActivityLevel('projects', action);
  const actionWord = action === 'created' ? 'created' : action === 'deleted' ? 'deleted' : 'updated';
  
  return {
    id: `project_${project.id}`,
    type: 'project',
    title: `Project ${actionWord}`,
    description: `Project "${project.name || 'Untitled'}" was ${actionWord}`,
    timestamp: project.updatedat || project.createdat,
    level,
    metadata: {
      projectId: project.id,
      projectName: project.name,
      templateKey: project.templatekey || project.templateKey,
      entityType: 'projects',
      entityId: project.id,
      action
    }
  };
}

function formatDeploymentAsActivity(deployment: any, action: EntityAction): ActivityItem {
  const statusEmoji = deployment.status === 'COMPLETED' ? '✅' : deployment.status === 'FAILED' ? '❌' : '🔄';
  const level = deployment.status === 'COMPLETED' ? 'success' : deployment.status === 'FAILED' ? 'error' : 'info';
  
  return {
    id: `deployment_${deployment.deploymentId || deployment.id}`,
    type: 'deployment',
    title: `${statusEmoji} Deployment ${deployment.status?.toLowerCase() || action}`,
    description: `Deployment status changed to ${deployment.status || 'unknown'}`,
    status: deployment.status,
    timestamp: deployment.timestamp || deployment.updatedat || deployment.createdat,
    level,
    metadata: {
      deploymentId: deployment.deploymentId || deployment.id,
      projectId: deployment.projectId || deployment.projectid,
      deploymentUrl: deployment.url || deployment.deploymentUrl,
      entityType: 'deployments',
      entityId: deployment.deploymentId || deployment.id,
      action
    }
  };
}

// Generic entity formatter using the mapping
function formatEntityAsActivity(
  entityType: string, 
  entityData: any, 
  action: EntityAction = 'created',
  userId?: string
): ActivityItem | null {
  switch (entityType) {
    case 'jobs':
      return formatJobAsActivity(entityData, action, userId);
    case 'conversations':
      return formatConversationAsActivity(entityData, action);
    case 'messages':
      return formatMessageAsActivity(entityData, action);
    case 'projects':
      return formatProjectAsActivity(entityData, action);
    case 'deployments':
      return formatDeploymentAsActivity(entityData, action);
    default:
      console.warn(`No formatter found for entity type: ${entityType}`);
      // Return a generic fallback
      return {
        id: `${entityType}_${entityData.id || Date.now()}`,
        type: entityType,
        title: `${entityType} ${action}`,
        description: `${entityType} was ${action}`,
        timestamp: entityData.updatedat || entityData.createdat || new Date().toISOString(),
        level: getEntityActivityLevel(entityType, action),
        metadata: {
          entityType,
          entityId: entityData.id,
          action,
          ...entityData
        }
      };
  }
}

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

  // Helper function to convert generic entity events to activity format using shared formatters
  const convertEntityToActivity = useCallback((message: any, eventType: string): ActivityItem | null => {
    const { entityType, entityData, entityId, userId } = message;
    
    const action: EntityAction = eventType === 'entity_created' ? 'created' :
                                 eventType === 'entity_updated' ? 'updated' : 'deleted';
    
    try {
      // Use the shared formatter with proper fallback ID generation
      const activity = formatEntityAsActivity(entityType, entityData, action, userId);
      
      if (activity && !activity.id.includes(entityId)) {
        // Ensure we have a unique ID that includes the entity ID
        activity.id = `${entityType}-${action}-${entityId}-${Date.now()}`;
      }
      
      // Ensure timestamp is set from message if not in entity data
      if (activity && !activity.timestamp) {
        activity.timestamp = message.timestamp || new Date().toISOString();
      }
      
      return activity;
    } catch (error) {
      console.error(`Error formatting ${entityType} entity as activity:`, error);
      return null;
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
    // Special case: DELETE events may not have projectId, so we allow them through
    if (eventProjectId && eventProjectId !== projectId && type !== 'entity_deleted') {
      console.log('❌ Skipping - wrong project:', eventProjectId, 'vs', projectId);
      return null;
    }
    
    // For DELETE events without projectId, we'll process them but note the limitation
    if (type === 'entity_deleted' && !eventProjectId) {
      console.log('⚠️ Processing DELETE event without projectId - may show deletion from other projects');
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