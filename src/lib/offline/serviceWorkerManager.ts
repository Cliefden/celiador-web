// Service Worker Manager
// Handles registration, updates, and communication with the service worker

export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isRegistered = false;

  async init(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      this.isRegistered = true;

      // Set up event listeners
      this.setupEventListeners();

      console.log('✅ Service Worker registered successfully');
      return true;

    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return false;
    }
  }

  private setupEventListeners(): void {
    if (!this.registration) return;

    // Listen for Service Worker updates
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 New Service Worker available');
            // Could show user notification about update
          }
        });
      }
    });

    // Listen for messages from Service Worker
    navigator.serviceWorker.addEventListener('message', event => {
      this.handleServiceWorkerMessage(event.data);
    });

    // Listen for Service Worker controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service Worker controller changed');
      // Reload page to get fresh content
      window.location.reload();
    });
  }

  private handleServiceWorkerMessage(data: any): void {
    console.log('📨 Received message from Service Worker:', data);

    switch (data.type) {
      case 'SYNC_COMPLETE':
        // Emit custom event for app to handle
        window.dispatchEvent(new CustomEvent('backgroundSyncComplete', {
          detail: { success: data.success, total: data.total }
        }));
        break;

      case 'CACHE_UPDATED':
        // Notify about cache updates
        window.dispatchEvent(new CustomEvent('cacheUpdated', {
          detail: data
        }));
        break;
    }
  }

  // Trigger background sync
  async triggerSync(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.sync.register('activity-sync');
      console.log('🔄 Background sync registered');
    } catch (error) {
      console.error('❌ Failed to register background sync:', error);
    }
  }

  // Send message to Service Worker
  async sendMessage(type: string, data?: any): Promise<void> {
    if (!navigator.serviceWorker.controller) return;

    navigator.serviceWorker.controller.postMessage({
      type,
      ...data
    });
  }

  // Check if Service Worker is ready
  isReady(): boolean {
    return this.isRegistered && !!navigator.serviceWorker.controller;
  }

  // Update Service Worker
  async update(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      console.log('🔄 Service Worker update check completed');
    } catch (error) {
      console.error('❌ Service Worker update failed:', error);
    }
  }

  // Unregister Service Worker
  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const result = await this.registration.unregister();
      this.registration = null;
      this.isRegistered = false;
      console.log('🗑️ Service Worker unregistered');
      return result;
    } catch (error) {
      console.error('❌ Service Worker unregister failed:', error);
      return false;
    }
  }
}

// Create singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();