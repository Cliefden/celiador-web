// Pending Actions Queue
// Manages offline actions that need to be synced when connectivity is restored

import { activityStorage } from './activityStorage';

interface PendingAction {
  id: string;
  type: 'create_job' | 'update_project' | 'send_message' | 'delete_job' | 'update_job';
  payload: any;
  timestamp: string;
  retryCount: number;
  lastRetry?: string;
  error?: string;
  projectId: string;
  userId: string;
  priority: number;
  maxRetries: number;
}

interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  shouldRetry: boolean;
}

interface QueueStats {
  totalPending: number;
  byType: { [key: string]: number };
  oldestAction: string | null;
  failedActions: number;
  avgRetryCount: number;
}

export class PendingActionsQueue {
  private processingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private baseRetryDelay = 1000; // 1 second
  private maxRetryDelay = 60000; // 1 minute

  async init(): Promise<void> {
    // Start processing queue when online
    this.startProcessing();
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('🌐 Came online - resuming queue processing');
        this.startProcessing();
      });
      
      window.addEventListener('offline', () => {
        console.log('📴 Went offline - pausing queue processing');
        this.stopProcessing();
      });
    }

    console.log('✅ PendingActionsQueue initialized');
  }

  // Queue Management
  async addAction(
    type: PendingAction['type'],
    payload: any,
    projectId: string,
    userId: string,
    priority = 5
  ): Promise<string> {
    const actionId = await activityStorage.addPendingAction({
      type,
      payload,
      projectId,
      userId,
      priority,
      maxRetries: this.getMaxRetriesForAction(type)
    });

    console.log(`📝 Added pending action ${type} to queue: ${actionId}`);
    
    // Try to process immediately if online
    if (navigator.onLine) {
      setTimeout(() => this.processQueue(), 100);
    }

    return actionId;
  }

  async removeAction(actionId: string): Promise<void> {
    await activityStorage.deletePendingAction(actionId);
    console.log(`🗑️ Removed pending action: ${actionId}`);
  }

  async updateAction(actionId: string, updates: Partial<PendingAction>): Promise<void> {
    await activityStorage.updatePendingAction(actionId, updates);
  }

  // Processing
  private startProcessing(): void {
    if (this.processingInterval) return;

    this.processingInterval = setInterval(() => {
      if (navigator.onLine && !this.isProcessing) {
        this.processQueue();
      }
    }, 5000); // Check every 5 seconds
  }

  private stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) return;

    this.isProcessing = true;

    try {
      const actions = await activityStorage.getPendingActions();
      
      // Only log if there are actions to process
      if (actions.length > 0) {
        console.log(`🔄 Processing ${actions.length} pending actions...`);
      }
      
      // Sort by priority (higher first), then by timestamp (older first)
      const sortedActions = actions.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });

      let processedCount = 0;
      let successCount = 0;

      for (const action of sortedActions) {
        if (!navigator.onLine) {
          console.log('📴 Lost connection during queue processing');
          break;
        }

        try {
          const result = await this.processAction(action);
          
          if (result.success) {
            await this.removeAction(action.id);
            successCount++;
            console.log(`✅ Successfully processed action: ${action.type}`);
          } else if (result.shouldRetry && action.retryCount < action.maxRetries) {
            await this.scheduleRetry(action, result.error);
          } else {
            console.error(`❌ Action failed permanently: ${action.type}`, result.error);
            await this.markActionAsFailed(action, result.error || 'Max retries exceeded');
          }
          
          processedCount++;
          
          // Small delay between actions to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`💥 Error processing action ${action.id}:`, error);
          await this.scheduleRetry(action, error instanceof Error ? error.message : 'Unknown error');
        }
      }

      // Only log completion if there were actions to process
      if (processedCount > 0) {
        console.log(`📊 Queue processing complete: ${successCount}/${processedCount} successful`);
      }
      
    } catch (error) {
      console.error('💥 Error during queue processing:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processAction(action: PendingAction): Promise<ActionResult> {
    const baseUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
    
    try {
      let response: Response;
      
      switch (action.type) {
        case 'create_job':
          response = await fetch(`${baseUrl}/projects/${action.projectId}/jobs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await this.getCurrentToken()}`
            },
            body: JSON.stringify(action.payload)
          });
          break;

        case 'update_job':
          response = await fetch(`${baseUrl}/jobs/${action.payload.jobId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await this.getCurrentToken()}`
            },
            body: JSON.stringify(action.payload)
          });
          break;

        case 'delete_job':
          response = await fetch(`${baseUrl}/jobs/${action.payload.jobId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${await this.getCurrentToken()}`
            }
          });
          break;

        case 'send_message':
          response = await fetch(`${baseUrl}/conversations/${action.payload.conversationId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await this.getCurrentToken()}`
            },
            body: JSON.stringify(action.payload)
          });
          break;

        case 'update_project':
          response = await fetch(`${baseUrl}/projects/${action.projectId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await this.getCurrentToken()}`
            },
            body: JSON.stringify(action.payload)
          });
          break;

        default:
          return {
            success: false,
            error: `Unknown action type: ${action.type}`,
            shouldRetry: false
          };
      }

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data,
          shouldRetry: false
        };
      } else {
        const errorText = await response.text();
        const shouldRetry = response.status >= 500 || response.status === 429; // Server errors or rate limits
        
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          shouldRetry
        };
      }
      
    } catch (error) {
      // Network errors are usually retryable
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        shouldRetry: true
      };
    }
  }

  private async scheduleRetry(action: PendingAction, errorMessage?: string): Promise<void> {
    const newRetryCount = action.retryCount + 1;
    const delay = Math.min(
      this.baseRetryDelay * Math.pow(2, newRetryCount), // Exponential backoff
      this.maxRetryDelay
    );

    console.log(`🔄 Scheduling retry ${newRetryCount}/${action.maxRetries} for action ${action.id} in ${delay}ms`);

    await this.updateAction(action.id, {
      retryCount: newRetryCount,
      lastRetry: new Date().toISOString(),
      error: errorMessage
    });

    // Schedule the retry
    setTimeout(() => {
      if (navigator.onLine) {
        this.processQueue();
      }
    }, delay);
  }

  private async markActionAsFailed(action: PendingAction, errorMessage: string): Promise<void> {
    console.error(`❌ Action ${action.id} failed permanently:`, errorMessage);
    
    // Update action with failure information
    await this.updateAction(action.id, {
      error: `FAILED: ${errorMessage}`,
      retryCount: action.maxRetries + 1 // Mark as exceeded
    });

    // Could emit an event here for UI notification
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pendingActionFailed', {
        detail: { action, error: errorMessage }
      }));
    }
  }

  private getMaxRetriesForAction(type: PendingAction['type']): number {
    // Different action types get different retry limits
    switch (type) {
      case 'create_job':
      case 'send_message':
        return 5; // Critical actions get more retries
      case 'update_project':
      case 'update_job':
        return 3; // Updates are less critical
      case 'delete_job':
        return 2; // Deletes are least critical
      default:
        return 3;
    }
  }

  private async getCurrentToken(): Promise<string> {
    // This should get the current auth token
    // For now, return empty string - would need to integrate with auth system
    return '';
  }

  // Statistics and Monitoring
  async getQueueStats(): Promise<QueueStats> {
    const actions = await activityStorage.getPendingActions();
    
    const byType: { [key: string]: number } = {};
    let totalRetries = 0;
    let failedActions = 0;
    let oldestTimestamp: string | null = null;

    for (const action of actions) {
      byType[action.type] = (byType[action.type] || 0) + 1;
      totalRetries += action.retryCount;
      
      if (action.retryCount >= action.maxRetries) {
        failedActions++;
      }
      
      if (!oldestTimestamp || action.timestamp < oldestTimestamp) {
        oldestTimestamp = action.timestamp;
      }
    }

    return {
      totalPending: actions.length,
      byType,
      oldestAction: oldestTimestamp,
      failedActions,
      avgRetryCount: actions.length > 0 ? totalRetries / actions.length : 0
    };
  }

  async clearFailedActions(): Promise<number> {
    const actions = await activityStorage.getPendingActions();
    const failedActions = actions.filter(a => a.retryCount >= a.maxRetries);
    
    for (const action of failedActions) {
      await this.removeAction(action.id);
    }

    console.log(`🧹 Cleared ${failedActions.length} failed actions`);
    return failedActions.length;
  }

  async retryAllActions(): Promise<void> {
    const actions = await activityStorage.getPendingActions();
    
    for (const action of actions) {
      await this.updateAction(action.id, {
        retryCount: 0,
        error: undefined,
        lastRetry: undefined
      });
    }

    console.log(`🔄 Reset retry count for ${actions.length} actions`);
    
    // Process immediately
    if (navigator.onLine) {
      setTimeout(() => this.processQueue(), 100);
    }
  }

  // Cleanup
  async stop(): Promise<void> {
    this.stopProcessing();
    this.isProcessing = false;
    console.log('🛑 PendingActionsQueue stopped');
  }
}

// Create singleton instance
export const pendingActionsQueue = new PendingActionsQueue();