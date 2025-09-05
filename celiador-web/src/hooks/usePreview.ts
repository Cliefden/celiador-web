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

  // Load existing preview for project
  const loadPreview = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await ApiClient.listPreviews(projectId);
      const previews = data.previews || [];
      
      // Get the most recent active preview
      const activePreview = previews
        .filter((p: PreviewInstance) => p.status !== 'stopped')
        .sort((a: PreviewInstance, b: PreviewInstance) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        )[0];

      if (activePreview) {
        setPreview(activePreview);
        console.log('[usePreview] Loaded existing preview:', activePreview.id);
      }
    } catch (error) {
      console.error('[usePreview] Error loading preview:', error);
      // Don't set error for 404s when no previews exist
      if (!error?.message?.includes('Failed to list previews')) {
        setError(error instanceof Error ? error.message : 'Failed to load preview');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Start a new preview
  const startPreview = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await ApiClient.startPreview(projectId, {
        name: 'Project Preview',
        type: 'nextjs' // Will be auto-detected
      });

      setPreview(data.preview);
      console.log('[usePreview] Started preview:', data.preview.id);
      
      // Poll for status updates
      pollPreviewStatus(data.preview.id);
    } catch (error) {
      console.error('[usePreview] Error starting preview:', error);
      setError(error instanceof Error ? error.message : 'Failed to start preview');
    } finally {
      setLoading(false);
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

  // Load preview on project change
  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

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
    startPreview,
    stopPreview,
    restartPreview,
    refreshPreview: loadPreview
  };
}