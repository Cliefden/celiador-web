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
  RotateCcw,
  MousePointer,
  Search
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
  // Inspection mode props
  inspectionMode?: boolean;
  onToggleInspection?: () => void;
  // Iframe ref for inspection system
  iframeRef?: React.RefObject<HTMLIFrameElement>;
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
  error,
  inspectionMode = false,
  onToggleInspection,
  iframeRef
}: PreviewFrameProps) {
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [urlReady, setUrlReady] = useState(false);
  const [currentPath, setCurrentPath] = useState('/'); // Track current page path

  const refreshPreview = () => {
    setIframeKey(prev => prev + 1);
    setIframeLoading(true);
    setUrlReady(false); // Reset URL readiness to trigger re-check
  };

  // Generate same-origin preview URL with auth token and preserve current path
  const getSameOriginPreviewUrl = async (originalUrl: string, preservePath?: string) => {
    console.log('[getSameOriginPreviewUrl] 🔍 Starting with URL:', originalUrl);
    console.log('[getSameOriginPreviewUrl] 🔍 Preserve path:', preservePath);
    
    if (!originalUrl) {
      console.log('[getSameOriginPreviewUrl] ❌ No URL provided');
      return null;
    }
    
    try {
      // Get auth token for the proxy URL
      console.log('[getSameOriginPreviewUrl] 🔐 Getting auth session...');
      const { supabase } = await import('../../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn('[getSameOriginPreviewUrl] ❌ No session available for preview proxy');
        return null;
      }
      
      console.log('[getSameOriginPreviewUrl] ✅ Session found, user:', session.user?.id);
      
      // If the URL is already a backend proxy URL, just add the token
      console.log('[getSameOriginPreviewUrl] 🔍 Checking if URL is backend proxy URL...');
      console.log('[getSameOriginPreviewUrl] 🔍 Contains /projects/:', originalUrl.includes('/projects/'));
      console.log('[getSameOriginPreviewUrl] 🔍 Contains /preview/:', originalUrl.includes('/preview/'));
      console.log('[getSameOriginPreviewUrl] 🔍 Contains /proxy/:', originalUrl.includes('/proxy/'));
      
      if (originalUrl.includes('/projects/') && originalUrl.includes('/preview/') && originalUrl.includes('/proxy/')) {
        console.log('[getSameOriginPreviewUrl] 🔧 Processing backend proxy URL');
        console.log('[getSameOriginPreviewUrl] 🔧 Original URL:', originalUrl);
        console.log('[getSameOriginPreviewUrl] 🔧 Path to preserve:', preservePath);
        
        let finalUrl;
        if (preservePath && preservePath !== '/') {
          // Ensure the URL ends with /proxy/ and append the path
          const baseUrl = originalUrl.endsWith('/') ? originalUrl : originalUrl + '/';
          // Remove leading slash from preservePath since baseUrl ends with /
          const cleanPath = preservePath.startsWith('/') ? preservePath.substring(1) : preservePath;
          finalUrl = baseUrl + cleanPath;
          console.log('[getSameOriginPreviewUrl] ✅ URL with preserved path:', finalUrl);
        } else {
          finalUrl = originalUrl;
          console.log('[getSameOriginPreviewUrl] ✅ Using original URL (no path to preserve)');
        }
        
        const urlWithAuth = `${finalUrl}?token=${encodeURIComponent(session.access_token)}`;
        console.log('[getSameOriginPreviewUrl] 🎯 Final URL with auth:', urlWithAuth);
        return urlWithAuth;
      }
      
      // Should not reach here - all preview URLs should be backend proxy URLs
      console.error('[getSameOriginPreviewUrl] ❌ Unexpected URL format - not a backend proxy URL');
      return null;
    } catch (error) {
      console.error('[getSameOriginPreviewUrl] ❌ Error generating same-origin URL:', error);
      return null;
    }
  };

  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authSetupTimeout, setAuthSetupTimeout] = useState(false);

  // Listen for navigation changes in the preview iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PREVIEW_NAVIGATION') {
        console.log('[PreviewFrame] 🧭 Navigation detected:', event.data.path);
        setCurrentPath(event.data.path || '/');
      } else if (event.data?.type === 'CURRENT_PATH_RESPONSE') {
        console.log('[PreviewFrame] 📍 Received current path from iframe:', event.data.path);
        setCurrentPath(event.data.path || '/');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Initialize current path from iframe when it first loads
  useEffect(() => {
    if (iframeRef?.current?.src && !inspectionMode) {
      const detectedPath = getCurrentPathFromIframe();
      if (detectedPath !== currentPath) {
        console.log('[PreviewFrame] 🔄 Initializing current path from iframe:', detectedPath);
        setCurrentPath(detectedPath);
      }
    }
  }, [preview?.url, preview?.status]);

  // Function to extract current path from iframe URL
  const getCurrentPathFromIframe = (): string => {
    if (!iframeRef?.current?.src) {
      console.log('[PreviewFrame] 📍 No iframe src available');
      return '/';
    }
    
    try {
      const url = new URL(iframeRef.current.src);
      console.log('[PreviewFrame] 📍 Parsing iframe URL:', {
        fullUrl: iframeRef.current.src,
        pathname: url.pathname,
        search: url.search
      });
      
      // If it's a proxy URL, extract the path after /proxy/
      if (url.pathname.includes('/proxy/')) {
        const proxyIndex = url.pathname.indexOf('/proxy/');
        let pathAfterProxy = url.pathname.substring(proxyIndex + '/proxy'.length);
        
        console.log('[PreviewFrame] 📍 Found proxy URL, pathAfterProxy raw:', pathAfterProxy);
        
        // Ensure path starts with /
        if (!pathAfterProxy.startsWith('/')) {
          pathAfterProxy = '/' + pathAfterProxy;
        }
        
        // If path is just '/' or empty, return root
        if (pathAfterProxy === '/' || pathAfterProxy === '') {
          console.log('[PreviewFrame] 📍 Proxy path is root');
          return '/';
        }
        
        console.log('[PreviewFrame] 📍 Extracted proxy path:', pathAfterProxy);
        return pathAfterProxy;
      }
      
      // If it's a direct URL, use the pathname
      const directPath = url.pathname || '/';
      console.log('[PreviewFrame] 📍 Using direct URL path:', directPath);
      return directPath;
    } catch (error) {
      console.warn('[PreviewFrame] Failed to parse iframe URL:', error);
      return '/';
    }
  };

  // Function to request current path from iframe (async)
  const requestCurrentPathFromIframe = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!iframeRef?.current?.contentWindow) {
        console.warn('[PreviewFrame] No iframe contentWindow available');
        resolve('/');
        return;
      }

      // Set up a one-time listener for the response
      const handleResponse = (event: MessageEvent) => {
        if (event.data?.type === 'CURRENT_PATH_RESPONSE') {
          console.log('[PreviewFrame] 📍 Received path response:', event.data.path);
          window.removeEventListener('message', handleResponse);
          resolve(event.data.path || '/');
        }
      };

      window.addEventListener('message', handleResponse);

      // Send request
      try {
        iframeRef.current.contentWindow.postMessage({ type: 'GET_CURRENT_PATH' }, '*');
        console.log('[PreviewFrame] 📤 Requested current path from iframe');
        
        // Timeout after 1 second
        setTimeout(() => {
          window.removeEventListener('message', handleResponse);
          console.log('[PreviewFrame] ⏰ Path request timed out, using fallback');
          resolve(currentPath !== '/' ? currentPath : '/');
        }, 1000);
      } catch (error) {
        console.warn('[PreviewFrame] Could not request current path from iframe:', error);
        window.removeEventListener('message', handleResponse);
        resolve('/');
      }
    });
  };

  // Function to determine the path to use when switching to inspection mode
  const getPathForInspection = async (): Promise<string> => {
    console.log('[PreviewFrame] 🎯 getPathForInspection called - determining current path...');
    console.log('[PreviewFrame] 🎯 Current state:', {
      currentPath,
      inspectionMode,
      iframeSrc: iframeRef?.current?.src
    });
    
    // First try to extract from iframe URL (most reliable)
    const extractedPath = getCurrentPathFromIframe();
    console.log('[PreviewFrame] 🎯 Extracted path from iframe URL:', extractedPath);
    
    if (extractedPath !== '/') {
      console.log('[PreviewFrame] ✅ Using extracted path (non-root):', extractedPath);
      return extractedPath;
    }
    
    // If we have a tracked currentPath that's not root, use it as fallback
    if (currentPath !== '/') {
      console.log('[PreviewFrame] ✅ Using tracked currentPath as fallback:', currentPath);
      return currentPath;
    }
    
    // Last resort: request from iframe (but with shorter timeout)
    console.log('[PreviewFrame] 📞 Last resort: requesting current path from iframe...');
    const requestedPath = await requestCurrentPathFromIframe();
    console.log('[PreviewFrame] 🎯 Iframe responded with path:', requestedPath);
    return requestedPath || '/';
  };

  // Generate proxy URL when preview is ready or when we need to preserve path
  useEffect(() => {
    console.log('[PreviewFrame] Effect triggered - preview status:', preview?.status, 'URL:', preview?.url);
    console.log('[PreviewFrame] Current path:', currentPath, 'Inspection mode:', inspectionMode);
    
    // Reset timeout when effect runs
    setAuthSetupTimeout(false);
    
    if (preview?.url && preview.status === 'running') {
      console.log('[PreviewFrame] ✅ Preview is running, generating proxy URL...');
      console.log('[PreviewFrame] 🔍 Preview URL to check:', preview.url);
      console.log('[PreviewFrame] 🔍 URL contains /projects/:', preview.url.includes('/projects/'));
      console.log('[PreviewFrame] 🔍 URL contains /preview/:', preview.url.includes('/preview/'));
      console.log('[PreviewFrame] 🔍 URL contains /proxy/:', preview.url.includes('/proxy/'));
      
      // Set timeout for auth setup (10 seconds)
      const authTimeout = setTimeout(() => {
        console.warn('[PreviewFrame] ⏰ Auth setup timeout - falling back to direct URL');
        setAuthSetupTimeout(true);
      }, 10000);
      
      // Generate proxy URL with path preservation for inspection mode
      const generateProxyUrl = async () => {
        let pathToPreserve: string | undefined = undefined;
        
        if (inspectionMode) {
          pathToPreserve = await getPathForInspection();
          console.log('[PreviewFrame] 🎯 Inspection mode path preservation:', {
            currentPath,
            extractedPath: getCurrentPathFromIframe(),
            finalPath: pathToPreserve
          });
        }
        
        try {
          const url = await getSameOriginPreviewUrl(preview.url, pathToPreserve);
          console.log('[PreviewFrame] ✅ Generated same-origin proxy URL:', url);
          console.log('[PreviewFrame] 📍 Original preview URL was:', preview.url);
          console.log('[PreviewFrame] 📍 Preserved path:', pathToPreserve);
          setProxyUrl(url);
          setAuthReady(!!url);
          clearTimeout(authTimeout); // Clear timeout on success
          console.log('[PreviewFrame] 🔄 Auth ready set to:', !!url);
        } catch (error) {
          console.error('[PreviewFrame] ❌ Failed to generate proxy URL:', error);
          setProxyUrl(null);
          setAuthReady(false);
          clearTimeout(authTimeout); // Clear timeout on error
        }
      };
      
      generateProxyUrl();
      
      // Return cleanup function
      return () => {
        clearTimeout(authTimeout);
      };
    } else {
      console.log('[PreviewFrame] ⏸️ Preview not ready - status:', preview?.status, 'URL exists:', !!preview?.url);
      setProxyUrl(null);
      setAuthReady(false);
    }
  }, [preview?.url, preview?.status, projectId, currentPath, inspectionMode]);

  // Effect to communicate inspection mode changes to iframe
  useEffect(() => {
    console.log('[PreviewFrame] Inspection mode changed:', {
      inspectionMode,
      previewStatus: preview?.status,
      urlReady,
      projectId
    });

    if (preview?.status === 'running' && urlReady && iframeRef?.current) {
      const iframe = iframeRef.current;
      
      if (iframe.contentWindow) {
        const message = {
          type: inspectionMode ? 'ENABLE_INSPECTION' : 'DISABLE_INSPECTION'
        };
        
        console.log('[PreviewFrame] Sending message to same-origin iframe:', message);
        
        // Same-origin iframe - no CORS restrictions!
        try {
          iframe.contentWindow.postMessage(message, window.location.origin);
          console.log('✅ Message sent successfully to same-origin iframe');
        } catch (error) {
          console.warn('⚠️ Failed to send message to iframe:', error);
        }
      } else {
        console.warn('[PreviewFrame] No iframe contentWindow available');
      }
    } else {
      console.log('[PreviewFrame] Conditions not met for sending message:', {
        status: preview?.status,
        urlReady,
        hasIframe: !!iframeRef?.current
      });
    }
  }, [inspectionMode, preview?.status, urlReady, iframeRef]);

  // Effect to reset URL readiness when preview changes
  useEffect(() => {
    setUrlReady(false);
  }, [preview?.id]);

  // Simplified URL readiness - trust backend status
  useEffect(() => {
    if (preview?.status === 'running' && preview.url) {
      console.log('[PreviewFrame] Preview running with URL, setting URL ready immediately');
      setUrlReady(true);
    } else {
      setUrlReady(false);
    }
  }, [preview?.status, preview?.url]);

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

  // Debug render state
  console.log('[PreviewFrame] 🔍 Render state:', {
    status: preview?.status,
    urlReady,
    authReady,
    hasProxyUrl: !!proxyUrl,
    proxyUrl: proxyUrl,
    error,
    previewExists: !!preview,
    previewUrl: preview?.url
  });

  // Debug which condition will be taken
  if (error) {
    console.log('[PreviewFrame] 🔴 Will render: Error State');
  } else if (!preview) {
    console.log('[PreviewFrame] 🔴 Will render: No Preview State');
  } else if (preview.status === 'syncing' || preview.status === 'starting') {
    console.log('[PreviewFrame] 🟡 Will render: Loading State');
  } else if (preview.status === 'running' && !authReady) {
    console.log('[PreviewFrame] 🟣 Will render: Auth/Proxy Setup State');
  } else if (preview.status === 'running' && authReady && proxyUrl) {
    console.log('[PreviewFrame] 🟢 Will render: Preview Iframe WITH PROXY');
  } else if (preview.status === 'running' && !urlReady) {
    console.log('[PreviewFrame] 🟡 Will render: URL Not Ready State');
  } else {
    console.log('[PreviewFrame] 🔴 Will render: Stopped/Error State');
  }

  return (
    <Card className="flex-1 flex flex-col overflow-hidden">
      {/* Preview Controls */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30 min-h-[60px]">
        <div className="flex items-center space-x-3 flex-1">
          <h3 className="font-semibold text-sm">Live Preview</h3>
          
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

        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Device Selection */}
          <div className="flex items-center border border-gray-200 rounded-md">
            <Button
              variant={device === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onDeviceChange('desktop')}
              className="p-2 rounded-r-none border-r"
              title="Desktop View"
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={device === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onDeviceChange('tablet')}
              className="p-2 rounded-none border-r"
              title="Tablet View"
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={device === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onDeviceChange('mobile')}
              className="p-2 rounded-l-none"
              title="Mobile View"
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>

          {/* Inspection Toggle */}
          {onToggleInspection && preview?.status === 'running' && (
            <Button
              variant={inspectionMode ? 'default' : 'ghost'}
              size="sm"
              onClick={onToggleInspection}
              className={`p-2 ${inspectionMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
              title={inspectionMode ? 'Exit Inspection Mode' : 'Inspect UI Elements'}
            >
              {inspectionMode ? (
                <MousePointer className="w-4 h-4" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          )}

          {/* Preview Actions */}
          {preview?.status === 'running' && (
            <div className="flex items-center border border-gray-200 rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshPreview}
                disabled={iframeLoading}
                className="p-2 rounded-r-none border-r"
                title="Refresh Preview"
              >
                <RefreshCw className={`w-4 h-4 ${iframeLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={openInNewTab}
                className="p-2 rounded-l-none"
                title="Open in New Tab"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Start/Stop Controls */}
          <div className="ml-2">
            {preview?.status === 'running' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onStop}
                disabled={loading}
                className="flex items-center space-x-1 px-3"
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
                className="flex items-center space-x-1 px-3"
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
        ) : preview.status === 'running' && inspectionMode && (!authReady || !proxyUrl) && !authSetupTimeout ? (
          /* Auth/Proxy Setup State - Only for inspection mode with timeout */
          <div className="text-center max-w-md">
            <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Setting up Inspection Mode...
            </h3>
            <p className="text-sm text-gray-500">
              Configuring secure preview access for element inspection
            </p>
            <div className="mt-3 text-xs text-gray-400">
              authReady: {String(authReady)}, hasProxyUrl: {String(!!proxyUrl)}
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('[PreviewFrame] Force refresh proxy URL generation');
                  // Force refresh the proxy URL generation
                  setAuthReady(false);
                  setProxyUrl(null);
                  setAuthSetupTimeout(false);
                }}
                className="text-purple-400 border-purple-400 hover:bg-purple-400/10"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry Setup
              </Button>
            </div>
          </div>
        ) : preview.status === 'running' && inspectionMode && authSetupTimeout ? (
          /* Auth Setup Timeout - Fallback to direct URL */
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-orange-600 mb-2">
              Inspection Setup Timeout
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Unable to configure inspection mode proxy. You can still view the preview directly.
            </p>
            <div className="space-y-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  console.log('[PreviewFrame] Fallback to direct URL');
                  // Exit inspection mode and use direct URL
                  onToggleInspection?.();
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View Direct Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('[PreviewFrame] Retry inspection setup');
                  setAuthSetupTimeout(false);
                  setAuthReady(false);
                  setProxyUrl(null);
                }}
                className="text-orange-500 border-orange-500 hover:bg-orange-500/10"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry Inspection Setup
              </Button>
            </div>
          </div>
        ) : preview.status === 'running' && ((!inspectionMode && preview.url) || (inspectionMode && authReady && proxyUrl)) ? (
          /* Preview Iframe - Use direct URL for normal mode, proxy URL for inspection mode */
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
              key={`${iframeKey}-${inspectionMode ? proxyUrl : preview.url}`}
              ref={iframeRef}
              src={inspectionMode ? proxyUrl : preview.url}
              className="w-full h-full border-0"
              onLoad={() => {
                setIframeLoading(false);
                const currentUrl = inspectionMode ? proxyUrl : preview.url;
                console.log('🎬 Preview iframe loaded successfully');
                console.log('🔗 Iframe URL:', currentUrl);
                console.log('🔍 Mode:', inspectionMode ? 'INSPECTION (same-origin proxy)' : 'NORMAL (direct URL)');
                
                // Update current path based on loaded URL
                const detectedPath = getCurrentPathFromIframe();
                if (detectedPath !== currentPath) {
                  console.log('📍 Updating current path from iframe URL:', detectedPath);
                  setCurrentPath(detectedPath);
                }
                
                if (inspectionMode) {
                  console.log('✅ Using same-origin proxy - inspection should work!');
                }
              }}
              onError={() => {
                setIframeLoading(false);
                const currentUrl = inspectionMode ? proxyUrl : preview.url;
                console.error('❌ Preview iframe failed to load');
                console.error('❌ Failed URL:', currentUrl);
                console.error('❌ Mode:', inspectionMode ? 'INSPECTION' : 'NORMAL');
              }}
              title={`${inspectionMode ? 'Inspection' : 'Direct'} Preview for ${projectId}`}
              // Remove sandbox for same-origin - we need full access
              allowFullScreen
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