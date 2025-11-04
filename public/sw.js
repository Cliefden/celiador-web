// Service Worker DISABLED - was caching message API responses
// This was causing stale message data (18 messages instead of 26)

// Unregister this service worker immediately
self.addEventListener('install', event => {
  console.log('🚫 Service Worker disabled - unregistering...');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('🗑️ Service Worker clearing caches and unregistering...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('🗑️ Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Unregister this service worker
      return self.registration.unregister();
    })
  );
  
  return self.clients.claim();
});

// Disable all fetch interception
self.addEventListener('fetch', event => {
  // Let all requests go through to network without caching
  return;
});

console.log('🚫 Service Worker disabled to fix message caching issue');

const CACHE_NAME = 'activity-cache-v1';
const API_BASE = self.location.origin.includes('localhost') 
  ? 'http://localhost:4000'
  : 'https://celiador-unified-production.up.railway.app';

// Install event - cache essential resources
self.addEventListener('install', event => {
  console.log('📦 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/',
        '/dashboard',
        '/offline.html', // Would need to create this fallback page
      ]);
    })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('⚡ Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all pages immediately
  return self.clients.claim();
});

// Background Sync event - process pending actions
self.addEventListener('sync', event => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'activity-sync') {
    event.waitUntil(performBackgroundSync());
  } else if (event.tag === 'pending-actions-sync') {
    event.waitUntil(processPendingActions());
  }
});

// Fetch event - handle network requests with offline fallback
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/') || url.origin === API_BASE) {
    event.respondWith(handleApiRequest(event.request));
  }
  // Handle page requests
  else if (event.request.mode === 'navigate') {
    event.respondWith(handlePageRequest(event.request));
  }
  // Handle static assets
  else {
    event.respondWith(handleAssetRequest(event.request));
  }
});

// API Request Handler
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful GET requests
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    console.log('🔌 API request failed, checking cache:', request.url);
    
    // Try cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // For POST/PUT/DELETE requests when offline, queue them
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      await queueOfflineRequest(request);
      
      // Return a mock response indicating the request was queued
      return new Response(
        JSON.stringify({ 
          success: true, 
          queued: true, 
          message: 'Request queued for sync when online' 
        }),
        { 
          status: 202, // Accepted
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ error: 'Network unavailable and no cached response' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Page Request Handler
async function handlePageRequest(request) {
  try {
    // Try network first
    return await fetch(request);
  } catch (error) {
    console.log('🔌 Page request failed, serving from cache:', request.url);
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to offline page
    const offlineResponse = await caches.match('/offline.html');
    return offlineResponse || new Response('Offline', { status: 503 });
  }
}

// Asset Request Handler
async function handleAssetRequest(request) {
  // Try cache first for assets
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Try network
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('🔌 Asset request failed:', request.url);
    return new Response('Asset unavailable', { status: 503 });
  }
}

// Background Sync Operations
async function performBackgroundSync() {
  console.log('🔄 Performing background sync...');
  
  try {
    // Open IndexedDB to get pending data
    const db = await openActivityDB();
    
    // Get pending actions
    const pendingActions = await getPendingActions(db);
    console.log(`📝 Found ${pendingActions.length} pending actions`);
    
    // Process each action
    let successCount = 0;
    for (const action of pendingActions) {
      try {
        const success = await processAction(action);
        if (success) {
          await removePendingAction(db, action.id);
          successCount++;
        }
      } catch (error) {
        console.error('❌ Action processing failed:', error);
      }
    }
    
    console.log(`✅ Background sync completed: ${successCount}/${pendingActions.length} successful`);
    
    // Notify app of sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        success: successCount,
        total: pendingActions.length
      });
    });
    
  } catch (error) {
    console.error('💥 Background sync failed:', error);
  }
}

async function processPendingActions() {
  console.log('🔄 Processing pending actions in background...');
  await performBackgroundSync(); // Same logic for now
}

// Queue offline requests
async function queueOfflineRequest(request) {
  try {
    const db = await openActivityDB();
    const body = await request.text();
    
    const action = {
      id: `bg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };
    
    await addPendingAction(db, action);
    
    // Register background sync
    await self.registration.sync.register('pending-actions-sync');
    
    console.log('📝 Queued offline request:', action.id);
    
  } catch (error) {
    console.error('❌ Failed to queue offline request:', error);
  }
}

// Process individual action
async function processAction(action) {
  try {
    const request = new Request(action.url, {
      method: action.method,
      headers: action.headers,
      body: action.body || undefined
    });
    
    const response = await fetch(request);
    return response.ok;
    
  } catch (error) {
    console.error('❌ Failed to process action:', error);
    return false;
  }
}

// IndexedDB operations (simplified for Service Worker)
async function openActivityDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ActivityStorage', 1);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pendingActions')) {
        const store = db.createObjectStore('pendingActions', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

async function getPendingActions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingActions'], 'readonly');
    const store = transaction.objectStore('pendingActions');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function addPendingAction(db, action) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');
    const request = store.put(action);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function removePendingAction(db, actionId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');
    const request = store.delete(actionId);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Message handling from app
self.addEventListener('message', event => {
  console.log('📨 Service Worker received message:', event.data);
  
  switch (event.data.type) {
    case 'SYNC_NOW':
      // Trigger immediate sync
      self.registration.sync.register('activity-sync');
      break;
      
    case 'QUEUE_ACTION':
      // Queue an action for background sync
      queueOfflineRequest(new Request(event.data.url, event.data.options));
      break;
      
    case 'CLEAR_CACHE':
      // Clear all caches
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
      break;
  }
});

console.log('🚀 Service Worker loaded and ready');