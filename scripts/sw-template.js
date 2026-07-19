/* Better Dex service worker — generated at build time, do not edit in public/. */
const VERSION = "__VERSION__";
const PAGE_CACHE = `pages-${VERSION}`;
const IMG_CACHE = "images-v1";
const SPRITES_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

const CORE = ["/", "/pokedex", "/typen", "/offline", "/api/search-index", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGE_CACHE);
      await Promise.all(
        CORE.map(async (url) => {
          const response = await fetch(url);
          if (response.ok) await cache.put(url, await unredirected(response));
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("pages-") && key !== PAGE_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

/* ---------- background cache fill (tier 2: pages + sprites, tier 3: artwork) ---------- */

let filling = false;

async function getManifest() {
  const response = await fetch(`/precache-manifest.json?v=${VERSION}`);
  if (!response.ok) throw new Error("manifest fetch failed");
  return response.json();
}

async function broadcast(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const client of clients) client.postMessage(message);
}

async function missingUrls(cache, urls) {
  const cached = new Set((await cache.keys()).map((request) => request.url));
  return urls.filter((url) => !cached.has(new URL(url, self.location.origin).href));
}

async function fillCache(includeArtwork) {
  if (filling) return;
  filling = true;
  try {
    const manifest = await getManifest();
    const pageCache = await caches.open(PAGE_CACHE);
    const imageCache = await caches.open(IMG_CACHE);

    const jobs = [
      { cache: pageCache, urls: await missingUrls(pageCache, manifest.pages), external: false },
      { cache: imageCache, urls: await missingUrls(imageCache, manifest.sprites), external: true },
    ];
    if (includeArtwork) {
      jobs.push({ cache: imageCache, urls: await missingUrls(imageCache, manifest.artwork), external: true });
    }

    const total = jobs.reduce((sum, job) => sum + job.urls.length, 0);
    if (total === 0) {
      await broadcast({ type: "fill-done", failed: 0 });
      return;
    }

    let done = 0;
    let failed = 0;
    const CHUNK = 6;
    for (const job of jobs) {
      for (let i = 0; i < job.urls.length; i += CHUNK) {
        const chunk = job.urls.slice(i, i + CHUNK);
        await Promise.all(
          chunk.map(async (url) => {
            try {
              const request = job.external ? new Request(url, { mode: "cors" }) : url;
              const response = await fetch(request);
              if (response.ok) await job.cache.put(url, await unredirected(response));
              else failed += 1;
            } catch {
              failed += 1;
            }
            done += 1;
          }),
        );
        await broadcast({ type: "fill-progress", done, total, failed });
      }
    }
    await broadcast({ type: "fill-done", failed });
  } catch {
    await broadcast({ type: "fill-error" });
  } finally {
    filling = false;
  }
}

async function reportStatus(client) {
  try {
    const manifest = await getManifest();
    const pageCache = await caches.open(PAGE_CACHE);
    const imageCache = await caches.open(IMG_CACHE);
    const pagesMissing = await missingUrls(pageCache, manifest.pages);
    const spritesMissing = await missingUrls(imageCache, manifest.sprites);
    const artworkMissing = await missingUrls(imageCache, manifest.artwork);
    client.postMessage({
      type: "status",
      version: VERSION,
      pages: { total: manifest.pages.length, cached: manifest.pages.length - pagesMissing.length },
      sprites: { total: manifest.sprites.length, cached: manifest.sprites.length - spritesMissing.length },
      artwork: { total: manifest.artwork.length, cached: manifest.artwork.length - artworkMissing.length },
    });
  } catch {
    client.postMessage({ type: "status-error" });
  }
}

async function resetCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
  // Re-seed the core pages so the app keeps working after the reset.
  try {
    const cache = await caches.open(PAGE_CACHE);
    await cache.addAll(CORE);
  } catch {
    // Offline during reset: core pages return on the next online visit.
  }
  await broadcast({ type: "reset-done" });
}

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "fill") event.waitUntil(fillCache(false));
  if (data.type === "fill-artwork") event.waitUntil(fillCache(true));
  if (data.type === "reset") event.waitUntil(resetCaches());
  if (data.type === "status" && event.source) event.waitUntil(reportStatus(event.source));
});

/* ---------- fetch handling ---------- */

function stripSearch(url) {
  const parsed = new URL(url);
  parsed.search = "";
  return parsed.href;
}

/**
 * Safari refuses navigation responses with the `redirected` flag when they
 * come from a service worker ("Response served by service worker has
 * redirections"). Re-wrap such responses before caching them.
 */
async function unredirected(response) {
  if (!response.redirected) return response;
  return new Response(await response.clone().blob(), {
    status: 200,
    statusText: "OK",
    headers: response.headers,
  });
}

async function handleNavigate(request) {
  const cache = await caches.open(PAGE_CACHE);
  const cached = await cache.match(request.url, { ignoreSearch: true });
  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) await cache.put(stripSearch(request.url), await unredirected(response.clone()));
      return response;
    })
    .catch(() => null);
  if (cached) return cached; // stale-while-revalidate
  const network = await networkPromise;
  if (network) return network;
  return (await cache.match("/offline")) || Response.error();
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function handleImage(request, url) {
  const cache = await caches.open(IMG_CACHE);
  const cached = await cache.match(request.url);
  if (cached) return cached;
  try {
    const response = await fetch(new Request(request.url, { mode: "cors" }));
    if (response.ok) cache.put(request.url, response.clone());
    return response;
  } catch (error) {
    // Offline artwork fallback: show the pixel sprite of the same Pokémon.
    const match = url.pathname.match(/official-artwork\/(\d+)\.png$/);
    if (match) {
      const sprite = await cache.match(`${SPRITES_BASE}/${match[1]}.png`);
      if (sprite) return sprite;
    }
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.searchParams.has("_rsc")) {
      // RSC flight request: network only. On failure Next falls back to a
      // full navigation, which we serve from cache below.
      event.respondWith(fetch(request).catch(() => Response.error()));
      return;
    }
    if (request.mode === "navigate") {
      event.respondWith(handleNavigate(request));
      return;
    }
    if (
      url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname === "/api/search-index" ||
      url.pathname === "/manifest.webmanifest" ||
      url.pathname === "/apple-touch-icon.png"
    ) {
      event.respondWith(cacheFirst(request, PAGE_CACHE));
      return;
    }
    return;
  }

  if (url.hostname === "raw.githubusercontent.com") {
    event.respondWith(handleImage(request, url));
  }
});
