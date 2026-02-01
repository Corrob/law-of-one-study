// Service worker for Law of One Study Companion PWA
// Caches the app shell and static assets for faster repeat visits.

const CACHE_NAME = "lo1-v2";
const SHELL_ASSETS = ["/", "/icons/icon-192.png", "/icons/icon-512.png"];
const MAX_CACHE_ENTRIES = 150;

/**
 * Trim a cache to the maximum number of entries by removing the oldest first.
 */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    const toDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip API routes and analytics
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/ingest/")) {
    return;
  }

  // Stale-while-revalidate for Ra material JSON and static images
  // Serve from cache immediately, then update cache in background
  if (
    url.pathname.startsWith("/sections/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          const fetchPromise = fetch(event.request).then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
              trimCache(CACHE_NAME, MAX_CACHE_ENTRIES);
            }
            return response;
          });
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Network-first for page navigations and other assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful page navigations for offline fallback
        if (response.ok && event.request.mode === "navigate") {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
            trimCache(CACHE_NAME, MAX_CACHE_ENTRIES);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
