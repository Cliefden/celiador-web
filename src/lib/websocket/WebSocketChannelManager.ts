'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Generic message types for all channels
export interface WebSocketMessage<TData = any> {
  type: string;
  channel: string;
  data: TData;
  userId?: string;
  timestamp: string;
}

// Channel subscription interface
export interface ChannelSubscription<TData = any> {
  channel: string;
  onMessage: (message: WebSocketMessage<TData>) => void;
  onError?: (error: WebSocketError) => void;
  enabled?: boolean;
}

// WebSocket error details
export interface WebSocketError {
  type: 'connection' | 'authentication' | 'network' | 'unknown';
  message: string;
  userMessage: string;
  code?: number;
  canRetry: boolean;
  isTokenExpired?: boolean;
  severity: 'low' | 'medium' | 'high';
  suggestedAction?: string;
}

// Connection status
export interface WebSocketConnectionState {
  isConnected: boolean;
  connectionStatus: string;
  error: WebSocketError | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  hasError: boolean;
  canRetry: boolean;
  isRetrying: boolean;
  getUserFriendlyStatus: () => string;
}

// WebSocket channel manager options
export interface WebSocketChannelManagerOptions {
  url: string;
  token: string;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  enabled?: boolean;
}

// Channel manager class for managing WebSocket connections and subscriptions
export class WebSocketChannelManager {
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, ChannelSubscription>();
  private connectionState: WebSocketConnectionState;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isReconnecting = false;
  private isCleaningUp = false;
  private options: Required<WebSocketChannelManagerOptions>;

  // Event callbacks
  private onConnectionChange?: (state: WebSocketConnectionState) => void;
  private onGlobalMessage?: (message: WebSocketMessage) => void;

  constructor(options: WebSocketChannelManagerOptions) {
    this.options = {
      maxReconnectAttempts: 5,
      reconnectDelay: 1000,
      enabled: true,
      ...options
    };

    this.connectionState = {
      isConnected: false,
      connectionStatus: 'Disconnected',
      error: null,
      reconnectAttempts: 0,
      maxReconnectAttempts: this.options.maxReconnectAttempts,
      hasError: false,
      canRetry: false,
      isRetrying: false,
      getUserFriendlyStatus: () => this.getUserFriendlyStatus()
    };
  }

  // Initialize connection
  connect(): void {
    if (!this.options.enabled || !this.options.token || this.ws || this.isCleaningUp) {
      return;
    }

    try {
      this.updateConnectionState({ connectionStatus: 'Connecting...' });
      
      this.ws = new WebSocket(this.options.url);

      this.ws.onopen = () => {
        console.log('🔌 WebSocket connected successfully');
        this.updateConnectionState({ 
          isConnected: true, 
          connectionStatus: 'Authenticating...',
          error: null 
        });
        
        // Send authentication
        this.sendMessage({
          type: 'authenticate',
          token: this.options.token
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          this.reportError({
            type: 'network',
            message: `Failed to parse WebSocket message: ${error.message}`,
            userMessage: 'Received invalid data from server',
            canRetry: false,
            severity: 'low',
            suggestedAction: 'This message will be ignored and should resolve automatically'
          });
        }
      };

      this.ws.onclose = (event) => {
        this.updateConnectionState({ isConnected: false });
        this.ws = null;
        this.handleDisconnection(event);
      };

      this.ws.onerror = () => {
        if (this.ws?.readyState === WebSocket.CONNECTING) {
          this.reportError({
            type: 'connection',
            message: 'Failed to connect to WebSocket server',
            userMessage: 'Cannot reach the server',
            canRetry: true,
            severity: 'high',
            suggestedAction: 'Please check your internet connection and try refreshing the page'
          });
        }
      };

    } catch (error) {
      this.reportError({
        type: 'connection',
        message: `WebSocket connection error: ${error.message}`,
        userMessage: 'Failed to establish connection',
        canRetry: true,
        severity: 'high'
      });
    }
  }

  // Handle incoming messages
  private handleMessage(message: WebSocketMessage): void {
    // Handle authentication response
    if (message.type === 'authenticated') {
      this.updateConnectionState({ 
        connectionStatus: 'Authenticated',
        reconnectAttempts: 0,
        error: null 
      });
      
      // Subscribe to all registered channels
      this.subscriptions.forEach((subscription, channel) => {
        if (subscription.enabled !== false) {
          this.sendMessage({ type: 'subscribe', channel });
        }
      });
      return;
    }

    // Handle error messages
    if (message.type === 'error') {
      const isTokenError = message.data?.message?.includes('token') || message.data?.message?.includes('auth');
      this.reportError({
        type: isTokenError ? 'authentication' : 'unknown',
        message: message.data?.message || 'Unknown server error',
        userMessage: isTokenError 
          ? 'Authentication expired - please refresh to continue'
          : 'The server encountered an error',
        canRetry: isTokenError,
        isTokenExpired: isTokenError,
        severity: isTokenError ? 'medium' : 'high',
        suggestedAction: isTokenError 
          ? 'Please refresh the page to renew your session'
          : 'If this persists, please try again later'
      });
      return;
    }

    // Route messages to channel subscribers
    if (message.channel) {
      const subscription = this.subscriptions.get(message.channel);
      if (subscription) {
        try {
          subscription.onMessage(message);
        } catch (error) {
          console.error(`Error in channel ${message.channel} message handler:`, error);
          subscription.onError?.(this.createError('unknown', `Message handler error: ${error.message}`));
        }
      }
    }

    // Call global message handler
    this.onGlobalMessage?.(message);
  }

  // Subscribe to a channel
  subscribe<TData = any>(subscription: ChannelSubscription<TData>): () => void {
    this.subscriptions.set(subscription.channel, subscription as ChannelSubscription);
    
    // If already connected and authenticated, subscribe immediately
    if (this.connectionState.isConnected && this.connectionState.connectionStatus === 'Authenticated') {
      this.sendMessage({ type: 'subscribe', channel: subscription.channel });
    }

    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(subscription.channel);
      if (this.connectionState.isConnected) {
        this.sendMessage({ type: 'unsubscribe', channel: subscription.channel });
      }
    };
  }

  // Send message through WebSocket
  private sendMessage(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        this.reportError({
          type: 'network',
          message: `Failed to send message: ${error.message}`,
          userMessage: 'Failed to send data to server',
          canRetry: true,
          severity: 'medium'
        });
      }
    }
  }

  // Handle disconnection with reconnection logic
  private handleDisconnection(event: CloseEvent): void {
    let shouldReconnect = true;
    let errorDetails: WebSocketError | null = null;
    
    switch (event.code) {
      case 1000: // Normal closure
        this.updateConnectionState({ connectionStatus: 'Disconnected' });
        shouldReconnect = false;
        break;
        
      case 1008: // Policy violation (auth failure)
        errorDetails = this.createError(
          'authentication',
          'Authentication failed - invalid or expired token',
          'Your session has expired',
          event.code,
          true,
          'medium',
          'Please refresh the page to sign in again'
        );
        shouldReconnect = this.connectionState.reconnectAttempts < this.options.maxReconnectAttempts;
        break;
        
      case 1006: // Abnormal closure (network issue)
        const isFirstFailure = this.connectionState.reconnectAttempts === 0;
        errorDetails = this.createError(
          'network',
          'Connection lost unexpectedly',
          isFirstFailure 
            ? 'Connection temporarily interrupted'
            : `Connection lost (retry ${this.connectionState.reconnectAttempts + 1}/${this.options.maxReconnectAttempts})`,
          event.code,
          false,
          isFirstFailure ? 'low' : 'medium'
        );
        break;
        
      default:
        errorDetails = this.createError(
          'connection',
          event.reason || `Connection closed (code: ${event.code})`,
          event.reason || 'Connection ended unexpectedly',
          event.code,
          false,
          'medium'
        );
    }
    
    if (errorDetails) {
      this.reportError(errorDetails);
    }
    
    // Auto-reconnect if needed
    if (shouldReconnect && this.options.enabled && this.connectionState.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else if (this.connectionState.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.updateConnectionState({ connectionStatus: 'Connection failed' });
      this.reportError(this.createError(
        'connection',
        `Maximum reconnection attempts (${this.options.maxReconnectAttempts}) exceeded`,
        'Unable to restore connection',
        undefined,
        false,
        'high',
        'Please check your internet connection and refresh the page to try again'
      ));
    }
  }

  // Schedule reconnection attempt
  private scheduleReconnect(): void {
    if (this.isReconnecting) return;
    
    this.isReconnecting = true;
    const delay = Math.min(this.options.reconnectDelay * Math.pow(2, this.connectionState.reconnectAttempts), 30000);
    
    this.updateConnectionState({ 
      connectionStatus: `Reconnecting in ${Math.ceil(delay / 1000)}s...`,
      isRetrying: true 
    });
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.options.enabled && !this.ws) {
        this.updateConnectionState({ reconnectAttempts: this.connectionState.reconnectAttempts + 1 });
        this.isReconnecting = false;
        this.connect();
      }
    }, delay);
  }

  // Update connection state and notify listeners
  private updateConnectionState(updates: Partial<WebSocketConnectionState>): void {
    this.connectionState = {
      ...this.connectionState,
      ...updates,
      hasError: updates.error !== undefined ? updates.error !== null : this.connectionState.hasError,
      canRetry: this.connectionState.error?.canRetry || false,
      getUserFriendlyStatus: () => this.getUserFriendlyStatus()
    };
    
    this.onConnectionChange?.(this.connectionState);
  }

  // Create error object
  private createError(
    type: WebSocketError['type'],
    message: string,
    userMessage?: string,
    code?: number,
    isTokenExpired = false,
    severity: WebSocketError['severity'] = 'medium',
    suggestedAction?: string
  ): WebSocketError {
    return {
      type,
      message,
      userMessage: userMessage || message,
      code,
      canRetry: type !== 'authentication' || isTokenExpired,
      isTokenExpired,
      severity,
      suggestedAction
    };
  }

  // Report error
  private reportError(error: WebSocketError): void {
    this.updateConnectionState({ error });
    
    // Log based on severity
    const logMessage = `WebSocket ${error.type}: ${error.message}`;
    switch (error.severity) {
      case 'low':
        console.info(`ℹ️ ${logMessage}`);
        break;
      case 'medium':
        console.warn(`⚠️ ${logMessage}`);
        break;
      case 'high':
        console.error(`❌ ${logMessage}`);
        if (error.suggestedAction) {
          console.error(`   Suggestion: ${error.suggestedAction}`);
        }
        break;
    }
  }

  // Get user-friendly status
  private getUserFriendlyStatus(): string {
    const { error, isConnected, connectionStatus, isRetrying } = this.connectionState;
    
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
    
    if (isConnected) return 'Connected';
    if (connectionStatus.includes('Connecting')) return 'Connecting...';
    if (connectionStatus.includes('Reconnecting')) return connectionStatus;
    
    return connectionStatus;
  }

  // Set event callbacks
  setOnConnectionChange(callback: (state: WebSocketConnectionState) => void): void {
    this.onConnectionChange = callback;
  }

  setOnGlobalMessage(callback: (message: WebSocketMessage) => void): void {
    this.onGlobalMessage = callback;
  }

  // Public method to send messages directly (for entity client)
  public sendDirectMessage(message: any): void {
    this.sendMessage(message);
  }

  // Get current connection state
  getConnectionState(): WebSocketConnectionState {
    return { ...this.connectionState };
  }

  // Cleanup
  disconnect(): void {
    if (this.isCleaningUp) return;
    
    this.isCleaningUp = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      const ws = this.ws;
      this.ws = null;
      
      if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
        try {
          ws.close(1000, 'Manager cleanup');
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
    
    this.subscriptions.clear();
    this.updateConnectionState({ 
      isConnected: false, 
      connectionStatus: 'Disconnected',
      error: null 
    });
    
    setTimeout(() => {
      this.isCleaningUp = false;
    }, 100);
  }
}