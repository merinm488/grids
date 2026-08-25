const CACHE_NAME = 'grids-spreadsheet-v3';
const urlsToCache = [
  '/',
  '/home.html',
  '/editor.html',
  '/shared.html',
  '/styles.css',
  '/home.css',
  '/auth.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32x32.png',
  'https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/plugins/css/pluginsCss.css',
  'https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/plugins/plugins.css',
  'https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/css/luckysheet.css',
  'https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/assets/iconfont/iconfont.css',
  'https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/plugins/js/plugin.js',
  'https://cdn.jsdelivr.net/npm/luckysheet@2.1.13/dist/luckysheet.umd.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

const STATIC_CACHE = 'grids-static-v3';
const DYNAMIC_CACHE = 'grids-dynamic-v3';
const API_CACHE = 'grids-api-v3';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll([
          '/',
          '/home.html',
          '/editor.html',
          '/styles.css',
          '/home.css',
          '/auth.css',
          '/manifest.json'
        ]);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - handle API requests differently
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle API requests - NEVER cache, always go to network
  // This prevents authentication issues in production
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request, {
        // Important: Include credentials for authenticated requests
        credentials: 'include',
        // Don't cache API responses
        cache: 'no-store',
        // Ensure we don't use cached responses
        redirect: 'follow'
      })
    );
    return;
  }

  // Handle static assets - cache first, fall back to network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version for static assets
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response for caching
        const responseToCache = response.clone();

        // Cache dynamic resources
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch((error) => {
        // Return a custom offline page for HTML requests
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/home.html');
        }
      });
    })
  );
});

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-spreadsheets') {
    event.waitUntil(syncSpreadsheets());
  }
});

// Sync spreadsheets when back online
async function syncSpreadsheets() {
  try {
    // Get all clients and notify them to sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_DATA' });
    });
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Handle push notifications (for future features)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/home.html'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Grids', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/home.html')
  );
});

// Message handler for communication from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
