// Activity Cache Manager
// Handles intelligent caching, LRU eviction, and cache optimization strategies

import { activityStorage, ActivityStorage } from './activityStorage';

interface CacheConfig {
  maxActivities: number;
  maxAgeMs: number;
  criticalTypes: string[];
  evictionBatchSize: number;
  compressionEnabled: boolean;
}

interface CacheStats {
  totalActivities: number;
  cachedSizeKB: number;
  hitRate: number;
  lastEviction: string | null;
  compressionRatio: number;
}

interface CacheEntry {
  id: string;
  lastAccessed: string;
  accessCount: number;
  size: number;
  priority: number;
}

export class ActivityCacheManager {
  private storage: ActivityStorage;
  private config: CacheConfig;
  private accessLog: Map<string, CacheEntry> = new Map();
  private hitCount = 0;
  private missCount = 0;

  constructor(storage: ActivityStorage) {
    this.storage = storage;
    this.config = {
      maxActivities: 1000,           // Max activities to keep in cache
      maxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
      criticalTypes: ['job', 'system'],   // Never evict these types
      evictionBatchSize: 50,         // Evict in batches for efficiency
      compressionEnabled: true       // Compress large text fields
    };
  }

  async init(): Promise<void> {
    await this.storage.init();
    await this.loadAccessLog();
    await this.performMaintenanceIfNeeded();
    console.log('✅ ActivityCacheManager initialized');
  }

  // Cache Operations
  async cacheActivity(activity: any): Promise<void> {
    // Compress activity if enabled
    const compressedActivity = this.config.compressionEnabled 
      ? this.compressActivity(activity) 
      : activity;

    // Store in IndexedDB
    await this.storage.storeActivity(compressedActivity);

    // Update access log
    this.updateAccessLog(activity.id, {
      lastAccessed: new Date().toISOString(),
      accessCount: 1,
      size: JSON.stringify(activity).length,
      priority: this.calculatePriority(activity)
    });

    // Check if eviction is needed
    await this.evictIfNeeded();
  }

  async getActivity(id: string): Promise<any | null> {
    try {
      const activities = await this.storage.getAllActivities();
      const activity = activities.find(a => a.id === id);

      if (activity) {
        this.hitCount++;
        
        // Update access log
        const existing = this.accessLog.get(id);
        this.updateAccessLog(id, {
          lastAccessed: new Date().toISOString(),
          accessCount: (existing?.accessCount || 0) + 1,
          size: existing?.size || JSON.stringify(activity).length,
          priority: existing?.priority || this.calculatePriority(activity)
        });

        return this.config.compressionEnabled 
          ? this.decompressActivity(activity) 
          : activity;
      } else {
        this.missCount++;
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      this.missCount++;
      return null;
    }
  }

  async getCachedActivities(projectId: string, limit = 50): Promise<any[]> {
    try {
      const activities = await this.storage.getActivities(projectId, limit);
      
      // Update access logs for batch access
      activities.forEach(activity => {
        const existing = this.accessLog.get(activity.id);
        this.updateAccessLog(activity.id, {
          lastAccessed: new Date().toISOString(),
          accessCount: (existing?.accessCount || 0) + 1,
          size: existing?.size || JSON.stringify(activity).length,
          priority: existing?.priority || this.calculatePriority(activity)
        });
      });

      this.hitCount += activities.length;

      return this.config.compressionEnabled 
        ? activities.map(a => this.decompressActivity(a))
        : activities;
    } catch (error) {
      console.error('Cache batch get error:', error);
      this.missCount += limit;
      return [];
    }
  }

  // Cache Management
  private async evictIfNeeded(): Promise<void> {
    const stats = await this.storage.getStorageStats();
    
    if (stats.activities > this.config.maxActivities) {
      console.log(`🗑️ Cache eviction needed: ${stats.activities} > ${this.config.maxActivities}`);
      await this.performLRUEviction();
    }
  }

  private async performLRUEviction(): Promise<void> {
    const activities = await this.storage.getAllActivities();
    
    // Create eviction candidates (exclude critical types)
    const candidates = activities
      .filter(activity => !this.config.criticalTypes.includes(activity.type))
      .filter(activity => activity.metadata?.synced === true) // Only evict synced activities
      .map(activity => ({
        ...activity,
        score: this.calculateEvictionScore(activity.id)
      }))
      .sort((a, b) => a.score - b.score); // Lower score = evict first

    // Evict in batches
    const toEvict = candidates.slice(0, this.config.evictionBatchSize);
    
    for (const activity of toEvict) {
      await this.storage.deleteActivity(activity.id);
      this.accessLog.delete(activity.id);
    }

    // Update metadata
    await this.storage.setSyncMetadata('lastEviction', new Date().toISOString());
    
    console.log(`🧹 Evicted ${toEvict.length} activities from cache`);
  }

  private calculateEvictionScore(activityId: string): number {
    const entry = this.accessLog.get(activityId);
    if (!entry) return 0;

    const now = Date.now();
    const lastAccessed = new Date(entry.lastAccessed).getTime();
    const ageMs = now - lastAccessed;
    
    // Score based on: age (higher = more likely to evict), access frequency (lower = more likely), priority (lower = more likely)
    const ageScore = ageMs / (1000 * 60 * 60); // Age in hours
    const frequencyScore = 1 / Math.max(entry.accessCount, 1); // Inverse frequency
    const priorityScore = 1 / Math.max(entry.priority, 1); // Inverse priority
    
    return ageScore + frequencyScore + priorityScore;
  }

  private calculatePriority(activity: any): number {
    let priority = 1;

    // Critical types get higher priority
    if (this.config.criticalTypes.includes(activity.type)) {
      priority += 10;
    }

    // Recent activities get higher priority
    const ageMs = Date.now() - new Date(activity.timestamp).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    if (ageHours < 24) priority += 5;
    if (ageHours < 1) priority += 5;

    // Failed/error activities get higher priority (for debugging)
    if (activity.status === 'FAILED' || activity.level === 'error') {
      priority += 3;
    }

    // Unsynced activities get highest priority
    if (!activity.metadata?.synced) {
      priority += 20;
    }

    return priority;
  }

  // Compression
  private compressActivity(activity: any): any {
    const compressed = { ...activity };

    // Compress large text fields
    if (compressed.description && compressed.description.length > 200) {
      compressed.description = this.compressText(compressed.description);
      compressed.metadata = {
        ...compressed.metadata,
        descriptionCompressed: true
      };
    }

    if (compressed.metadata?.output && compressed.metadata.output.length > 500) {
      compressed.metadata.output = this.compressText(compressed.metadata.output);
      compressed.metadata.outputCompressed = true;
    }

    return compressed;
  }

  private decompressActivity(activity: any): any {
    const decompressed = { ...activity };

    // Decompress text fields
    if (decompressed.metadata?.descriptionCompressed) {
      decompressed.description = this.decompressText(decompressed.description);
      delete decompressed.metadata.descriptionCompressed;
    }

    if (decompressed.metadata?.outputCompressed) {
      decompressed.metadata.output = this.decompressText(decompressed.metadata.output);
      delete decompressed.metadata.outputCompressed;
    }

    return decompressed;
  }

  private compressText(text: string): string {
    // Simple compression - replace common patterns
    return text
      .replace(/Setting up project structure and dependencies/g, 'SETUP_MSG')
      .replace(/AI-powered code generation and modification/g, 'AI_MSG')
      .replace(/Running tests and validation checks/g, 'TEST_MSG')
      .replace(/Manual code editing and file modifications/g, 'EDIT_MSG');
  }

  private decompressText(text: string): string {
    // Reverse compression
    return text
      .replace(/SETUP_MSG/g, 'Setting up project structure and dependencies')
      .replace(/AI_MSG/g, 'AI-powered code generation and modification')
      .replace(/TEST_MSG/g, 'Running tests and validation checks')
      .replace(/EDIT_MSG/g, 'Manual code editing and file modifications');
  }

  // Access Log Management
  private updateAccessLog(id: string, entry: Partial<CacheEntry>): void {
    const existing = this.accessLog.get(id) || {
      id,
      lastAccessed: new Date().toISOString(),
      accessCount: 0,
      size: 0,
      priority: 1
    };

    this.accessLog.set(id, { ...existing, ...entry });
  }

  private async loadAccessLog(): Promise<void> {
    try {
      const logData = await this.storage.getSyncMetadata('accessLog');
      if (logData && typeof logData === 'string') {
        const parsed = JSON.parse(logData);
        this.accessLog = new Map(parsed);
      }
    } catch (error) {
      console.warn('Could not load access log, starting fresh');
    }
  }

  private async saveAccessLog(): Promise<void> {
    try {
      const logData = JSON.stringify(Array.from(this.accessLog.entries()));
      await this.storage.setSyncMetadata('accessLog', logData);
    } catch (error) {
      console.error('Could not save access log:', error);
    }
  }

  // Maintenance
  private async performMaintenanceIfNeeded(): Promise<void> {
    const lastMaintenance = await this.storage.getSyncMetadata('lastMaintenance');
    const now = Date.now();
    const maintenanceInterval = 24 * 60 * 60 * 1000; // 24 hours

    if (!lastMaintenance || 
        (typeof lastMaintenance === 'string' && 
         now - new Date(lastMaintenance).getTime() > maintenanceInterval)) {
      
      console.log('🔧 Performing cache maintenance...');
      
      // Clean up old activities
      await this.storage.cleanupOldActivities(this.config.maxAgeMs);
      
      // Save access log
      await this.saveAccessLog();
      
      // Update maintenance timestamp
      await this.storage.setSyncMetadata('lastMaintenance', new Date().toISOString());
      
      console.log('✅ Cache maintenance completed');
    }
  }

  // Statistics
  async getCacheStats(): Promise<CacheStats> {
    const storageStats = await this.storage.getStorageStats();
    const lastEviction = await this.storage.getSyncMetadata('lastEviction');

    const hitRate = this.hitCount + this.missCount > 0 
      ? this.hitCount / (this.hitCount + this.missCount) 
      : 0;

    return {
      totalActivities: storageStats.activities,
      cachedSizeKB: storageStats.estimatedSizeKB,
      hitRate: Math.round(hitRate * 100) / 100,
      lastEviction: typeof lastEviction === 'string' ? lastEviction : null,
      compressionRatio: 0.8 // Estimated compression ratio
    };
  }

  // Configuration
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('📝 Cache config updated:', this.config);
  }

  // Cleanup
  async clearCache(): Promise<void> {
    const activities = await this.storage.getAllActivities();
    for (const activity of activities) {
      await this.storage.deleteActivity(activity.id);
    }
    
    this.accessLog.clear();
    this.hitCount = 0;
    this.missCount = 0;
    
    console.log('🗑️ Cache cleared completely');
  }

  async close(): Promise<void> {
    await this.saveAccessLog();
    await this.storage.close();
    console.log('📦 ActivityCacheManager closed');
  }
}

// Create singleton instance
export const activityCacheManager = new ActivityCacheManager(activityStorage);