// Blobbino: funziona anche offline.
// I file in /assets hanno un nome che cambia a ogni build, quindi si possono
// tenere in cache per sempre. La pagina invece si scarica sempre fresca quando c'è rete.
const VERSION = 'blobbino-v4';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(['./', './manifest.webmanifest', './icon-192.png', './apple-touch-icon.png'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put('./', copy)); return res; })
        .catch(() => caches.match('./'))
    );
    return;
  }

  const sameOrigin = url.origin === location.origin;
  const fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !fonts) return;

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
