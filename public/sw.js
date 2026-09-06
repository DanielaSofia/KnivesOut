const CACHE_NAME = "knivesout-v2";
const OFFLINE_URL = "/offline";
const APP_SHELL = [
  "/",
  "/restaurants",
  "/wishlist",
  "/settings",
  "/profile",
  "/map",
  OFFLINE_URL,
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        APP_SHELL.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "no-store" });

            if (response.ok) {
              await cache.put(url, response);
            }
          } catch {
            return undefined;
          }
        }),
      );
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const isApiRequest = new URL(request.url).pathname.startsWith("/api/");

  if (request.mode === "navigate") {
    const cachedResponse = await caches.match(request, { ignoreSearch: true });

    if (self.navigator.onLine === false) {
      return cachedResponse || caches.match(OFFLINE_URL);
    }

    try {
      const response = await fetchWithTimeout(request, 4000);

      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }

      return response;
    } catch {
      return cachedResponse || caches.match(OFFLINE_URL);
    }
  }

  if (isApiRequest) {
    try {
      const response = await fetchWithTimeout(request, 4000);

      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }

      return response;
    } catch {
      return (await caches.match(request)) || caches.match(OFFLINE_URL);
    }
  }

  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetchWithTimeout(request, 4000);

    if (response.ok && new URL(request.url).origin === self.location.origin) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    return caches.match(OFFLINE_URL);
  }
}

function fetchWithTimeout(request, timeout) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Network timeout")), timeout);
    }),
  ]);
}
