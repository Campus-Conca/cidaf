/* Service worker de «¿Esto se puede aquí?»: que el sitio y el mapa sigan sirviendo sin señal.
   Páginas: primero la red, para tener lo último; si no hay, la copia guardada.
   Datos, estilos, programas, fuentes e imágenes: la copia guardada al momento, y se actualiza por detrás.
   Foto satelital: solo las teselas que ya se vieron, hasta 600. (Las de calles de OpenStreetMap no se guardan:
   su política pide no almacenarlas así.)
   Al publicar cambios, sube VERSION para que todos reciban lo nuevo.
   Puede vivir en una carpeta de un sitio más grande (la página del CIDAF): solo atiende lo que está en su carpeta y
   solo toca sus propias cachés, que llevan el nombre de esa carpeta. */
'use strict';
var VERSION = '2026-11-12b';
var PREFIJO = 'esto-se-puede-aqui ' + self.registration.scope + ' ';
var SITIO = PREFIJO + 'sitio-' + VERSION, TESELAS = PREFIJO + 'teselas-1', MAX_TESELAS = 600;
var BASICOS = ['index.html', 'mapa.html', 'conca.html', 'programa.html', 'guia.html', 'reto.html', 'kit.html',
  'css/site.css', 'css/mapa.css', 'css/leaflet.css', 'js/site.js', 'js/leaflet.js', 'js/pmdu-data.js', 'js/mapa.js',
  'js/ubicacion.js', 'js/guia.js', 'js/reto.js', 'js/programa.js', 'data/zonas.js', 'data/lugares.js', 'data/referencia.js',
  'fonts/fraunces.woff2', 'fonts/fraunces-italic.woff2', 'fonts/instrument-sans.woff2', 'img/icono.svg'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SITIO).then(function (c) { return c.addAll(BASICOS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf(PREFIJO) === 0 && k !== SITIO && k !== TESELAS; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function redPrimero(req) {
  return fetch(req).then(function (r) {
    if (r.ok) { var copia = r.clone(); caches.open(SITIO).then(function (c) { c.put(req, copia); }); }
    return r;
  }).catch(function () {
    return caches.open(SITIO).then(function (c) { return c.match(req, { ignoreSearch: true }); }).then(function (r) {
      return r || new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sin conexión</title>' +
        '<p style="font:1.1rem sans-serif;padding:24px">Sin conexión, y esta página no se había abierto antes en este teléfono. El <a href="mapa.html">mapa</a> sí funciona sin señal.</p>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    });
  });
}
function guardadoPrimero(req) {
  return caches.open(SITIO).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (guardado) {
      var red = fetch(req).then(function (r) { if (r.ok) c.put(req, r.clone()); return r; }).catch(function () { return guardado; });
      return guardado || red;
    });
  });
}
function recorta(c) {
  return c.keys().then(function (ks) {
    var sobran = ks.length - MAX_TESELAS;
    return Promise.all(ks.slice(0, Math.max(0, sobran)).map(function (k) { return c.delete(k); }));
  });
}
function tesela(req) {
  return caches.open(TESELAS).then(function (c) {
    return c.match(req.url).then(function (guardada) {
      if (guardada) return guardada;
      return fetch(req.url, { mode: 'cors', credentials: 'omit' }).then(function (r) {
        if (r.ok) { c.put(req.url, r.clone()).then(function () { return recorta(c); }); }
        return r;
      }).catch(function () { return fetch(req); });
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.hostname === 'server.arcgisonline.com') { e.respondWith(tesela(req)); return; }
  if (url.origin !== self.location.origin || req.url.indexOf(self.registration.scope) !== 0) return;   // fuera de su carpeta, no se mete
  if (req.mode === 'navigate' || /\.html$/.test(url.pathname) || /\/$/.test(url.pathname)) { e.respondWith(redPrimero(req)); return; }
  e.respondWith(guardadoPrimero(req));
});
