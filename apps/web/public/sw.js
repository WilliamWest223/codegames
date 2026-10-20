/*
 * CodeGames service worker v3: offline-capable PWA with strict origin isolation.
 * API and Auth routes are bypassed from caching and go straight to network.
 */
// Bump CACHE_VERSION on any change to caching behavior; old caches are deleted on activate.
const CACHE_VERSION = 4;
const CACHE = `codegames-v${CACHE_VERSION}`;
// Fallback CSP when a response has none. Must match e2e EXPECTED_CSP / vite default
// (connect-src 'self' only). Production HTTP headers (vercel.json) add Supabase origins;
// secured() never overwrites an existing CSP, so the header wins when present.
const CSP = "default-src 'self'; script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'";
const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

function secured(response) {
  if (!response || response.type === 'opaque' || response.status === 0) return response;
  const headers = new Headers(response.headers);
  let changed = false;
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(name)) {
      headers.set(name, value);
      changed = true;
    }
  }
  return changed
    ? new Response(response.body, { status: response.status, statusText: response.statusText, headers })
    : response;
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['/', '/manifest.webmanifest', '/icon.svg']))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'CLEAR_USER_CACHES') {
    event.waitUntil(
      caches.open(CACHE).then((cache) =>
        cache.keys().then((keys) => {
          const deletions = keys
            .filter((req) => !req.url.includes('/pyodide/') && !['/', '/manifest.webmanifest', '/icon.svg'].some((p) => req.url.endsWith(p)))
            .map((req) => cache.delete(req));
          return Promise.all(deletions);
        })
      ).then(() => {
        if (event.source) {
          event.source.postMessage('CACHES_CLEARED');
        }
      })
    );
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Strictly network-only conditions: non-GET, cross-origin, /api/ or /auth/ paths, or Authorization headers
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    /^\/(api|auth)(\/|$)/.test(url.pathname) ||
    request.headers.has('authorization')
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const safe = secured(response);
          if (response.ok && response.type === 'basic') {
            const copy = safe.clone();
            caches.open(CACHE).then((cache) => cache.put('/', copy));
          }
          return safe;
        })
        .catch(() => caches.match('/').then((c) => secured(c)))
    );
    return;
  }

  // Vite emits content-hashed files under /assets/: immutable, so cache-first is safe.
  // Everything else (pyodide, manifest, icons) may change in place: stale-while-revalidate.
  const hashed = url.pathname.startsWith('/assets/');
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached && hashed) return secured(cached);
      const network = fetch(request).then((response) => {
        const safe = secured(response);
        const cacheControl = response.headers.get('Cache-Control') || '';
        if (response.ok && response.type === 'basic' && !cacheControl.includes('no-store') && !cacheControl.includes('private')) {
          const copy = safe.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return safe;
      });
      if (cached) {
        network.catch(() => undefined);
        return secured(cached);
      }
      return network;
    })
  );
});
