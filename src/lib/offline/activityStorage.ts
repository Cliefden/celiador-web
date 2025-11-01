// Offline storage layer for activities using IndexedDB
// Provides persistent storage, sync management, and conflict resolution

interface ActivityItem {
  id: string;
  type: 'job' | 'conversation' | 'file' | 'system' | 'user_activity' | 'message' | 'deployment';
  title: string;
  description: string;
  status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  timestamp: string;
  level?: 'info' | 'warning' | 'error' | 'success';
  metadata?: {
    jobId?: string;
    conversationId?: string;
    messageId?: string;
    filePath?: string;
    jobType?: string;
    output?: string;
    error?: string;
    jobMetadata?: any;
    userId?: string;
    activityType?: string;
    messageContent?: string;
    messageRole?: string;
    messageType?: string;
    relatedJobId?: string;
    projectId?: string;
    deploymentId?: string;
    deploymentUrl?: string;
    // Offline-specific metadata
    synced?: boolean;
    optimistic?: boolean;
    conflicted?: boolean;
    lastModified?: string;
  };
}

interface PendingAction {
  id: string;
  type: 'create_job' | 'update_project' | 'send_message' | 'delete_job';
  payload: any;
  timestamp: string;
  retryCount: number;
  lastRetry?: string;
  error?: string;
  projectId: string;
  userId: string;
}

interface SyncMetadata {
  key: string;
  value: string | number | boolean;
  timestamp: string;
}

export class ActivityStorage {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'ActivityStorage';
  private readonly dbVersion = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('❌ Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Activities store
        if (!db.objectStoreNames.contains('activities')) {
          const activitiesStore = db.createObjectStore('activities', { keyPath: 'id' });
          activitiesStore.createIndex('timestamp', 'timestamp', { unique: false });
          activitiesStore.createIndex('type', 'type', { unique: false });
          activitiesStore.createIndex('projectId', 'metadata.projectId', { unique: false });
          activitiesStore.createIndex('synced', 'metadata.synced', { unique: false });
        }

        // Pending actions store
        if (!db.objectStoreNames.contains('pendingActions')) {
          const actionsStore = db.createObjectStore('pendingActions', { keyPath: 'id' });
          actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
          actionsStore.createIndex('type', 'type', { unique: false });
          actionsStore.createIndex('projectId', 'projectId', { unique: false });
          actionsStore.createIndex('retryCount', 'retryCount', { unique: false });
        }

        // Sync metadata store
        if (!db.objectStoreNames.contains('syncMetadata')) {
          db.createObjectStore('syncMetadata', { keyPath: 'key' });
        }

        console.log('🔄 IndexedDB schema upgraded');
      };
    });
  }

  // Activity Management
  async storeActivity(activity: ActivityItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['activities'], 'readwrite');
      const store = transaction.objectStore('activities');

      // Add offline metadata
      const activityWithMeta = {
        ...activity,
        metadata: {
          ...activity.metadata,
          synced: activity.metadata?.synced ?? false,
          optimistic: activity.metadata?.optimistic ?? false,
          lastModified: new Date().toISOString()
        }
      };

      const request = store.put(activityWithMeta);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getActivities(projectId: string, limit = 50): Promise<ActivityItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['activities'], 'readonly');
      const store = transaction.objectStore('activities');
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onsuccess = () => {
        const activities = request.result
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
        resolve(activities);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getAllActivities(limit = 200): Promise<ActivityItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['activities'], 'readonly');
      const store = transaction.objectStore('activities');
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onsuccess = () => {
        const activities = request.result
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
        resolve(activities);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async updateActivity(id: string, updates: Partial<ActivityItem>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['activities'], 'readwrite');
      const store = transaction.objectStore('activities');
      
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const activity = getRequest.result;
        if (!activity) {
          reject(new Error('Activity not found'));
          return;
        }

        const updatedActivity = {
          ...activity,
          ...updates,
          metadata: {
            ...activity.metadata,
            ...updates.metadata,
            lastModified: new Date().toISOString()
          }
        };

        const putRequest = store.put(updatedActivity);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteActivity(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['activities'], 'readwrite');
      const store = transaction.objectStore('activities');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Pending Actions Management
  async addPendingAction(action: Omit<PendingAction, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const actionWithMeta: PendingAction = {
      ...action,
      id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingActions'], 'readwrite');
      const store = transaction.objectStore('pendingActions');
      const request = store.put(actionWithMeta);

      request.onsuccess = () => resolve(actionWithMeta.id);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingActions(projectId?: string): Promise<PendingAction[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingActions'], 'readonly');
      const store = transaction.objectStore('pendingActions');

      let request: IDBRequest;
      if (projectId) {
        const index = store.index('projectId');
        request = index.getAll(projectId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const actions = request.result.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        resolve(actions);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async updatePendingAction(id: string, updates: Partial<PendingAction>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingActions'], 'readwrite');
      const store = transaction.objectStore('pendingActions');
      
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const action = getRequest.result;
        if (!action) {
          reject(new Error('Pending action not found'));
          return;
        }

        const updatedAction = {
          ...action,
          ...updates,
          lastRetry: new Date().toISOString()
        };

        const putRequest = store.put(updatedAction);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deletePendingAction(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingActions'], 'readwrite');
      const store = transaction.objectStore('pendingActions');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync Metadata Management
  async setSyncMetadata(key: string, value: string | number | boolean): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const metadata: SyncMetadata = {
      key,
      value,
      timestamp: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncMetadata'], 'readwrite');
      const store = transaction.objectStore('syncMetadata');
      const request = store.put(metadata);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncMetadata(key: string): Promise<string | number | boolean | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncMetadata'], 'readonly');
      const store = transaction.objectStore('syncMetadata');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Cache Management
  async cleanupOldActivities(maxAge = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const cutoffDate = new Date(Date.now() - maxAge).toISOString();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['activities'], 'readwrite');
      const store = transaction.objectStore('activities');
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(cutoffDate);
      const request = index.openCursor(range);

      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          // Keep important activities even if old
          const activity = cursor.value as ActivityItem;
          if (!activity.metadata?.synced || activity.type === 'system') {
            cursor.continue();
            return;
          }

          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          console.log(`🧹 Cleaned up ${deletedCount} old activities`);
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getStorageStats(): Promise<{
    activities: number;
    pendingActions: number;
    estimatedSizeKB: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const activities = await this.getAllActivities(1000);
    const pendingActions = await this.getPendingActions();

    // Rough size estimation
    const activitiesSize = JSON.stringify(activities).length;
    const actionsSize = JSON.stringify(pendingActions).length;
    const estimatedSizeKB = Math.round((activitiesSize + actionsSize) / 1024);

    return {
      activities: activities.length,
      pendingActions: pendingActions.length,
      estimatedSizeKB
    };
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('📦 IndexedDB connection closed');
    }
  }
}

// Singleton instance
export const activityStorage = new ActivityStorage();