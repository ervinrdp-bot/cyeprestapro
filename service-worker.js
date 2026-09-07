const CACHE_NAME = 'prestapro-v5';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './manifest.json',
  './assets/logo.svg',
  './js/app.js',
  './js/store/db.js',
  './js/models/loan_engine.js',
  './js/views/dashboard.js',
  './js/views/clients.js',
  './js/views/loans.js',
  './js/views/payments.js',
  './js/views/amortizations.js',
  './js/views/receipts.js',
  './js/views/automations.js',
  './js/views/reports.js',
  './js/views/exports.js',
  './js/views/settings.js',
  './js/utils/formatters.js',
  './js/utils/pdf_exporter.js',
  './js/utils/whatsapp_helper.js'
  ,'./js/utils/notifications.js'
];

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('./'));
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('Cache addAll non-critical error:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        return caches.match('./index.html');
      });
    })
  );
});
