// Optimistic Updates Manager
// Provides immediate user feedback by showing updates before server confirmation

import { activityStorage } from './activityStorage';
import { pendingActionsQueue } from './pendingActionsQueue';

interface OptimisticOperation {
  id: string;
  type: 'create_job' | 'update_job' | 'delete_job' | 'send_message' | 'update_project';
  tempId: string;
  realId?: string;
  payload: any;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed' | 'reverted';
  pendingActionId?: string;
  timeoutId?: NodeJS.Timeout;
}

interface OptimisticResult {
  tempId: string;
  success: boolean;
  error?: string;
}

export class OptimisticUpdatesManager {
  private operations: Map<string, OptimisticOperation> = new Map();
  private operationTimeout = 30000; // 30 seconds before considering failed
  private eventListeners: Map<string, Function[]> = new Map();

  async init(): Promise<void> {
    // Listen for successful sync events
    if (typeof window !== 'undefined') {
      window.addEventListener('pendingActionSuccess', this.handleActionSuccess.bind(this));
      window.addEventListener('pendingActionFailed', this.handleActionFailed.bind(this));
    }

    console.log('✅ OptimisticUpdatesManager initialized');
  }

  // Job Operations
  async createJobOptimistically(
    jobData: any,
    projectId: string,
    userId: string
  ): Promise<OptimisticResult> {
    const tempId = `temp_job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Create optimistic activity immediately
      const optimisticActivity = {
        id: tempId,
        type: 'job' as const,
        title: this.getJobTitle(jobData.type, 'PENDING'),
        description: jobData.prompt || this.getJobTypeDescription(jobData.type),
        status: 'PENDING' as const,
        timestamp: new Date().toISOString(),
        metadata: {
          jobId: tempId,
          jobType: jobData.type,
          optimistic: true,
          synced: false,
          projectId,
          userId
        }
      };

      // Store in cache immediately
      await activityStorage.storeActivity(optimisticActivity);

      // Queue the actual API call
      const pendingActionId = await pendingActionsQueue.addAction(
        'create_job',
        jobData,
        projectId,
        userId,
        10 // High priority for user-initiated actions
      );

      // Track the optimistic operation
      const operation: OptimisticOperation = {
        id: `opt_${tempId}`,
        type: 'create_job',
        tempId,
        payload: jobData,
        timestamp: new Date().toISOString(),
        status: 'pending',
        pendingActionId,
        timeoutId: setTimeout(() => this.handleTimeout(tempId), this.operationTimeout)
      };

      this.operations.set(tempId, operation);

      // Emit event for UI updates
      this.emit('optimisticUpdate', {
        type: 'create_job',
        tempId,
        activity: optimisticActivity
      });

      console.log(`⚡ Created optimistic job: ${tempId}`);

      return { tempId, success: true };

    } catch (error) {
      console.error('Failed to create optimistic job:', error);
      return {
        tempId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async updateJobOptimistically(
    jobId: string,
    updates: any,
    projectId: string
  ): Promise<OptimisticResult> {
    const tempId = `temp_update_${Date.now()}`;
    
    try {
      // Update activity optimistically
      const activities = await activityStorage.getAllActivities();
      const existingActivity = activities.find(a => a.metadata?.jobId === jobId);
      
      if (existingActivity) {
        const updatedActivity = {
          ...existingActivity,
          ...updates,
          metadata: {
            ...existingActivity.metadata,
            optimistic: true,
            lastModified: new Date().toISOString()
          }
        };

        await activityStorage.storeActivity(updatedActivity);

        // Queue the API call
        const pendingActionId = await pendingActionsQueue.addAction(
          'update_job',
          { jobId, ...updates },
          projectId,
          existingActivity.metadata?.userId || '',
          8 // Medium-high priority
        );

        // Track operation
        const operation: OptimisticOperation = {
          id: `opt_${tempId}`,
          type: 'update_job',
          tempId,
          realId: jobId,
          payload: updates,
          timestamp: new Date().toISOString(),
          status: 'pending',
          pendingActionId,
          timeoutId: setTimeout(() => this.handleTimeout(tempId), this.operationTimeout)
        };

        this.operations.set(tempId, operation);

        // Emit event
        this.emit('optimisticUpdate', {
          type: 'update_job',
          tempId,
          jobId,
          activity: updatedActivity
        });

        console.log(`⚡ Updated job optimistically: ${jobId}`);
      }

      return { tempId, success: true };

    } catch (error) {
      console.error('Failed to update job optimistically:', error);
      return {
        tempId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deleteJobOptimistically(
    jobId: string,
    projectId: string
  ): Promise<OptimisticResult> {
    const tempId = `temp_delete_${Date.now()}`;
    
    try {
      // Mark activity as deleted optimistically
      const activities = await activityStorage.getAllActivities();
      const existingActivity = activities.find(a => a.metadata?.jobId === jobId);
      
      if (existingActivity) {
        // Don't actually delete, just mark as hidden
        const hiddenActivity = {
          ...existingActivity,
          metadata: {
            ...existingActivity.metadata,
            optimisticDelete: true,
            optimistic: true,
            lastModified: new Date().toISOString()
          }
        };

        await activityStorage.storeActivity(hiddenActivity);

        // Queue the API call
        const pendingActionId = await pendingActionsQueue.addAction(
          'delete_job',
          { jobId },
          projectId,
          existingActivity.metadata?.userId || '',
          6 // Medium priority
        );

        // Track operation
        const operation: OptimisticOperation = {
          id: `opt_${tempId}`,
          type: 'delete_job',
          tempId,
          realId: jobId,
          payload: { jobId },
          timestamp: new Date().toISOString(),
          status: 'pending',
          pendingActionId,
          timeoutId: setTimeout(() => this.handleTimeout(tempId), this.operationTimeout)
        };

        this.operations.set(tempId, operation);

        // Emit event
        this.emit('optimisticUpdate', {
          type: 'delete_job',
          tempId,
          jobId,
          hidden: true
        });

        console.log(`⚡ Deleted job optimistically: ${jobId}`);
      }

      return { tempId, success: true };

    } catch (error) {
      console.error('Failed to delete job optimistically:', error);
      return {
        tempId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Message Operations
  async sendMessageOptimistically(
    messageData: any,
    conversationId: string,
    projectId: string,
    userId: string
  ): Promise<OptimisticResult> {
    const tempId = `temp_message_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Create optimistic message activity
      const optimisticActivity = {
        id: tempId,
        type: 'message' as const,
        title: `👤 New ${messageData.role} message`,
        description: messageData.content ? 
          (messageData.content.length > 100 ? messageData.content.substring(0, 100) + '...' : messageData.content) :
          `${messageData.role} sent a message`,
        timestamp: new Date().toISOString(),
        level: 'info' as const,
        metadata: {
          messageId: tempId,
          conversationId,
          messageContent: messageData.content,
          messageRole: messageData.role,
          projectId,
          userId,
          optimistic: true,
          synced: false
        }
      };

      await activityStorage.storeActivity(optimisticActivity);

      // Queue API call
      const pendingActionId = await pendingActionsQueue.addAction(
        'send_message',
        { ...messageData, conversationId },
        projectId,
        userId,
        9 // High priority for messages
      );

      // Track operation
      const operation: OptimisticOperation = {
        id: `opt_${tempId}`,
        type: 'send_message',
        tempId,
        payload: messageData,
        timestamp: new Date().toISOString(),
        status: 'pending',
        pendingActionId,
        timeoutId: setTimeout(() => this.handleTimeout(tempId), this.operationTimeout)
      };

      this.operations.set(tempId, operation);

      // Emit event
      this.emit('optimisticUpdate', {
        type: 'send_message',
        tempId,
        activity: optimisticActivity
      });

      console.log(`⚡ Sent message optimistically: ${tempId}`);

      return { tempId, success: true };

    } catch (error) {
      console.error('Failed to send message optimistically:', error);
      return {
        tempId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Event Handlers
  private async handleActionSuccess(event: Event): Promise<void> {
    const customEvent = event as CustomEvent;
    const { action, data } = customEvent.detail;

    // Find corresponding optimistic operation
    const operation = Array.from(this.operations.values())
      .find(op => op.pendingActionId === action.id);

    if (operation) {
      console.log(`✅ Confirming optimistic operation: ${operation.tempId}`);
      
      // Clear timeout
      if (operation.timeoutId) {
        clearTimeout(operation.timeoutId);
      }

      // Update operation status
      operation.status = 'confirmed';
      operation.realId = data?.id || operation.realId;

      // Update activity to mark as synced
      if (operation.type !== 'delete_job') {
        await this.confirmOptimisticActivity(operation.tempId, data);
      } else {
        await this.confirmOptimisticDelete(operation.realId!);
      }

      // Emit confirmation event
      this.emit('optimisticConfirmed', {
        tempId: operation.tempId,
        realId: operation.realId,
        type: operation.type,
        data
      });

      // Clean up
      this.operations.delete(operation.tempId);
    }
  }

  private async handleActionFailed(event: Event): Promise<void> {
    const customEvent = event as CustomEvent;
    const { action, error } = customEvent.detail;

    // Find corresponding optimistic operation
    const operation = Array.from(this.operations.values())
      .find(op => op.pendingActionId === action.id);

    if (operation) {
      console.error(`❌ Optimistic operation failed: ${operation.tempId}`, error);
      
      // Clear timeout
      if (operation.timeoutId) {
        clearTimeout(operation.timeoutId);
      }

      // Mark as failed and revert
      operation.status = 'failed';
      await this.revertOptimisticUpdate(operation);

      // Emit failure event
      this.emit('optimisticFailed', {
        tempId: operation.tempId,
        type: operation.type,
        error
      });

      // Clean up
      this.operations.delete(operation.tempId);
    }
  }

  private async handleTimeout(tempId: string): Promise<void> {
    const operation = this.operations.get(tempId);
    if (!operation) return;

    console.warn(`⏰ Optimistic operation timed out: ${tempId}`);
    
    operation.status = 'failed';
    await this.revertOptimisticUpdate(operation);

    // Emit timeout event
    this.emit('optimisticTimeout', {
      tempId,
      type: operation.type
    });

    this.operations.delete(tempId);
  }

  // Helper Methods
  private async confirmOptimisticActivity(tempId: string, serverData?: any): Promise<void> {
    try {
      await activityStorage.updateActivity(tempId, {
        id: serverData?.id || tempId,
        metadata: {
          optimistic: false,
          synced: true,
          confirmedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to confirm optimistic activity:', error);
    }
  }

  private async confirmOptimisticDelete(jobId: string): Promise<void> {
    try {
      // Actually delete the activity now that server confirmed
      const activities = await activityStorage.getAllActivities();
      const activity = activities.find(a => a.metadata?.jobId === jobId);
      
      if (activity) {
        await activityStorage.deleteActivity(activity.id);
      }
    } catch (error) {
      console.error('Failed to confirm optimistic delete:', error);
    }
  }

  private async revertOptimisticUpdate(operation: OptimisticOperation): Promise<void> {
    try {
      if (operation.type === 'create_job' || operation.type === 'send_message') {
        // Remove the optimistic activity
        await activityStorage.deleteActivity(operation.tempId);
      } else if (operation.type === 'update_job') {
        // Revert to previous state (would need to store original)
        await activityStorage.updateActivity(operation.tempId, {
          metadata: {
            optimistic: false,
            revertedAt: new Date().toISOString()
          }
        });
      } else if (operation.type === 'delete_job') {
        // Restore the activity
        await activityStorage.updateActivity(operation.tempId, {
          metadata: {
            optimisticDelete: false,
            optimistic: false,
            revertedAt: new Date().toISOString()
          }
        });
      }

      operation.status = 'reverted';
      console.log(`🔄 Reverted optimistic operation: ${operation.tempId}`);
      
    } catch (error) {
      console.error('Failed to revert optimistic update:', error);
    }
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

  // Event System
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      });
    }
  }

  // Status and Cleanup
  getOperationStatus(tempId: string): OptimisticOperation | null {
    return this.operations.get(tempId) || null;
  }

  getPendingOperations(): OptimisticOperation[] {
    return Array.from(this.operations.values())
      .filter(op => op.status === 'pending');
  }

  async cleanup(): Promise<void> {
    // Clear all timeouts
    this.operations.forEach(op => {
      if (op.timeoutId) {
        clearTimeout(op.timeoutId);
      }
    });

    this.operations.clear();
    this.eventListeners.clear();
    
    console.log('🧹 OptimisticUpdatesManager cleaned up');
  }
}

// Create singleton instance
export const optimisticUpdatesManager = new OptimisticUpdatesManager();