'use client';

import React from 'react';
import { 
  Cloud, 
  CloudOff, 
  Database, 
  AlertTriangle, 
  Wifi,
  WifiOff,
  Loader2,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useOfflineStatus } from '../../lib/offline';

interface OfflineStatusIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showStats?: boolean;
  className?: string;
}

export function OfflineStatusIndicator({ 
  size = 'sm', 
  showText = false, 
  showStats = false,
  className = '' 
}: OfflineStatusIndicatorProps) {
  const { isOnline, stats } = useOfflineStatus();

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };

  const iconSize = sizeClasses[size];
  
  if (!stats) {
    // Offline system not ready
    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <Database className={`${iconSize} text-gray-500`} title="Offline system initializing..." />
        {showText && <span className="text-xs text-gray-400">Initializing...</span>}
      </div>
    );
  }

  const getStatusInfo = () => {
    if (isOnline) {
      if (stats.pendingActions > 0) {
        return {
          icon: <Loader2 className={`${iconSize} text-blue-400 animate-spin`} />,
          text: 'Syncing...',
          color: 'text-blue-400',
          title: `Online - syncing ${stats.pendingActions} pending actions`
        };
      } else {
        return {
          icon: <Cloud className={`${iconSize} text-green-400`} />,
          text: 'Online',
          color: 'text-green-400',
          title: 'Online with offline capability'
        };
      }
    } else {
      if (stats.pendingActions > 0) {
        return {
          icon: <Clock className={`${iconSize} text-orange-400`} />,
          text: 'Offline (pending)',
          color: 'text-orange-400',
          title: `Offline - ${stats.pendingActions} actions queued for sync`
        };
      } else {
        return {
          icon: <CloudOff className={`${iconSize} text-orange-400`} />,
          text: 'Offline',
          color: 'text-orange-400',
          title: 'Offline mode active'
        };
      }
    }
  };

  const status = getStatusInfo();

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div title={status.title}>
        {status.icon}
      </div>
      
      {showText && (
        <span className={`text-xs ${status.color}`}>
          {status.text}
        </span>
      )}
      
      {showStats && stats && (
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-400" title={`${stats.cachedActivities} cached activities`}>
            📄{stats.cachedActivities}
          </span>
          {stats.pendingActions > 0 && (
            <span className="text-xs text-orange-400" title={`${stats.pendingActions} pending actions`}>
              ⏳{stats.pendingActions}
            </span>
          )}
          {stats.optimisticOperations > 0 && (
            <span className="text-xs text-purple-400" title={`${stats.optimisticOperations} optimistic operations`}>
              ⚡{stats.optimisticOperations}
            </span>
          )}
          {stats.unresolvedConflicts > 0 && (
            <span className="text-xs text-red-400" title={`${stats.unresolvedConflicts} unresolved conflicts`}>
              ⚠️{stats.unresolvedConflicts}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface OfflineStatusBannerProps {
  className?: string;
}

export function OfflineStatusBanner({ className = '' }: OfflineStatusBannerProps) {
  const { isOnline, stats } = useOfflineStatus();

  if (!stats || isOnline) {
    return null;
  }

  return (
    <div className={`bg-orange-50 border border-orange-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <CloudOff className="w-4 h-4 text-orange-500" />
        <div className="flex-1">
          <p className="text-sm text-orange-800 font-medium">
            You're currently offline
          </p>
          <p className="text-xs text-orange-700 mt-1">
            Your actions will be saved and synced when you're back online.
            {stats.pendingActions > 0 && ` ${stats.pendingActions} actions are queued for sync.`}
          </p>
        </div>
        {stats.pendingActions > 0 && (
          <div className="flex items-center space-x-1 bg-orange-100 rounded px-2 py-1">
            <Clock className="w-3 h-3 text-orange-600" />
            <span className="text-xs text-orange-800 font-medium">
              {stats.pendingActions} queued
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface ConnectionStatusProps {
  isConnected: boolean;
  isRetrying: boolean;
  hasError: boolean;
  errorSeverity?: 'low' | 'medium' | 'high';
  getUserFriendlyStatus: () => string;
  className?: string;
}

export function ConnectionStatus({ 
  isConnected, 
  isRetrying, 
  hasError, 
  errorSeverity,
  getUserFriendlyStatus,
  className = ''
}: ConnectionStatusProps) {
  if (isConnected) {
    return (
      <Wifi 
        className={`w-3 h-3 text-green-400 ${className}`}
        title={`Real-time: ${getUserFriendlyStatus()}`} 
      />
    );
  }

  if (isRetrying) {
    return (
      <Loader2 
        className={`w-3 h-3 text-blue-400 animate-spin ${className}`}
        title={getUserFriendlyStatus()} 
      />
    );
  }

  if (hasError && errorSeverity === 'high') {
    return (
      <AlertTriangle 
        className={`w-3 h-3 text-red-400 ${className}`}
        title={getUserFriendlyStatus()} 
      />
    );
  }

  if (hasError && errorSeverity === 'medium') {
    return (
      <AlertTriangle 
        className={`w-3 h-3 text-yellow-400 ${className}`}
        title={getUserFriendlyStatus()} 
      />
    );
  }

  return (
    <WifiOff 
      className={`w-3 h-3 text-gray-500 ${className}`}
      title={getUserFriendlyStatus()} 
    />
  );
}