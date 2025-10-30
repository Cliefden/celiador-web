'use client';

import React, { createContext, useContext, useCallback, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface WebSocketContextType {
  isConnected: boolean;
  isConnecting: boolean;
  connectionStatus: string;
  lastMessage: WebSocketMessage | null;
  subscribe: (channel: string) => boolean;
  unsubscribe: (channel: string) => boolean;
  sendMessage: (message: any) => boolean;
  
  // Event handlers for different types of real-time events
  onJobStatusChange: (handler: (event: any) => void) => () => void;
  onProjectUpdate: (handler: (event: any) => void) => () => void;
  onMessageCreated: (handler: (event: any) => void) => () => void;
  onDeploymentStatusChange: (handler: (event: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [eventHandlers, setEventHandlers] = useState<Map<string, Set<(event: any) => void>>>(new Map());

  const handleMessage = useCallback((message: WebSocketMessage) => {
    console.log('📥 WebSocket message:', message);

    // Route messages to appropriate handlers
    const handlers = eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('[WebSocket] Error in event handler:', error);
        }
      });
    }
  }, [eventHandlers]);

  const handleConnect = useCallback(() => {
    console.log('🔌 WebSocket connected in context');
  }, []);

  const handleDisconnect = useCallback(() => {
    console.log('🔌 WebSocket disconnected in context');
  }, []);

  const handleError = useCallback((error: Event) => {
    console.error('❌ WebSocket error in context:', error);
  }, []);

  const {
    isConnected,
    isConnecting,
    connectionStatus,
    lastMessage,
    subscribe,
    unsubscribe,
    sendMessage
  } = useWebSocket({
    onMessage: handleMessage,
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
    onError: handleError,
    autoReconnect: true,
    channels: ['jobs', 'projects', 'conversations', 'deployments', 'system_notifications']
  });

  // Helper function to register event handlers
  const registerHandler = useCallback((eventType: string, handler: (event: any) => void) => {
    setEventHandlers(prev => {
      const newHandlers = new Map(prev);
      if (!newHandlers.has(eventType)) {
        newHandlers.set(eventType, new Set());
      }
      newHandlers.get(eventType)!.add(handler);
      return newHandlers;
    });

    // Return unregister function
    return () => {
      setEventHandlers(prev => {
        const newHandlers = new Map(prev);
        const handlers = newHandlers.get(eventType);
        if (handlers) {
          handlers.delete(handler);
          if (handlers.size === 0) {
            newHandlers.delete(eventType);
          }
        }
        return newHandlers;
      });
    };
  }, []);

  // Specific event handler registrations
  const onJobStatusChange = useCallback((handler: (event: any) => void) => {
    return registerHandler('job_status_change', handler);
  }, [registerHandler]);

  const onProjectUpdate = useCallback((handler: (event: any) => void) => {
    return registerHandler('project_updated', handler);
  }, [registerHandler]);

  const onMessageCreated = useCallback((handler: (event: any) => void) => {
    return registerHandler('message_created', handler);
  }, [registerHandler]);

  const onDeploymentStatusChange = useCallback((handler: (event: any) => void) => {
    return registerHandler('deployment_status_change', handler);
  }, [registerHandler]);

  const contextValue: WebSocketContextType = {
    isConnected,
    isConnecting,
    connectionStatus,
    lastMessage,
    subscribe,
    unsubscribe,
    sendMessage,
    onJobStatusChange,
    onProjectUpdate,
    onMessageCreated,
    onDeploymentStatusChange
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}