/**
 * Avatar Cache Service Worker
 *
 * Provides offline caching for avatar images with intelligent
 * cache management and background sync capabilities.
 */

const CACHE_NAME = 'avatar-cache-v1';
const AVATAR_CACHE_SIZE = 50; // Maximum number of avatars to cache
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// Install event - set up initial cache
self.addEventListener('install', (event) => {
  console.log('Avatar cache service worker installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Avatar cache service worker activating...');
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old avatar cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - handle avatar requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle avatar requests
  if (!isAvatarRequest(event.request)) {
    return;
  }

  // Skip service worker in development
  if (
    url.hostname.includes('127.0.0.1') ||
    url.hostname.includes('localhost')
  ) {
    return;
  }

  event.respondWith(handleAvatarRequest(event.request));
});

/**
 * Check if request is for an avatar image
 */
function isAvatarRequest(request) {
  const url = new URL(request.url);

  // Check if it's a Supabase storage avatar URL
  if (url.pathname.includes('/storage/v1/object/public/avatars/')) {
    return true;
  }

  // Check if it's an optimized avatar URL
  if (url.searchParams.has('width') && url.searchParams.has('height')) {
    return true;
  }

  return false;
}

/**
 * Handle avatar request with caching strategy
 */
async function handleAvatarRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Check if we have a cached version
  if (cachedResponse) {
    const cacheDate = cachedResponse.headers.get('sw-cache-date');
    const isExpired =
      cacheDate && Date.now() - parseInt(cacheDate) > CACHE_EXPIRY;

    if (!isExpired) {
      console.log('Serving avatar from cache:', request.url);
      return cachedResponse;
    } else {
      // Remove expired cache entry
      await cache.delete(request);
    }
  }

  try {
    // Fetch from network
    console.log('Fetching avatar from network:', request.url);
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Clone response for caching
      const responseToCache = networkResponse.clone();

      // Add cache metadata
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-date', Date.now().toString());

      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });

      // Cache the response
      await cache.put(request, cachedResponse);

      // Clean up old entries if cache is getting large
      await cleanupCache(cache);

      return networkResponse;
    } else {
      // If network fails and we have a stale cache, return it
      if (cachedResponse) {
        console.log('Network failed, serving stale cache:', request.url);
        return cachedResponse;
      }

      // If no cache available, let the browser handle the request normally
      console.log(
        'No cache available, letting browser handle request:',
        request.url
      );
      return fetch(request);
    }
  } catch (error) {
    console.error('Avatar fetch failed:', error);

    // Return stale cache if available
    if (cachedResponse) {
      console.log('Serving stale avatar from cache:', request.url);
      return cachedResponse;
    }

    // Let the browser handle the request normally instead of returning placeholder
    console.log('Letting browser handle failed avatar request:', request.url);
    return fetch(request);
  }
}

/**
 * Clean up old cache entries
 */
async function cleanupCache(cache) {
  const requests = await cache.keys();

  if (requests.length <= AVATAR_CACHE_SIZE) {
    return;
  }

  // Get cache entries with metadata
  const entries = await Promise.all(
    requests.map(async (request) => {
      const response = await cache.match(request);
      const cacheDate = response?.headers.get('sw-cache-date');
      return {
        request,
        cacheDate: cacheDate ? parseInt(cacheDate) : 0,
      };
    })
  );

  // Sort by cache date (oldest first)
  entries.sort((a, b) => a.cacheDate - b.cacheDate);

  // Remove oldest entries
  const toRemove = entries.slice(0, entries.length - AVATAR_CACHE_SIZE);
  await Promise.all(toRemove.map((entry) => cache.delete(entry.request)));

  console.log(`Cleaned up ${toRemove.length} old avatar cache entries`);
}

/**
 * Background sync for avatar preloading
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'avatar-preload') {
    event.waitUntil(preloadAvatars());
  }
});

/**
 * Preload avatars in background
 */
async function preloadAvatars() {
  try {
    // Get list of avatars to preload from IndexedDB or other storage
    const avatarsToPreload = await getAvatarsToPreload();

    const cache = await caches.open(CACHE_NAME);

    for (const avatarUrl of avatarsToPreload) {
      try {
        const response = await fetch(avatarUrl);
        if (response.ok) {
          await cache.put(avatarUrl, response);
        }
      } catch (error) {
        console.warn('Failed to preload avatar:', avatarUrl, error);
      }
    }

    console.log(`Preloaded ${avatarsToPreload.length} avatars in background`);
  } catch (error) {
    console.error('Background avatar preload failed:', error);
  }
}

/**
 * Get list of avatars to preload (placeholder implementation)
 */
async function getAvatarsToPreload() {
  // This would typically come from IndexedDB or a message from the main thread
  // For now, return empty array
  return [];
}

/**
 * Handle messages from main thread
 */
self.addEventListener('message', (event) => {
  if (event.data.type === 'PRELOAD_AVATARS') {
    preloadAvatars();
  } else if (event.data.type === 'CLEAR_AVATAR_CACHE') {
    caches.delete(CACHE_NAME);
  }
});
