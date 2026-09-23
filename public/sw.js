// ponytail: stale-while-revalidate on same-origin GETs — enough for the
// install prompt + offline shell. Convex calls stay live-network; if the
// app ever needs real offline writes, upgrade path is a sync queue.
const CACHE = "mapot-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add("/")).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).catch(() => caches.match("/")));
    return;
  }
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const hit = await c.match(e.request);
      const net = fetch(e.request).then((r) => {
        c.put(e.request, r.clone());
        return r;
      });
      return hit || net;
    })
  );
});
