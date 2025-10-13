'use client';

import { useCallback } from 'react';

// Custom event for file refresh notifications
const FILE_REFRESH_EVENT = 'file-refresh';

interface FileRefreshEvent extends CustomEvent {
  detail: {
    projectId: string;
    filePath?: string;
    operation: 'create' | 'update' | 'delete';
  };
}

export function useFileRefresh(projectId?: string) {
  // Trigger a file refresh for the specified project
  const refreshFiles = useCallback((filePath?: string, operation: 'create' | 'update' | 'delete' = 'update') => {
    if (!projectId) return;
    
    console.log(`[FileRefresh] Triggering refresh for project ${projectId}, file: ${filePath}, operation: ${operation}`);
    
    const event = new CustomEvent(FILE_REFRESH_EVENT, {
      detail: {
        projectId,
        filePath,
        operation
      }
    }) as FileRefreshEvent;
    
    window.dispatchEvent(event);
  }, [projectId]);

  // Listen for file refresh events
  const onFileRefresh = useCallback((callback: (event: FileRefreshEvent) => void) => {
    const handleRefresh = (event: Event) => {
      callback(event as FileRefreshEvent);
    };
    
    window.addEventListener(FILE_REFRESH_EVENT, handleRefresh);
    
    // Return cleanup function
    return () => {
      window.removeEventListener(FILE_REFRESH_EVENT, handleRefresh);
    };
  }, []);

  return {
    refreshFiles,
    onFileRefresh
  };
}

// Global functions for triggering file refreshes from anywhere
export const triggerFileRefresh = (projectId: string, filePath?: string, operation: 'create' | 'update' | 'delete' = 'update') => {
  const event = new CustomEvent(FILE_REFRESH_EVENT, {
    detail: {
      projectId,
      filePath,
      operation
    }
  }) as FileRefreshEvent;
  
  window.dispatchEvent(event);
};