'use client';

import { useState, useEffect } from 'react';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  RefreshCw, 
  ExternalLink,
  AlertCircle,
  Loader2,
  Play,
  Square,
  RotateCcw
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

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

interface PreviewFrameProps {
  projectId: string;
  preview: PreviewInstance | null;
  device: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  loading: boolean;
  error: string | null;
}

const deviceConfig = {
  desktop: { width: '100%', height: '100%', label: 'Desktop' },
  tablet: { width: '768px', height: '1024px', label: 'Tablet' },
  mobile: { width: '375px', height: '667px', label: 'Mobile' },
};

export function PreviewFrame({
  projectId,
  preview,
  device,
  onDeviceChange,
  onStart,
  onStop,
  onRestart,
  loading,
  error
}: PreviewFrameProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [urlReady, setUrlReady] = useState(false);

  const refreshPreview = () => {
    setIframeKey(prev => prev + 1);
    setIframeLoading(true);
    setUrlReady(false); // Reset URL readiness to trigger re-check
  };

  // Effect to reset URL readiness when preview changes
  useEffect(() => {
    setUrlReady(false);
  }, [preview?.id]);

  // Effect to handle URL readiness with health check approach
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let intervalId: NodeJS.Timeout | null = null;

    const checkServerHealth = async (url: string): Promise<boolean> => {
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache'
        });
        return true; // If no error thrown, server is responding
      } catch (error) {
        return false; // Server not ready yet
      }
    };

    if (preview?.status === 'running' && preview.url && !urlReady) {
      console.log('[PreviewFrame] Preview running, checking server readiness...');
      
      let attempts = 0;
      const maxAttempts = 20; // 20 attempts over 10 seconds
      
      intervalId = setInterval(async () => {
        attempts++;
        console.log(`[PreviewFrame] Health check attempt ${attempts}/${maxAttempts}`);
        
        const isReady = await checkServerHealth(preview.url!);
        
        if (isReady || attempts >= maxAttempts) {
          if (intervalId) clearInterval(intervalId);
          
          if (isReady) {
            console.log('[PreviewFrame] Server is ready, showing iframe');
            setUrlReady(true);
          } else {
            console.log('[PreviewFrame] Server not ready after max attempts, showing anyway');
            // Fallback: show iframe anyway after max attempts
            timeoutId = setTimeout(() => {
              setUrlReady(true);
            }, 2000); // Additional 2 second fallback
          }
        }
      }, 500); // Check every 500ms
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [preview?.status, preview?.url, urlReady]); // Only depend on status and url changes

  const openInNewTab = () => {
    if (preview?.url) {
      window.open(preview.url, '_blank');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'starting': return 'bg-yellow-500';
      case 'syncing': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      case 'stopped': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'running': return 'Running';
      case 'starting': return 'Starting';
      case 'syncing': return 'Syncing Files';
      case 'error': return 'Error';
      case 'stopped': return 'Stopped';
      default: return 'Unknown';
    }
  };

  const config = deviceConfig[device];

  return (
    <Card className="flex-1 flex flex-col overflow-hidden">
      {/* Preview Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center space-x-4">
          <h3 className="font-semibold">Live Preview</h3>
          
          {preview && (
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(preview.status)}`} />
              <Badge variant="secondary" className="text-xs">
                {getStatusLabel(preview.status)}
              </Badge>
              {preview.syncResult && (
                <Badge variant="outline" className="text-xs">
                  {preview.syncResult.filesDownloaded} files
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Device Selection */}
          <div className="flex items-center space-x-1 mr-4">
            <Button
              variant={device === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onDeviceChange('desktop')}
              className="p-2"
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={device === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onDeviceChange('tablet')}
              className="p-2"
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={device === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onDeviceChange('mobile')}
              className="p-2"
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>

          {/* Preview Actions */}
          {preview?.status === 'running' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshPreview}
                disabled={iframeLoading}
                className="p-2"
              >
                <RefreshCw className={`w-4 h-4 ${iframeLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={openInNewTab}
                className="p-2"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* Start/Stop Controls */}
          {preview?.status === 'running' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onStop}
              disabled={loading}
              className="flex items-center space-x-1"
            >
              <Square className="w-3 h-3" />
              <span>Stop</span>
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={preview ? onRestart : onStart}
              disabled={loading}
              className="flex items-center space-x-1"
            >
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : preview ? (
                <RotateCcw className="w-3 h-3" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              <span>{loading ? 'Loading...' : preview ? 'Restart' : 'Start Preview'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 flex items-center justify-center p-4 bg-gray-100 overflow-auto">
        {error ? (
          /* Error State */
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-700 mb-2">Preview Error</h3>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={onRestart}
              disabled={loading}
              className="flex items-center space-x-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              <span>Try Again</span>
            </Button>
          </div>
        ) : !preview ? (
          /* No Preview State */
          <div className="text-center max-w-md">
            <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Preview Running</h3>
            <p className="text-gray-500 mb-6">
              Start a live preview to see your project in action. 
              Files will be synced automatically.
            </p>
            <Button
              onClick={onStart}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{loading ? 'Starting...' : 'Start Preview'}</span>
            </Button>
          </div>
        ) : preview.status === 'syncing' || preview.status === 'starting' ? (
          /* Loading State */
          <div className="text-center max-w-md">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {preview.status === 'syncing' ? 'Syncing Files...' : 'Starting Preview...'}
            </h3>
            <p className="text-sm text-gray-500">
              {preview.status === 'syncing' 
                ? 'Downloading project files from storage and installing dependencies'
                : 'Setting up development server'
              }
            </p>
            {preview.syncResult && preview.status === 'starting' && (
              <Badge variant="outline" className="mt-2">
                {preview.syncResult.filesDownloaded} files synced
              </Badge>
            )}
          </div>
        ) : preview.status === 'running' && urlReady ? (
          /* Preview Iframe */
          <div 
            className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300"
            style={{
              width: config.width,
              height: config.height,
              maxWidth: '100%',
              maxHeight: '100%',
            }}
          >
            {iframeLoading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            )}
            <iframe
              key={iframeKey}
              src={preview.url}
              className="w-full h-full border-0"
              onLoad={() => setIframeLoading(false)}
              onError={() => setIframeLoading(false)}
              title={`Preview for ${projectId}`}
            />
          </div>
        ) : preview.status === 'running' && !urlReady ? (
          /* URL Not Ready State */
          <div className="text-center max-w-md">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Waiting for Server...
            </h3>
            <p className="text-sm text-gray-500">
              Preview server is starting up, please wait a moment
            </p>
          </div>
        ) : (
          /* Stopped/Error State */
          <div className="text-center max-w-md">
            <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${preview.status === 'error' ? 'text-red-500' : 'text-amber-500'}`} />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              {preview.status === 'error' ? 'Preview Error' : 'Preview Stopped'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {preview.errorMessage || (preview.status === 'error' 
                ? 'The preview failed to start. Please check your project files and try again.'
                : 'The preview server has stopped. Click restart to start it again.'
              )}
            </p>
            <Button
              variant="default"
              onClick={onRestart}
              disabled={loading}
              className="flex items-center space-x-1"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              <span>Restart Preview</span>
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}