'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useWebSocketChannel } from './useWebSocketChannel';
import { WebSocketEntityClient } from './WebSocketEntityClient';

// Global entity client instance (singleton)
let globalEntityClient: WebSocketEntityClient | null = null;

// Hook for WebSocket-based entity operations
export function useWebSocketEntity() {
  const { subscribe, connectionState, isConnected } = useWebSocketChannel();
  const clientRef = useRef<WebSocketEntityClient | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize the entity client
  useEffect(() => {
    if (!isConnected) {
      setIsReady(false);
      return;
    }

    // We need a way to get the manager instance from useWebSocketChannel
    // For now, we'll create the client when we have a connection
    // The manager will be available through the subscribe callback context
    
    // Create a temporary subscription just to get access to the manager
    const unsubscribe = subscribe({
      channel: 'entity_client_init',
      onMessage: () => {}, // Dummy handler
      enabled: true
    });

    // The manager should be accessible through the global scope now
    // This is set by the useWebSocketChannel hook
    const manager = (globalThis as any).__wsChannelManager;
    
    if (manager && !clientRef.current) {
      if (!globalEntityClient) {
        globalEntityClient = new WebSocketEntityClient(manager);
      }
      clientRef.current = globalEntityClient;
      setIsReady(true);
    }

    // Clean up the dummy subscription
    unsubscribe();

    return () => {
      // Don't destroy the client on unmount - keep it global
      clientRef.current = null;
    };
  }, [isConnected, subscribe]);

  // Generic entity operations
  const fetchEntity = useCallback(async <T>(entityType: string, entityId: string): Promise<T> => {
    if (!clientRef.current) {
      throw new Error('WebSocket entity client not ready');
    }
    return clientRef.current.fetchEntity<T>(entityType, entityId);
  }, []);

  const fetchEntities = useCallback(async <T>(entityType: string, filters?: Record<string, any>): Promise<T[]> => {
    if (!clientRef.current) {
      throw new Error('WebSocket entity client not ready');
    }
    return clientRef.current.fetchEntities<T>(entityType, filters);
  }, []);

  const createEntity = useCallback(async <T>(entityType: string, data: any): Promise<T> => {
    if (!clientRef.current) {
      throw new Error('WebSocket entity client not ready');
    }
    return clientRef.current.createEntity<T>(entityType, data);
  }, []);

  const updateEntity = useCallback(async <T>(entityType: string, entityId: string, data: any): Promise<T> => {
    if (!clientRef.current) {
      throw new Error('WebSocket entity client not ready');
    }
    return clientRef.current.updateEntity<T>(entityType, entityId, data);
  }, []);

  const deleteEntity = useCallback(async (entityType: string, entityId: string): Promise<void> => {
    if (!clientRef.current) {
      throw new Error('WebSocket entity client not ready');
    }
    return clientRef.current.deleteEntity(entityType, entityId);
  }, []);

  // Convenience methods for specific entities
  const fetchJob = useCallback(async (jobId: string) => {
    return fetchEntity('jobs', jobId);
  }, [fetchEntity]);

  const fetchJobs = useCallback(async (projectId: string) => {
    return fetchEntities('jobs', { projectId });
  }, [fetchEntities]);

  const fetchProject = useCallback(async (projectId: string) => {
    return fetchEntity('projects', projectId);
  }, [fetchEntity]);

  const fetchProjects = useCallback(async () => {
    return fetchEntities('projects');
  }, [fetchEntities]);

  const fetchConversations = useCallback(async (projectId: string) => {
    return fetchEntities('conversations', { projectId });
  }, [fetchEntities]);

  return {
    // Connection state
    connectionState,
    isConnected,
    isReady,

    // Generic operations
    fetchEntity,
    fetchEntities,
    createEntity,
    updateEntity,
    deleteEntity,

    // Convenience methods
    fetchJob,
    fetchJobs,
    fetchProject,
    fetchProjects,
    fetchConversations,

    // Client reference for advanced usage
    client: clientRef.current
  };
}

// Specialized hook for entity fetching with caching and state management
export function useEntityFetch<T>(entityType: string, entityId?: string, filters?: Record<string, any>) {
  const { fetchEntity, fetchEntities, isReady, connectionState } = useWebSocketEntity();
  const [data, setData] = useState<T | T[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!isReady) {
      setError('WebSocket not ready');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;
      if (entityId) {
        result = await fetchEntity<T>(entityType, entityId);
      } else {
        result = await fetchEntities<T>(entityType, filters);
      }
      setData(result);
    } catch (err) {
      console.error(`[useEntityFetch] Error fetching ${entityType}:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, filters, fetchEntity, fetchEntities, isReady]);

  // Automatically fetch when ready and dependencies change
  useEffect(() => {
    if (isReady) {
      refetch();
    }
  }, [isReady, refetch]);

  // Reset state when connection drops
  useEffect(() => {
    if (!connectionState.isConnected) {
      setData(null);
      setError(null);
      setLoading(false);
    }
  }, [connectionState.isConnected]);

  return {
    data,
    loading,
    error,
    refetch,
    isReady,
    connectionState
  };
}

// Specialized hooks for common entities
export function useJobFetch(jobId: string) {
  return useEntityFetch('jobs', jobId);
}

export function useJobsFetch(projectId: string) {
  return useEntityFetch('jobs', undefined, { projectId });
}

export function useProjectFetch(projectId: string) {
  return useEntityFetch('projects', projectId);
}

export function useProjectsFetch() {
  return useEntityFetch('projects');
}

export function useConversationsFetch(projectId: string) {
  return useEntityFetch('conversations', undefined, { projectId });
}