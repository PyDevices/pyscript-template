// VERSION is replaced with the deploy commit SHA by .github/workflows/deploy.yml.
// Locally it stays 'dev', which still busts the cache on every vendor/edit
// commit made to this file; for iterative local testing, hard-refresh
// (or unregister the service worker) instead of relying on this value to change.
const VERSION = '__DEPLOY_VERSION__';
const CACHE_NAME = 'pyscript-template-' + (VERSION === '__DEPLOY_VERSION__' ? 'dev' : VERSION);
const SHELL = [
  './',
  './index.html',
  './main.py',
  './pyscript.json',
  './manifest.json',
  './style.css',
  './pwa.js',
  './icon-192.png',
  './icon-512.png',
  './vendor/pyscript/core.css',
  './vendor/pyscript/core.js',
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    return cache.addAll(SHELL);
  }).then(function () {
    return self.skipWaiting();
  }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (names) {
    return Promise.all(names.filter(function (name) {
      return name !== CACHE_NAME;
    }).map(function (name) {
      return caches.delete(name);
    }));
  }).then(function () {
    return self.clients.claim();
  }));
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(function (cached) {
    if (cached) return cached;
    return fetch(event.request).then(function (response) {
      if (!response || response.status !== 200) return response;
      var copy = response.clone();
      caches.open(CACHE_NAME).then(function (cache) {
        cache.put(event.request, copy);
      });
      return response;
    });
  }));
});
