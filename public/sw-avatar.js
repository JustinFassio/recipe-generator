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
      throw new Error('Network request failed');
    }
  } catch (error) {
    console.error('Avatar fetch failed:', error);

    // Return stale cache if available
    if (cachedResponse) {
      console.log('Serving stale avatar from cache:', request.url);
      return cachedResponse;
    }

    // Return a placeholder image
    return new Response(generatePlaceholderSVG(), {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
    });
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
 * Generate a placeholder SVG for failed avatar loads
 */
function generatePlaceholderSVG() {
  return `
    <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <circle cx="50" cy="35" r="15" fill="#d1d5db"/>
      <path d="M20 80 Q50 60 80 80 L80 100 L20 100 Z" fill="#d1d5db"/>
      <text x="50" y="95" font-family="Arial, sans-serif" font-size="8" 
            text-anchor="middle" fill="#9ca3af">Avatar</text>
    </svg>
  `;
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
