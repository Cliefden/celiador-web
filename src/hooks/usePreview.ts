'use client';

import { useState, useCallback, useEffect } from 'react';
import { ApiClient } from '../lib/api';

export interface PreviewInstance {
  id: string;
  projectId: string;
  userId: string;
  url: string;
  port: number;
  status: 'syncing' | 'starting' | 'running' | 'error' | 'stopped';
  localPath?: string;
  syncResult?: {
    success: boolean;
    filesDownloaded: number;
    errors: string[];
    localPath: string;
  };
  startTime: string;
  lastAccessed?: string;
  errorMessage?: string;
}

export function usePreview(projectId: string | null) {
  const [preview, setPreview] = useState<PreviewInstance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  // Load existing preview for project
  const loadPreview = useCallback(async () => {
    if (!projectId) {
      console.log('[usePreview] No projectId, skipping load');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLoadingMessage('Checking for existing preview...');
      console.log('[usePreview] Loading preview for project:', projectId);

      // Log API configuration for debugging
      ApiClient.logConfig();

      const data = await ApiClient.listPreviews(projectId);
      const previews = data.previews || [];
      console.log('[usePreview] Found previews:', previews.length);
      
      // Get the most recent active preview
      const activePreview = previews
        .filter((p: PreviewInstance) => p.status !== 'stopped')
        .sort((a: PreviewInstance, b: PreviewInstance) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        )[0];

      if (activePreview) {
        setPreview(activePreview);
        console.log('[usePreview] Loaded existing preview:', activePreview.id, 'status:', activePreview.status);
        
        // If preview is running, we're done. If it's starting/syncing, poll for updates
        if (activePreview.status === 'starting' || activePreview.status === 'syncing') {
          console.log('[usePreview] Preview is starting/syncing, polling for updates');
          pollPreviewStatus(activePreview.id);
        }
      } else {
        console.log('[usePreview] No active preview found');
        setPreview(null);
      }
    } catch (error) {
      console.error('[usePreview] Error loading preview:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load preview';
      
      // Don't set error for 404s when no previews exist, but log for debugging
      if (errorMessage.includes('Failed to list previews') || errorMessage.includes('404')) {
        console.log('[usePreview] No existing previews found (this is normal)');
      } else {
        console.error('[usePreview] Actual error loading preview:', errorMessage);
        setError(`Failed to check existing previews: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }, [projectId]); // pollPreviewStatus is defined later, will be handled in the callback

  // Start a new preview
  const startPreview = useCallback(async () => {
    if (!projectId) {
      console.error('[usePreview] Cannot start preview: no projectId');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLoadingMessage('Starting preview server...');
      
      console.log('[usePreview] Starting new preview for project:', projectId);

      const data = await ApiClient.startPreview(projectId, {
        name: 'Project Preview',
        type: 'nextjs' // Will be auto-detected
      });

      setPreview(data.preview);
      setLoadingMessage('Preview started, monitoring status...');
      console.log('[usePreview] Started preview:', data.preview.id, 'status:', data.preview.status);
      
      // Poll for status updates
      pollPreviewStatus(data.preview.id);
    } catch (error) {
      console.error('[usePreview] Error starting preview:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start preview';
      setError(`Failed to start preview: ${errorMessage}`);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }, [projectId]);

  // Stop preview
  const stopPreview = useCallback(async () => {
    if (!preview || !projectId) return;

    try {
      setLoading(true);
      setError(null);

      await ApiClient.stopPreview(projectId, preview.id);
      setPreview(null);
      console.log('[usePreview] Stopped preview:', preview.id);
    } catch (error) {
      console.error('[usePreview] Error stopping preview:', error);
      setError(error instanceof Error ? error.message : 'Failed to stop preview');
    } finally {
      setLoading(false);
    }
  }, [preview, projectId]);

  // Restart preview
  const restartPreview = useCallback(async () => {
    if (preview) {
      await stopPreview();
      // Small delay before starting
      setTimeout(() => {
        startPreview();
      }, 1000);
    } else {
      await startPreview();
    }
  }, [preview, stopPreview, startPreview]);

  // Poll for preview status updates
  const pollPreviewStatus = useCallback(async (previewId: string) => {
    if (!projectId) return;

    const poll = async () => {
      try {
        const data = await ApiClient.getPreviewStatus(projectId, previewId);
        const updatedPreview = data.preview;
        
        setPreview(prev => {
          // Only update if this is still the current preview
          if (prev?.id === previewId) {
            return updatedPreview;
          }
          return prev;
        });

        // Continue polling if still starting/syncing
        if (updatedPreview.status === 'starting' || updatedPreview.status === 'syncing') {
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error('[usePreview] Error polling status:', error);
      }
    };

    // Start polling
    setTimeout(poll, 1000);
  }, [projectId]);

  // Clear preview immediately when project changes, then load new one
  useEffect(() => {
    // Immediately clear current preview to avoid showing old project
    setPreview(null);
    setError(null);
    
    // Load new project's preview if projectId exists
    if (projectId) {
      loadPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]); // Only depend on projectId, not loadPreview to avoid infinite re-renders

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Could add cleanup logic here if needed
    };
  }, []);

  return {
    preview,
    loading,
    error,
    loadingMessage,
    startPreview,
    stopPreview,
    restartPreview,
    refreshPreview: loadPreview
  };
}