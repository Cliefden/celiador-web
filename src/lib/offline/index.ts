// Offline Activity System
// Main entry point for all offline functionality

import { useState, useEffect } from 'react';
import { offlineActivityManager, type OfflineStats } from './offlineActivityManager';
import { serviceWorkerManager } from './serviceWorkerManager';

export { activityStorage } from './activityStorage';
export { activityCacheManager } from './activityCacheManager';
export { pendingActionsQueue } from './pendingActionsQueue';
export { optimisticUpdatesManager } from './optimisticUpdates';
export { offlineActivityManager } from './offlineActivityManager';
export { serviceWorkerManager } from './serviceWorkerManager';

// Re-export types for convenience
export type {
  ActivityItem,
  PendingAction,
  SyncMetadata
} from './activityStorage';

export type {
  CacheConfig,
  CacheStats,
  CacheEntry
} from './activityCacheManager';

export type {
  ActionResult,
  QueueStats
} from './pendingActionsQueue';

export type {
  OptimisticOperation,
  OptimisticResult
} from './optimisticUpdates';

export type {
  ConflictItem,
  SyncResult,
  OfflineStats
} from './offlineActivityManager';

// Main initialization function
export async function initializeOfflineSystem(): Promise<boolean> {
  try {
    console.log('🚀 Initializing offline activity system...');

    // DISABLED: Service Worker was caching message API responses causing stale data
    // Initialize Service Worker first
    console.log('🚫 Service Worker initialization DISABLED - was causing message caching issues');
    
    // Unregister any existing service workers and clear caches
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          console.log('🗑️ Unregistering existing Service Worker...');
          await registration.unregister();
        }
        
        // Clear all caches
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          console.log('🗑️ Clearing cache:', cacheName);
          await caches.delete(cacheName);
        }
        
        console.log('✅ All Service Workers unregistered and caches cleared');
      } catch (error) {
        console.error('❌ Failed to unregister Service Workers:', error);
      }
    }
    
    // const swSupported = await serviceWorkerManager.init();
    // if (swSupported) {
    //   console.log('✅ Service Worker initialized');
    // }

    // Initialize the main offline manager (this initializes all subsystems)
    await offlineActivityManager.init();

    console.log('✅ Offline activity system fully initialized');
    return true;

  } catch (error) {
    console.error('❌ Failed to initialize offline system:', error);
    return false;
  }
}

// Convenience hooks for React components

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator?.onLine ?? true);
  const [stats, setStats] = useState<OfflineStats | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    
    const initializeAndUpdateStats = async () => {
      try {
        console.log('🚀 Initializing offline system from useOfflineStatus...');
        const success = await initializeOfflineSystem();
        if (success) {
          setInitialized(true);
          console.log('✅ Offline system initialized successfully');
          
          // Get initial stats after successful initialization
          try {
            const newStats = await offlineActivityManager.getOfflineStats();
            setStats(newStats);
          } catch (error) {
            console.error('Failed to get initial offline stats:', error);
          }
        } else {
          console.warn('⚠️ Offline system initialization failed');
        }
      } catch (error) {
        console.error('Failed to initialize offline system:', error);
      }
    };

    const updateStats = async () => {
      if (!initialized) return;
      
      try {
        const newStats = await offlineActivityManager.getOfflineStats();
        setStats(newStats);
      } catch (error) {
        console.error('Failed to get offline stats:', error);
      }
    };

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initialize offline system
    if (!initialized) {
      const initialDelay = setTimeout(initializeAndUpdateStats, 500);
      
      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
        clearTimeout(initialDelay);
      };
    } else {
      // Set up periodic stats updates after initialization
      const statsInterval = setInterval(updateStats, 10000); // Every 10 seconds
      
      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
        clearInterval(statsInterval);
      };
    }
  }, [initialized]);

  return { isOnline, stats };
}

// Usage example for Activity Feed component
/*
Example integration with existing ActivityFeed:

import { offlineActivityManager, useOfflineStatus } from '../lib/offline';

export function EnhancedActivityFeed({ projectId }: { projectId: string }) {
  const { isOnline, stats } = useOfflineStatus();
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    async function loadActivities() {
      // This automatically handles offline/online and caching
      const activities = await offlineActivityManager.getActivities(projectId);
      setActivities(activities);
    }
    
    loadActivities();
  }, [projectId]);

  const handleCreateJob = async (jobData) => {
    try {
      // This automatically handles optimistic updates and offline queueing
      const result = await offlineActivityManager.createJob(
        jobData, 
        projectId, 
        userId
      );
      
      // Activity will appear immediately in UI via optimistic update
      console.log('Job created:', result);
      
    } catch (error) {
      console.error('Failed to create job:', error);
    }
  };

  return (
    <div>
      <div className="offline-status">
        {isOnline ? '🌐 Online' : '📴 Offline'}
        {stats && (
          <span>
            ({stats.cachedActivities} cached, {stats.pendingActions} pending)
          </span>
        )}
      </div>
      
      <ActivityList activities={activities} />
      
      <button onClick={() => handleCreateJob({ type: 'SCAFFOLD', prompt: 'Test' })}>
        Create Job (Works Offline!)
      </button>
    </div>
  );
}
*/