'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  channels?: string[];
}

interface WebSocketStats {
  totalUsers: number;
  totalConnections: number;
  connectedUsers: string[];
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { session, refreshAuth } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [stats, setStats] = useState<WebSocketStats | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectInterval = options.reconnectInterval || 3000;

  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = true,
    channels = ['jobs', 'projects', 'conversations']
  } = options;

  const getWebSocketUrl = useCallback(async (): Promise<string | null> => {
    if (!session?.access_token) return null;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000'}/api/realtime/connection-info`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        console.error('[WebSocket] Failed to get connection info:', response.status);
        return null;
      }

      const data = await response.json();
      return data.wsUrl;
    } catch (error) {
      console.error('[WebSocket] Error getting connection info:', error);
      return null;
    }
  }, [session?.access_token]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setConnectionStatus('Disconnected');
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && isConnected) {
      try {
        wsRef.current.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('[WebSocket] Error sending message:', error);
        return false;
      }
    }
    return false;
  }, [isConnected]);

  const subscribe = useCallback((channel: string) => {
    return sendMessage({ type: 'subscribe', channel });
  }, [sendMessage]);

  const unsubscribe = useCallback((channel: string) => {
    return sendMessage({ type: 'unsubscribe', channel });
  }, [sendMessage]);

  const connect = useCallback(async () => {
    if (isConnecting || isConnected || !session?.access_token) {
      return;
    }

    // Check if token is expired before connecting
    try {
      if (session?.expires_at) {
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = session.expires_at;
        
        if (now >= expiresAt - 60) { // Refresh if expiring within 60 seconds
          console.log('🔄 Token expiring soon, refreshing before WebSocket connection...');
          await refreshAuth();
          return; // Let the effect handle reconnection with fresh token
        }
      }
    } catch (error) {
      console.error('Error checking/refreshing token:', error);
    }

    setIsConnecting(true);
    setConnectionStatus('Connecting...');

    try {
      const wsUrl = await getWebSocketUrl();
      if (!wsUrl) {
        setConnectionStatus('Failed to get connection URL');
        setIsConnecting(false);
        return;
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionStatus('Connected');
        reconnectAttempts.current = 0;

        // Send authentication message
        ws.send(JSON.stringify({
          type: 'authenticate',
          token: session.access_token
        }));

        onConnect?.();
      };

      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);

          // Handle specific message types
          switch (message.type) {
            case 'authenticated':
              console.log('✅ WebSocket authenticated');
              setConnectionStatus('Authenticated');
              
              // Subscribe to channels
              channels.forEach(channel => {
                ws.send(JSON.stringify({ type: 'subscribe', channel }));
              });
              break;

            case 'authentication_failed':
              console.log('❌ WebSocket authentication failed - refreshing token');
              setConnectionStatus('Authentication failed - refreshing token');
              
              // Try to refresh the token and reconnect
              try {
                await refreshAuth();
                // Close current connection to trigger reconnect with new token
                ws.close();
              } catch (error) {
                console.error('Failed to refresh token:', error);
              }
              break;

            case 'subscribed':
              console.log(`📡 Subscribed to channel: ${message.channel}`);
              break;

            case 'initial_data':
              console.log('📥 Received initial data:', message.data);
              break;

            case 'pong':
              // Handle ping/pong for connection health
              break;

            default:
              // Pass to user-defined message handler
              onMessage?.(message);
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      const reconnectWithExponentialBackoff = () => {
        if (autoReconnect && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = baseReconnectInterval * Math.pow(2, reconnectAttempts.current);
          setConnectionStatus(`Reconnecting in ${Math.ceil(delay / 1000)}s...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            // Call connect directly instead of recursion
            setIsConnecting(false);
            setIsConnected(false);
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setConnectionStatus('Connection failed');
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionStatus('Disconnected');
        wsRef.current = null;

        onDisconnect?.();
        reconnectWithExponentialBackoff();
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('Connection error');
        onError?.(error);
      };

    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      setIsConnecting(false);
      setConnectionStatus('Connection failed');
    }
  }, [session?.access_token, getWebSocketUrl, channels, onConnect, onMessage, onDisconnect, onError, autoReconnect, baseReconnectInterval]);

  // Auto-connect when session is available
  useEffect(() => {
    if (session?.access_token && !isConnected && !isConnecting) {
      connect();
    }

    // Cleanup function that doesn't depend on the disconnect callback
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [session?.access_token]);

  // Ping the server periodically to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    isConnecting,
    connectionStatus,
    lastMessage,
    stats,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    unsubscribe
  };
}