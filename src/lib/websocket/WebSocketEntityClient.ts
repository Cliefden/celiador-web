'use client';

import { WebSocketChannelManager, WebSocketMessage } from './WebSocketChannelManager';

// Entity request/response types (matching backend)
export interface EntityRequest {
  type: 'entity_fetch' | 'entities_fetch' | 'entity_create' | 'entity_update' | 'entity_delete';
  entityType: string;
  entityId?: string;
  data?: any;
  filters?: Record<string, any>;
  requestId: string;
  userId: string;
}

export interface EntityResponse {
  type: 'entity_response' | 'entities_response' | 'entity_error';
  requestId: string;
  entityType: string;
  data?: any;
  error?: string;
  count?: number;
}

// Timeout for entity requests (ms)
const ENTITY_REQUEST_TIMEOUT = 30000;

// WebSocket-based entity client for CRUD operations
export class WebSocketEntityClient {
  private manager: WebSocketChannelManager | null = null;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
    entityType: string;
  }>();

  constructor(manager: WebSocketChannelManager) {
    this.manager = manager;
    this.setupResponseHandling();
  }

  private setupResponseHandling() {
    if (!this.manager) return;

    // Listen for entity responses via global message handler
    this.manager.setOnGlobalMessage((message: WebSocketMessage) => {
      // Handle direct entity responses (not wrapped in channel format)
      if (message.type === 'entity_response' || 
          message.type === 'entities_response' || 
          message.type === 'entity_error') {
        this.handleEntityResponse(message as any);
      }
      // Also handle if they come through as channel messages
      else if (message.data && 
               (message.data.type === 'entity_response' || 
                message.data.type === 'entities_response' || 
                message.data.type === 'entity_error')) {
        this.handleEntityResponse(message.data);
      }
    });
  }

  private handleEntityResponse(response: EntityResponse) {
    const pending = this.pendingRequests.get(response.requestId);
    if (!pending) {
      console.warn('[WebSocketEntityClient] Received response for unknown request:', response.requestId);
      return;
    }

    // Clear timeout and remove from pending
    clearTimeout(pending.timeout);
    this.pendingRequests.delete(response.requestId);

    if (response.type === 'entity_error') {
      pending.reject(new Error(response.error || 'Unknown entity error'));
    } else {
      pending.resolve(response.data);
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendRequest<T>(request: Omit<EntityRequest, 'requestId' | 'userId'>): Promise<T> {
    if (!this.manager || !this.manager.getConnectionState().isConnected) {
      throw new Error('WebSocket not connected');
    }

    const requestId = this.generateRequestId();
    const fullRequest: EntityRequest = {
      ...request,
      requestId,
      userId: 'current_user' // Will be verified by backend from WebSocket auth
    };

    return new Promise<T>((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout for ${request.entityType}`));
      }, ENTITY_REQUEST_TIMEOUT);

      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout,
        entityType: request.entityType
      });

      // Send the request directly to WebSocket (not through channel system)
      try {
        this.manager!.sendDirectMessage(fullRequest);
      } catch (error) {
        clearTimeout(timeout);
        this.pendingRequests.delete(requestId);
        reject(error);
      }
    });
  }

  // Generic entity fetching methods
  async fetchEntity<T>(entityType: string, entityId: string): Promise<T> {
    console.log(`[WebSocketEntityClient] Fetching ${entityType}:${entityId}`);
    return this.sendRequest<T>({
      type: 'entity_fetch',
      entityType,
      entityId
    });
  }

  async fetchEntities<T>(entityType: string, filters?: Record<string, any>): Promise<T[]> {
    console.log(`[WebSocketEntityClient] Fetching ${entityType} with filters:`, filters);
    return this.sendRequest<T[]>({
      type: 'entities_fetch',
      entityType,
      filters
    });
  }

  async createEntity<T>(entityType: string, data: any): Promise<T> {
    console.log(`[WebSocketEntityClient] Creating ${entityType}:`, data);
    return this.sendRequest<T>({
      type: 'entity_create',
      entityType,
      data
    });
  }

  async updateEntity<T>(entityType: string, entityId: string, data: any): Promise<T> {
    console.log(`[WebSocketEntityClient] Updating ${entityType}:${entityId}`, data);
    return this.sendRequest<T>({
      type: 'entity_update',
      entityType,
      entityId,
      data
    });
  }

  async deleteEntity(entityType: string, entityId: string): Promise<void> {
    console.log(`[WebSocketEntityClient] Deleting ${entityType}:${entityId}`);
    await this.sendRequest<{ success: boolean }>({
      type: 'entity_delete',
      entityType,
      entityId
    });
  }

  // Convenience methods for specific entity types
  async fetchJob(jobId: string) {
    return this.fetchEntity('jobs', jobId);
  }

  async fetchJobs(projectId: string) {
    return this.fetchEntities('jobs', { projectId });
  }

  async fetchProject(projectId: string) {
    return this.fetchEntity('projects', projectId);
  }

  async fetchProjects() {
    return this.fetchEntities('projects');
  }

  async fetchConversations(projectId: string) {
    return this.fetchEntities('conversations', { projectId });
  }

  async createProject(projectData: any) {
    return this.createEntity('projects', projectData);
  }

  async updateProject(projectId: string, updates: any) {
    return this.updateEntity('projects', projectId, updates);
  }

  async deleteProject(projectId: string) {
    return this.deleteEntity('projects', projectId);
  }

  async fetchIntegration(integrationId: string) {
    return this.fetchEntity('integrations', integrationId);
  }

  async fetchIntegrations(service?: string) {
    const filters = service ? { service } : undefined;
    return this.fetchEntities('integrations', filters);
  }

  async createIntegration(integrationData: any) {
    return this.createEntity('integrations', integrationData);
  }

  async updateIntegration(integrationId: string, updates: any) {
    return this.updateEntity('integrations', integrationId, updates);
  }

  async deleteIntegration(integrationId: string) {
    return this.deleteEntity('integrations', integrationId);
  }

  async fetchTemplate(templateId: string) {
    return this.fetchEntity('templates', templateId);
  }

  async fetchTemplates(filters?: { difficulty?: string; framework?: string }) {
    return this.fetchEntities('templates', filters);
  }

  async createTemplate(templateData: any) {
    return this.createEntity('templates', templateData);
  }

  async updateTemplate(templateId: string, updates: any) {
    return this.updateEntity('templates', templateId, updates);
  }

  async deleteTemplate(templateId: string) {
    return this.deleteEntity('templates', templateId);
  }

  async fetchDeployment(deploymentId: string) {
    return this.fetchEntity('deployments', deploymentId);
  }

  async fetchDeployments(filters?: { projectId?: string; status?: string; platform?: string }) {
    return this.fetchEntities('deployments', filters);
  }

  async createDeployment(deploymentData: any) {
    return this.createEntity('deployments', deploymentData);
  }

  async updateDeployment(deploymentId: string, updates: any) {
    return this.updateEntity('deployments', deploymentId, updates);
  }

  async deleteDeployment(deploymentId: string) {
    return this.deleteEntity('deployments', deploymentId);
  }

  // Cleanup method
  destroy() {
    // Clear all pending requests
    for (const [requestId, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Client destroyed'));
    }
    this.pendingRequests.clear();
    this.manager = null;
  }

  // Status methods
  isConnected(): boolean {
    return this.manager?.getConnectionState().isConnected || false;
  }

  getPendingRequestsCount(): number {
    return this.pendingRequests.size;
  }
}