/* Ecotonos del valle de Concá — para que el sitio abra sin señal después de la primera visita.
   Sube VERSION con cada cambio publicado. */
const VERSION = 'ecotonos-v9';
const BASE = ['./', 'index.html', 'historia.html', 'propuestas.html', 'participa.html', 'reporte.html', 'resumen.html', 'css/ecotonos.css', 'js/config.js', 'js/datos.js', 'js/ecotonos.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.endsWith('.pdf')) return;
  const guarda = resp => { if (resp && resp.ok) { const copia = resp.clone(); caches.open(VERSION).then(c => c.put(r, copia)); } return resp; };
  const esPagina = r.mode === 'navigate' || /\.(html|js|css)$/.test(u.pathname);
  if (esPagina) e.respondWith(fetch(r).then(guarda).catch(() => caches.match(r, { ignoreSearch: true }).then(x => x || caches.match('index.html'))));
  else e.respondWith(caches.match(r).then(x => x || fetch(r).then(guarda)));
});
