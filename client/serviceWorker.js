// AJ Tours & Travel Service Worker
const CACHE_NAME = 'aj-tours-portal-v4';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
