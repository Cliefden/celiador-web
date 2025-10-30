'use client';

import { useEffect, useRef, useState } from 'react';

interface UseSimpleWebSocketOptions {
  url: string;
  token: string;
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  enabled?: boolean;
}

interface WebSocketStats {
  isConnected: boolean;
  connectionStatus: string;
  lastMessage: any;
}

export function useSimpleWebSocket(options: UseSimpleWebSocketOptions): WebSocketStats {
  const { url, token, onMessage, onConnect, onDisconnect, enabled = true } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only connect if enabled and we have a valid token
    if (!enabled || !token || !url || token.length < 10) {
      console.log('🔌 WebSocket connection skipped:', { enabled, hasToken: !!token, tokenLength: token?.length || 0, hasUrl: !!url });
      return;
    }
    
    console.log('🔌 WebSocket connection conditions met, proceeding with connection');
    console.log('🔌 Will attempt connection to:', url);
    console.log('🔌 Token preview:', token.substring(0, 20) + '...');

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
        console.log('🔌 Attempting WebSocket connection to:', url);
        console.log('🔑 Token available:', !!token, 'Length:', token.length);
        console.log('🌐 Browser WebSocket support:', typeof WebSocket !== 'undefined');
        setConnectionStatus('Connecting...');
        
        const ws = new WebSocket(url);
        console.log('✅ WebSocket object created, readyState:', ws.readyState);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('🔌 Simple WebSocket connected successfully');
          console.log('🔌 WebSocket readyState after open:', ws.readyState);
          setIsConnected(true);
          setConnectionStatus('Connected');
          
          // Send authentication
          console.log('🔑 Sending authentication message');
          try {
            ws.send(JSON.stringify({
              type: 'authenticate',
              token: token
            }));
            console.log('🔑 Authentication message sent successfully');
          } catch (sendError) {
            console.error('❌ Failed to send authentication:', sendError);
          }
          
          onConnect?.();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastMessage(data);
            
            if (data.type === 'authenticated') {
              setConnectionStatus('Authenticated');
              // Subscribe to channels
              ws.send(JSON.stringify({ type: 'subscribe', channel: 'jobs' }));
              ws.send(JSON.stringify({ type: 'subscribe', channel: 'projects' }));
              ws.send(JSON.stringify({ type: 'subscribe', channel: 'conversations' }));
            }
            
            onMessage?.(data);
          } catch (error) {
            console.error('WebSocket message parse error:', error);
          }
        };

        ws.onclose = (event) => {
          console.log('🔌 Simple WebSocket disconnected:', event.code, event.reason);
          setIsConnected(false);
          
          if (event.code === 1008) {
            setConnectionStatus('Authentication failed');
          } else if (event.code === 1006) {
            setConnectionStatus('Connection lost');
          } else {
            setConnectionStatus(`Disconnected (${event.code})`);
          }
          
          wsRef.current = null;
          onDisconnect?.();
          
          // Only auto-reconnect if it wasn't an auth failure
          if (event.code !== 1008) {
            reconnectTimeoutRef.current = setTimeout(() => {
              if (enabled && token) {
                connect();
              }
            }, 3000);
          }
        };

        ws.onerror = (error) => {
          console.error('❌ Simple WebSocket error occurred');
          console.error('WebSocket readyState:', ws.readyState);
          console.error('WebSocket URL:', url);
          console.error('Error event type:', error.type);
          console.error('Error event target:', error.target);
          console.error('Was connection established?', ws.readyState === WebSocket.OPEN);
          console.error('Current connection status:', connectionStatus);
          
          // Check if this is a connection failure during handshake
          if (ws.readyState === WebSocket.CONNECTING) {
            console.error('Failed during connection attempt');
            setConnectionStatus('Connection failed during handshake');
          } else if (ws.readyState === WebSocket.CLOSED) {
            console.error('Connection closed unexpectedly');
            setConnectionStatus('Connection closed unexpectedly');
          } else {
            setConnectionStatus(`Error: ${error.type || 'Unknown error'}`);
          };
        };

      } catch (error) {
        console.error('WebSocket connection error:', error);
        setConnectionStatus('Failed');
      }
    };

    connect();
    return cleanup;
  }, [url, token, enabled]); // Only depend on these simple values

  return {
    isConnected,
    connectionStatus,
    lastMessage
  };
}