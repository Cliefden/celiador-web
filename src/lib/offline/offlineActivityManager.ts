// Offline Activity Manager
// Main orchestrator for offline functionality, conflict resolution, and sync

import { activityStorage } from './activityStorage';
import { activityCacheManager } from './activityCacheManager';
import { pendingActionsQueue } from './pendingActionsQueue';
import { optimisticUpdatesManager } from './optimisticUpdates';

interface ConflictItem {
  id: string;
  type: 'activity_mismatch' | 'version_conflict' | 'data_inconsistency';
  localData: any;
  serverData: any;
  timestamp: string;
  resolved: boolean;
  resolution?: 'local_wins' | 'server_wins' | 'merge' | 'manual';
}

interface SyncResult {
  success: boolean;
  activitiesSynced: number;
  actionsSynced: number;
  conflictsFound: number;
  errors: string[];
}

interface OfflineStats {
  isOnline: boolean;
  cachedActivities: number;
  pendingActions: number;
  optimisticOperations: number;
  unresolvedConflicts: number;
  lastSyncTime: string | null;
  storageUsageKB: number;
}

export class OfflineActivityManager {
  private isInitialized = false;
  private syncInProgress = false;
  private conflicts: ConflictItem[] = [];
  private lastSyncTime: string | null = null;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize all subsystems
      await activityStorage.init();
      await activityCacheManager.init();
      await pendingActionsQueue.init();
      await optimisticUpdatesManager.init();

      // Load stored conflicts
      await this.loadConflicts();

      // Load last sync time
      this.lastSyncTime = await activityStorage.getSyncMetadata('lastSyncTime') as string || null;

      // Set up event listeners
      this.setupEventListeners();

      // Perform initial sync if online
      if (navigator.onLine) {
        setTimeout(() => this.performSync(), 1000);
      }

      this.isInitialized = true;
      console.log('✅ OfflineActivityManager initialized');

    } catch (error) {
      console.error('❌ Failed to initialize OfflineActivityManager:', error);
      throw error;
    }
  }

  // Main Activity Methods (Enhanced with Offline Support)
  async createJob(jobData: any, projectId: string, userId: string): Promise<any> {
    if (navigator.onLine) {
      try {
        // Try direct API call first
        const response = await fetch(`${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/projects/${projectId}/jobs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getCurrentToken()}`
          },
          body: JSON.stringify(jobData)
        });

        if (response.ok) {
          const result = await response.json();
          
          // Cache the result
          const activity = this.createActivityFromJob(result, userId);
          await activityCacheManager.cacheActivity(activity);
          
          return result;
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.warn('Direct API call failed, using optimistic update:', error);
        // Fall through to optimistic update
      }
    }

    // Offline or API failed - use optimistic update
    const result = await optimisticUpdatesManager.createJobOptimistically(
      jobData,
      projectId,
      userId
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to create job optimistically');
    }

    return { id: result.tempId, status: 'PENDING', optimistic: true };
  }

  async getActivities(projectId: string, forceRefresh = false): Promise<any[]> {
    try {
      // Always load from cache first for instant UI
      let cachedActivities = await activityCacheManager.getCachedActivities(projectId);
      
      // Filter out optimistically deleted activities
      cachedActivities = cachedActivities.filter(activity => 
        !activity.metadata?.optimisticDelete
      );

      if (!navigator.onLine || !forceRefresh) {
        return cachedActivities;
      }

      // Try to sync with server if online
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/projects/${projectId}/activity?_t=${Date.now()}`,
          {
            headers: {
              'Authorization': `Bearer ${await this.getCurrentToken()}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          const serverActivities = data.activities || data || [];

          // Merge with cached activities and resolve conflicts
          const mergedActivities = await this.mergeActivities(cachedActivities, serverActivities);

          // Update cache
          for (const activity of mergedActivities) {
            await activityCacheManager.cacheActivity(activity);
          }

          // Update sync time
          this.lastSyncTime = new Date().toISOString();
          await activityStorage.setSyncMetadata('lastSyncTime', this.lastSyncTime);

          return mergedActivities;
        }
      } catch (error) {
        console.warn('Failed to sync with server, using cached data:', error);
      }

      return cachedActivities;

    } catch (error) {
      console.error('Failed to get activities:', error);
      return [];
    }
  }

  // Conflict Resolution
  private async mergeActivities(cachedActivities: any[], serverActivities: any[]): Promise<any[]> {
    const merged = new Map<string, any>();
    const newConflicts: ConflictItem[] = [];

    // Add server activities first (they're authoritative)
    for (const serverActivity of serverActivities) {
      merged.set(serverActivity.id, {
        ...serverActivity,
        metadata: {
          ...serverActivity.metadata,
          synced: true
        }
      });
    }

    // Merge cached activities
    for (const cachedActivity of cachedActivities) {
      const serverId = cachedActivity.id;
      const serverActivity = merged.get(serverId);

      if (!serverActivity) {
        // Activity exists locally but not on server
        if (cachedActivity.metadata?.synced) {
          // This is a conflict - activity was deleted on server but exists locally
          newConflicts.push({
            id: `conflict_${Date.now()}_${serverId}`,
            type: 'data_inconsistency',
            localData: cachedActivity,
            serverData: null,
            timestamp: new Date().toISOString(),
            resolved: false
          });
          
          // Keep local version for now
          merged.set(serverId, cachedActivity);
        } else {
          // Unsynced local activity - keep it
          merged.set(serverId, cachedActivity);
        }
      } else {
        // Activity exists in both - check for conflicts
        const conflict = this.detectConflict(cachedActivity, serverActivity);
        if (conflict) {
          newConflicts.push(conflict);
          // Server wins by default
          merged.set(serverId, serverActivity);
        }
      }
    }

    // Store new conflicts
    this.conflicts.push(...newConflicts);
    await this.saveConflicts();

    if (newConflicts.length > 0) {
      console.warn(`⚠️ Found ${newConflicts.length} conflicts during merge`);
    }

    return Array.from(merged.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private detectConflict(localActivity: any, serverActivity: any): ConflictItem | null {
    // Check for timestamp conflicts
    const localTime = new Date(localActivity.metadata?.lastModified || localActivity.timestamp);
    const serverTime = new Date(serverActivity.timestamp);

    // If local is newer but server has different data, it's a conflict
    if (localTime > serverTime && 
        JSON.stringify(localActivity) !== JSON.stringify(serverActivity)) {
      
      return {
        id: `conflict_${Date.now()}_${localActivity.id}`,
        type: 'version_conflict',
        localData: localActivity,
        serverData: serverActivity,
        timestamp: new Date().toISOString(),
        resolved: false
      };
    }

    // Check for status conflicts
    if (localActivity.status !== serverActivity.status) {
      return {
        id: `conflict_${Date.now()}_${localActivity.id}`,
        type: 'activity_mismatch',
        localData: localActivity,
        serverData: serverActivity,
        timestamp: new Date().toISOString(),
        resolved: false
      };
    }

    return null;
  }

  async resolveConflict(conflictId: string, resolution: 'local_wins' | 'server_wins' | 'merge'): Promise<void> {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (!conflict) {
      throw new Error('Conflict not found');
    }

    let resolvedActivity: any;

    switch (resolution) {
      case 'local_wins':
        resolvedActivity = conflict.localData;
        break;
      
      case 'server_wins':
        resolvedActivity = conflict.serverData;
        break;
      
      case 'merge':
        resolvedActivity = this.mergeActivityData(conflict.localData, conflict.serverData);
        break;
    }

    // Update the activity
    await activityCacheManager.cacheActivity(resolvedActivity);

    // Mark conflict as resolved
    conflict.resolved = true;
    conflict.resolution = resolution;

    await this.saveConflicts();

    console.log(`✅ Resolved conflict ${conflictId} with strategy: ${resolution}`);
  }

  private mergeActivityData(localData: any, serverData: any): any {
    return {
      ...serverData, // Server data as base
      metadata: {
        ...serverData.metadata,
        ...localData.metadata, // Keep local metadata
        synced: true,
        mergedAt: new Date().toISOString()
      }
    };
  }

  // Sync Operations
  async performSync(): Promise<SyncResult> {
    if (this.syncInProgress || !navigator.onLine) {
      return {
        success: false,
        activitiesSynced: 0,
        actionsSynced: 0,
        conflictsFound: 0,
        errors: ['Sync already in progress or offline']
      };
    }

    this.syncInProgress = true;
    console.log('🔄 Starting sync operation...');

    const result: SyncResult = {
      success: true,
      activitiesSynced: 0,
      actionsSynced: 0,
      conflictsFound: 0,
      errors: []
    };

    try {
      // Process pending actions first
      await pendingActionsQueue.processQueue();
      const queueStats = await pendingActionsQueue.getQueueStats();
      result.actionsSynced = queueStats.totalPending;

      // Sync activities for all projects (or specific project if provided)
      // This would need project context - simplified for now
      result.activitiesSynced = 0; // Would be set based on actual sync

      // Count current conflicts
      result.conflictsFound = this.conflicts.filter(c => !c.resolved).length;

      this.lastSyncTime = new Date().toISOString();
      await activityStorage.setSyncMetadata('lastSyncTime', this.lastSyncTime);

      console.log(`✅ Sync completed: ${result.actionsSynced} actions, ${result.activitiesSynced} activities`);

    } catch (error) {
      console.error('❌ Sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  // Event Handling
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Online/offline events
    window.addEventListener('online', () => {
      console.log('🌐 Came online - starting sync');
      setTimeout(() => this.performSync(), 500);
    });

    window.addEventListener('offline', () => {
      console.log('📴 Went offline');
    });

    // Visibility change - sync when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        setTimeout(() => this.performSync(), 1000);
      }
    });
  }

  // Utility Methods
  private createActivityFromJob(job: any, userId: string): any {
    return {
      id: job.id,
      type: 'job',
      title: this.getJobTitle(job.type, job.status),
      description: job.prompt || this.getJobTypeDescription(job.type),
      timestamp: job.updatedat || job.createdat,
      status: job.status,
      metadata: {
        jobId: job.id,
        jobType: job.type,
        output: job.output,
        error: job.error,
        jobMetadata: job.metadata,
        userId: userId,
        synced: true
      }
    };
  }

  private getJobTitle(type: string, status: string): string {
    const typeMap: { [key: string]: string } = {
      'SCAFFOLD': 'Project Setup',
      'AI_ACTION': 'AI Code Generation',
      'EDIT': 'Code Modification',
      'TEST': 'Test Execution',
      'DEPLOY': 'Deployment',
      'BUILD': 'Build Process'
    };

    const statusMap: { [key: string]: string } = {
      'PENDING': 'queued',
      'RUNNING': 'in progress',
      'COMPLETED': 'completed',
      'FAILED': 'failed',
      'CANCELLED': 'cancelled'
    };

    const jobType = typeMap[type] || type;
    const jobStatus = statusMap[status] || status.toLowerCase();
    return `${jobType} ${jobStatus}`;
  }

  private getJobTypeDescription(jobType: string): string {
    const descriptions: { [key: string]: string } = {
      'SCAFFOLD': 'Setting up project structure and dependencies',
      'AI_ACTION': 'AI-powered code generation and modification',
      'EDIT': 'Manual code editing and file modifications',
      'TEST': 'Running tests and validation checks',
      'BUILD': 'Compiling and building the project',
      'DEPLOY': 'Deploying to production environment'
    };
    return descriptions[jobType] || jobType;
  }

  private async getCurrentToken(): Promise<string> {
    // This should integrate with your auth system
    return '';
  }

  // Conflict Management
  private async loadConflicts(): Promise<void> {
    try {
      const conflictsData = await activityStorage.getSyncMetadata('conflicts');
      if (conflictsData && typeof conflictsData === 'string') {
        this.conflicts = JSON.parse(conflictsData);
      }
    } catch (error) {
      console.warn('Could not load conflicts:', error);
      this.conflicts = [];
    }
  }

  private async saveConflicts(): Promise<void> {
    try {
      await activityStorage.setSyncMetadata('conflicts', JSON.stringify(this.conflicts));
    } catch (error) {
      console.error('Could not save conflicts:', error);
    }
  }

  // Status and Statistics
  async getOfflineStats(): Promise<OfflineStats> {
    const storageStats = await activityStorage.getStorageStats();
    const queueStats = await pendingActionsQueue.getQueueStats();
    const optimisticOps = optimisticUpdatesManager.getPendingOperations();
    const unresolvedConflicts = this.conflicts.filter(c => !c.resolved);

    return {
      isOnline: navigator.onLine,
      cachedActivities: storageStats.activities,
      pendingActions: queueStats.totalPending,
      optimisticOperations: optimisticOps.length,
      unresolvedConflicts: unresolvedConflicts.length,
      lastSyncTime: this.lastSyncTime,
      storageUsageKB: storageStats.estimatedSizeKB
    };
  }

  getConflicts(): ConflictItem[] {
    return this.conflicts.filter(c => !c.resolved);
  }

  // Cleanup
  async cleanup(): Promise<void> {
    await activityCacheManager.close();
    await pendingActionsQueue.stop();
    await optimisticUpdatesManager.cleanup();
    await activityStorage.close();
    
    this.isInitialized = false;
    console.log('🧹 OfflineActivityManager cleaned up');
  }
}

// Create singleton instance
export const offlineActivityManager = new OfflineActivityManager();