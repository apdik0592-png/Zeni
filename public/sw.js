const SHELL_CACHE = "zeni-shell-v2";
const MEDIA_CACHE = "zeni-media-v2";
const SHELL = ["/", "/manifest.json", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== MEDIA_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isMediaRequest(url) {
  // Matches Supabase Storage public object URLs for videos, thumbnails, avatars.
  return url.pathname.includes("/storage/v1/object/public/media/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // App navigation: try the network first, fall back to the cached shell offline.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/")));
    return;
  }

  // Videos, thumbnails, and avatars: cache-first once seen, so shorts/videos a
  // person has already opened keep working offline. New ones still hit the
  // network and get cached for next time.
  if (isMediaRequest(url)) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then(async (cache) => {
        const cached = await cache.match(url.toString(), { ignoreSearch: true, ignoreVary: true });
        if (cached) return cached;
        try {
          // Fetch the full file (ignore Range so we cache one complete, replayable copy).
          const response = await fetch(url.toString(), { mode: "cors", credentials: "omit" });
          if (response.ok) cache.put(url.toString(), response.clone());
          return response;
        } catch (err) {
          return cached || new Response("", { status: 504, statusText: "Offline" });
        }
      })
    );
    return;
  }

  // Everything else (app shell assets, JS/CSS chunks): cache-first with a
  // network fallback that refreshes the cache for next time.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached)
    )
  );
});
