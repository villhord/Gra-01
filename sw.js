const CACHE_NAME = 'gra01-v1';
const FILES_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './manifest.json',
    './js/main.js',
    './js/game.js',
    './js/input.js',
    './js/renderer.js',
    './js/physics.js',
    './js/entities/loader.js',
    './js/entities/truck.js',
    './js/entities/sandpile.js',
    './js/entities/arek.js',
    './js/entities/quarry.js',
    './js/ui/hud.js',
    './js/ui/menu.js',
    './js/ui/tutorial.js',
    './js/utils/constants.js',
    './js/utils/audio.js',
    './icons/icon-192.png',
    './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(
                names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
});
