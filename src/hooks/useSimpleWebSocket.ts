'use client';

import { useEffect, useRef, useState } from 'react';

interface UseSimpleWebSocketOptions {
  url: string;
  token: string;
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: WebSocketErrorDetails) => void;
  enabled?: boolean;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

interface WebSocketErrorDetails {
  type: 'connection' | 'authentication' | 'network' | 'unknown';
  message: string;
  userMessage: string; // User-friendly message
  code?: number;
  canRetry: boolean;
  isTokenExpired?: boolean;
  severity: 'low' | 'medium' | 'high';
  suggestedAction?: string;
}

interface WebSocketStats {
  isConnected: boolean;
  connectionStatus: string;
  lastMessage: any;
  error: WebSocketErrorDetails | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  
  // Helper methods for error handling
  hasError: boolean;
  canRetry: boolean;
  isRetrying: boolean;
  getUserFriendlyStatus: () => string;
}

export function useSimpleWebSocket(options: UseSimpleWebSocketOptions): WebSocketStats {
  const { 
    url, 
    token, 
    onMessage, 
    onConnect, 
    onDisconnect, 
    onError,
    enabled = true,
    maxReconnectAttempts = 5,
    reconnectDelay = 1000
  } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState<WebSocketErrorDetails | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReconnectingRef = useRef(false);

  // Helper function to create error objects
  const createError = (
    type: WebSocketErrorDetails['type'], 
    message: string, 
    userMessage?: string,
    code?: number,
    isTokenExpired = false,
    severity: WebSocketErrorDetails['severity'] = 'medium',
    suggestedAction?: string
  ): WebSocketErrorDetails => ({
    type,
    message,
    userMessage: userMessage || message,
    code,
    canRetry: type !== 'authentication' || isTokenExpired,
    isTokenExpired,
    severity,
    suggestedAction
  });

  // Enhanced error reporting with user-friendly messages
  const reportError = (errorDetails: WebSocketErrorDetails) => {
    setError(errorDetails);
    onError?.(errorDetails);
    
    // Log errors with appropriate level based on severity
    const logMessage = `WebSocket ${errorDetails.type}: ${errorDetails.message}`;
    
    switch (errorDetails.severity) {
      case 'low':
        // Low severity - expected issues like temporary network drops
        if (errorDetails.type === 'authentication' && errorDetails.isTokenExpired) {
          console.info('🔑 WebSocket: Token expired, will retry with fresh token');
        } else if (errorDetails.canRetry && reconnectAttempts < maxReconnectAttempts) {
          console.info(`🔌 WebSocket: ${errorDetails.userMessage} (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
        } else {
          console.info(`ℹ️ ${logMessage}`);
        }
        break;
        
      case 'medium':
        // Medium severity - connection issues that might resolve
        if (errorDetails.canRetry && reconnectAttempts < maxReconnectAttempts) {
          console.warn(`⚠️ WebSocket: ${errorDetails.userMessage}. Retrying... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          console.warn('🔄 WebSocket: Max retries reached. Consider refreshing the page or checking your network connection.');
        } else {
          console.warn(`⚠️ ${logMessage}`);
        }
        break;
        
      case 'high':
        // High severity - serious errors that need attention
        console.error(`❌ WebSocket: ${errorDetails.userMessage}`);
        if (errorDetails.suggestedAction) {
          console.error(`   Suggestion: ${errorDetails.suggestedAction}`);
        }
        break;
    }
    
    // Additional context for developers in debug mode
    if (process.env.NODE_ENV === 'development') {
      console.debug('WebSocket Error Details:', {
        type: errorDetails.type,
        code: errorDetails.code,
        canRetry: errorDetails.canRetry,
        reconnectAttempts,
        maxReconnectAttempts
      });
    }
  };

  // Clear error when connection succeeds
  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    // Only connect if enabled and we have a valid token
    if (!enabled || !token || !url || token.length < 10) {
      return;
    }
    
    // Connection attempt will be logged when successful

    // Cleanup function
    const cleanup = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      setConnectionStatus('Disconnected');
    };

    // Connect function
    const connect = () => {
      try {
        setConnectionStatus('Connecting...');
        
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('🔌 WebSocket connected successfully');
          setIsConnected(true);
          setConnectionStatus('Authenticating...');
          clearError();
          
          // Send authentication
          try {
            ws.send(JSON.stringify({
              type: 'authenticate',
              token: token
            }));
            // Authentication sent, waiting for response
          } catch (sendError) {
            const errorDetails = createError(
              'authentication',
              `Failed to send authentication: ${sendError.message}`,
              'Could not authenticate with the server',
              undefined,
              false,
              'high',
              'Please refresh the page and try again'
            );
            reportError(errorDetails);
            setConnectionStatus('Authentication failed');
          }
          
          onConnect?.();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastMessage(data);
            
            if (data.type === 'authenticated') {
              setConnectionStatus('Authenticated');
              setReconnectAttempts(0); // Reset reconnect attempts on successful auth
              clearError();
              
              // Subscribe to channels
              try {
                ws.send(JSON.stringify({ type: 'subscribe', channel: 'jobs' }));
                ws.send(JSON.stringify({ type: 'subscribe', channel: 'projects' }));
                ws.send(JSON.stringify({ type: 'subscribe', channel: 'conversations' }));
                ws.send(JSON.stringify({ type: 'subscribe', channel: 'deployments' }));
                ws.send(JSON.stringify({ type: 'subscribe', channel: 'system_notifications' }));
                // Subscribed to all real-time channels including activities
              } catch (subscribeError) {
                const errorDetails = createError(
                  'connection',
                  `Failed to subscribe to channels: ${subscribeError.message}`,
                  'Unable to set up real-time updates',
                  undefined,
                  false,
                  'medium',
                  'Real-time features may not work properly'
                );
                reportError(errorDetails);
              }
            } else if (data.type === 'error') {
              const isTokenError = data.message?.includes('token') || data.message?.includes('auth');
              const errorDetails = createError(
                isTokenError ? 'authentication' : 'unknown',
                data.message || 'Unknown server error',
                isTokenError 
                  ? 'Authentication expired - please refresh to continue'
                  : 'The server encountered an error',
                data.code,
                isTokenError,
                isTokenError ? 'medium' : 'high',
                isTokenError 
                  ? 'Please refresh the page to renew your session'
                  : 'If this persists, please try again later'
              );
              reportError(errorDetails);
            }
            
            onMessage?.(data);
          } catch (parseError) {
            const errorDetails = createError(
              'network',
              `Failed to parse WebSocket message: ${parseError.message}`,
              'Received invalid data from server',
              undefined,
              false,
              'low',
              'This message will be ignored and should resolve automatically'
            );
            reportError(errorDetails);
          }
        };

        ws.onclose = (event) => {
          // Connection closed - determine if this needs logging
          setIsConnected(false);
          wsRef.current = null;
          onDisconnect?.();
          
          // Handle different close codes
          let shouldReconnect = true;
          let errorDetails: WebSocketErrorDetails | null = null;
          
          switch (event.code) {
            case 1000: // Normal closure
              setConnectionStatus('Disconnected');
              shouldReconnect = false;
              break;
              
            case 1008: // Policy violation (usually auth failure)
              errorDetails = createError(
                'authentication',
                'Authentication failed - invalid or expired token',
                'Your session has expired',
                event.code,
                true, // This could be token expiration
                'medium',
                'Please refresh the page to sign in again'
              );
              setConnectionStatus('Authentication failed');
              shouldReconnect = reconnectAttempts < maxReconnectAttempts;
              break;
              
            case 1006: // Abnormal closure (network issue) - This is the main error we're improving
              const isFirstFailure = reconnectAttempts === 0;
              errorDetails = createError(
                'network',
                'Connection lost unexpectedly',
                isFirstFailure 
                  ? 'Connection temporarily interrupted'
                  : `Connection lost (retry ${reconnectAttempts + 1}/${maxReconnectAttempts})`,
                event.code,
                false,
                isFirstFailure ? 'low' : 'medium',
                reconnectAttempts >= maxReconnectAttempts - 1
                  ? 'Please check your internet connection and consider refreshing the page'
                  : 'Attempting to reconnect automatically...'
              );
              setConnectionStatus(
                reconnectAttempts === 0 
                  ? 'Reconnecting...'
                  : `Connection lost (${reconnectAttempts + 1}/${maxReconnectAttempts})`
              );
              break;
              
            default:
              errorDetails = createError(
                'connection',
                event.reason || `Connection closed (code: ${event.code})`,
                event.reason || 'Connection ended unexpectedly',
                event.code,
                false,
                'medium',
                'The connection will be restored automatically if possible'
              );
              setConnectionStatus(`Disconnected (${event.code})`);
          }
          
          if (errorDetails) {
            reportError(errorDetails);
          }
          
          // Auto-reconnect with backoff
          if (shouldReconnect && enabled && token && reconnectAttempts < maxReconnectAttempts) {
            const delay = Math.min(reconnectDelay * Math.pow(2, reconnectAttempts), 30000);
            setConnectionStatus(`Reconnecting in ${Math.ceil(delay / 1000)}s...`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              if (enabled && token && !isReconnectingRef.current) {
                setReconnectAttempts(prev => prev + 1);
                connect();
              }
            }, delay);
          } else if (reconnectAttempts >= maxReconnectAttempts) {
            setConnectionStatus('Connection failed');
            const maxRetriesError = createError(
              'connection',
              `Maximum reconnection attempts (${maxReconnectAttempts}) exceeded`,
              'Unable to restore connection',
              undefined,
              false,
              'high',
              'Please check your internet connection and refresh the page to try again'
            );
            reportError(maxRetriesError);
          }
        };

        ws.onerror = (errorEvent) => {
          // Only report errors that aren't already handled by onclose
          // Most WebSocket errors are followed immediately by onclose with proper details
          
          if (ws.readyState === WebSocket.CONNECTING) {
            // Connection establishment failed
            const errorDetails = createError(
              'connection',
              'Failed to connect to WebSocket server - please check your network connection',
              'Cannot reach the server',
              undefined,
              false,
              'high',
              'Please check your internet connection and try refreshing the page'
            );
            setConnectionStatus('Connection failed');
            reportError(errorDetails);
          }
          // For other states, let onclose handle the error reporting with more specific details
        };

      } catch (error) {
        console.error('WebSocket connection error:', error);
        setConnectionStatus('Failed');
      }
    };

    connect();
    return cleanup;
  }, [url, token, enabled]); // Only depend on these simple values

  // Helper functions for easier error handling
  const hasError = error !== null;
  const canRetry = error?.canRetry || false;
  const isRetrying = reconnectAttempts > 0 && reconnectAttempts < maxReconnectAttempts;
  
  const getUserFriendlyStatus = (): string => {
    if (error) {
      switch (error.severity) {
        case 'low':
          return error.userMessage;
        case 'medium':
          return isRetrying ? `${error.userMessage} (retrying...)` : error.userMessage;
        case 'high':
          return `⚠️ ${error.userMessage}`;
        default:
          return error.userMessage;
      }
    }
    
    if (isConnected) {
      return 'Connected';
    }
    
    if (connectionStatus.includes('Connecting')) {
      return 'Connecting...';
    }
    
    if (connectionStatus.includes('Reconnecting')) {
      return connectionStatus;
    }
    
    return connectionStatus;
  };

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    error,
    reconnectAttempts,
    maxReconnectAttempts,
    hasError,
    canRetry,
    isRetrying,
    getUserFriendlyStatus
  };
}