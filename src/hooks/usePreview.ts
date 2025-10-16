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
      const previews = Array.isArray(data) ? data : (data.previews || []); // Handle both direct array and wrapped response
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

  // Poll for preview status updates with timeout
  const pollPreviewStatus = useCallback(async (previewId: string) => {
    if (!projectId) return;

    let pollCount = 0;
    const maxPolls = 60; // 60 polls * 2s = 2 minutes timeout
    const startTime = Date.now();

    const poll = async () => {
      try {
        pollCount++;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        
        // Check for timeout
        if (pollCount > maxPolls) {
          console.warn(`[usePreview] ⏰ Polling timeout after ${elapsed}s - preview may be stuck`);
          setError('Preview startup timed out. Try clicking the Reset button to restart the preview.');
          return;
        }
        
        const data = await ApiClient.getPreviewStatus(projectId, previewId);
        const updatedPreview = data.preview; // API returns {success: true, preview: {...}}
        
        setPreview(prev => {
          // Only update if this is still the current preview
          if (prev?.id === previewId) {
            console.log('[usePreview] Status update:', prev?.status, '->', updatedPreview.status);
            return updatedPreview;
          }
          return prev;
        });

        console.log(`[usePreview] Poll ${pollCount}/${maxPolls} (${elapsed}s):`, updatedPreview.status, 'for preview:', previewId);
        
        // Continue polling until preview reaches a final state
        if (updatedPreview.status === 'starting' || updatedPreview.status === 'syncing') {
          console.log(`[usePreview] Preview still ${updatedPreview.status} - continuing to poll (${pollCount}/${maxPolls})`);
          setTimeout(poll, 2000);
        } else if (updatedPreview.status === 'running') {
          console.log('[usePreview] ✅ Preview is now running - polling complete');
          setError(null); // Clear any previous timeout errors
        } else {
          console.log('[usePreview] Preview in final state:', updatedPreview.status, '- polling stopped');
        }
      } catch (error) {
        console.error('[usePreview] Error polling status:', error);
        
        // On error, retry with exponential backoff, but respect the timeout
        if (pollCount < maxPolls) {
          const retryDelay = Math.min(5000 + (pollCount * 500), 10000); // Max 10s delay
          console.log(`[usePreview] Retrying poll after error in ${retryDelay}ms (attempt ${pollCount}/${maxPolls})`);
          setTimeout(poll, retryDelay);
        } else {
          console.error('[usePreview] Max polling attempts reached after errors');
          setError('Preview startup failed after multiple attempts. Try clicking the Reset button.');
        }
      }
    };

    // Start polling
    setTimeout(poll, 1000);
  }, [projectId]);

  // Clear preview immediately when project changes, then load new one
  useEffect(() => {
    console.log('[usePreview] Project changed to:', projectId);
    // Immediately clear current preview to avoid showing old project
    setPreview(null);
    setError(null);
    console.log('[usePreview] Cleared previous preview state');
    
    // Load new project's preview if projectId exists
    if (projectId) {
      console.log('[usePreview] Loading preview for new project:', projectId);
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