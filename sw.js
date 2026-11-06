const PREFIX = "eac-v3-";  // eigen voorvoegsel: alle GitHub-apps delen één opslag
const CACHE = PREFIX + "10";
const BESTANDEN = ["./", "./index.html", "./styles.css", "./nac-logo.png", "./favorieten.js", "/EA-Cateringv2/app.js?v=4", "/EA-Cateringv2/videos.js"];

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE).then((c) => c.addAll(BESTANDEN)));
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((namen) =>
            Promise.all(namen.filter((n) => (n.startsWith(PREFIX)) && n !== CACHE).map((n) => caches.delete(n)))
        )
    );
    self.clients.claim();
});

// Eerst het netwerk, bij geen verbinding de cache
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
