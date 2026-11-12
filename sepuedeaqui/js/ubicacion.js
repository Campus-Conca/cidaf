/* Lee una ubicación pegada: enlace de Google Maps (también el que manda WhatsApp), de Apple Maps u
   OpenStreetMap, un enlace geo:, coordenadas decimales («21.44, -99.63») o en grados, minutos y segundos.
   leerUbicacion(texto) -> {lat, lon} o {error: 'mensaje para la persona'} */
(function (global) {
  'use strict';
  var NUM = '([+-]?\\d{1,3}(?:\\.\\d+)?)';
  var PAR = new RegExp(NUM + '\\s*[,;\\s]\\s*' + NUM);

  function ajustar(a, b) {
    var lat = parseFloat(a), lon = parseFloat(b);
    if (!isFinite(lat) || !isFinite(lon)) return null;
    if (Math.abs(lat) > 90 && Math.abs(lon) <= 90) { var t = lat; lat = lon; lon = t; }   // vino «longitud, latitud»
    if (lon > 95 && lon < 120 && lat > 10 && lat < 35) lon = -lon;                       // a la longitud de México le faltó el signo
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
    return { lat: lat, lon: lon };
  }
  function par(s) { var m = PAR.exec(s || ''); return m ? ajustar(m[1], m[2]) : null; }

  function gms(s) {             // 21°26'24.0"N 99°37'48.0"W
    var re = /(\d{1,3})\s*[°º]\s*(\d{1,2})?\s*['’′]?\s*(\d{1,2}(?:[.,]\d+)?)?\s*(?:"|”|″|'')?\s*([NSEOW])/gi, m, v = {};
    while ((m = re.exec(s))) {
      var x = parseInt(m[1], 10) + (m[2] ? parseInt(m[2], 10) / 60 : 0) + (m[3] ? parseFloat(m[3].replace(',', '.')) / 3600 : 0);
      var h = m[4].toUpperCase();
      if (h === 'S' || h === 'W' || h === 'O') x = -x;
      v[(h === 'N' || h === 'S') ? 'lat' : 'lon'] = x;
    }
    return ('lat' in v && 'lon' in v) ? ajustar(v.lat, v.lon) : null;
  }

  function desdeUrl(s) {
    var u;
    try { u = new URL(s); } catch (e) { return null; }
    var host = u.hostname.toLowerCase(), todo = decodeURIComponent(u.href);
    if (/(^|\.)(goo\.gl|app\.goo\.gl)$/.test(host) || /^maps\.app\.goo\.gl$/.test(host)) return { error: 'corto' };
    var m = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/.exec(todo);          // punto de un lugar de Google Maps
    if (m) return ajustar(m[1], m[2]);
    var claves = ['q', 'query', 'll', 'sll', 'center', 'destination', 'daddr', 'saddr', 'mlat'];
    for (var i = 0; i < claves.length; i++) {
      var v = u.searchParams.get(claves[i]);
      if (claves[i] === 'mlat' && v) return ajustar(v, u.searchParams.get('mlon'));
      var p = v && par(v);
      if (p) return p;
    }
    m = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(todo);                   // centro de la vista de Google Maps
    if (m) return ajustar(m[1], m[2]);
    m = /map=\d+(?:\.\d+)?\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/.exec(todo);  // OpenStreetMap
    if (m) return ajustar(m[1], m[2]);
    return par(u.pathname + ' ' + u.hash);
  }

  var MENSAJES = {
    corto: 'Ese es un enlace corto y no trae las coordenadas. Ábrelo en Google Maps, toca el punto y copia los números que aparecen (por ejemplo «21.44, -99.63»).',
    nada: 'No encontré una ubicación en lo que pegaste. Puede ser un enlace de Google Maps, una ubicación compartida por WhatsApp o dos números como «21.44, -99.63».',
    plus: 'Ese es un código de Google (Plus Code). Ábrelo en Google Maps, toca el punto y copia las coordenadas en números.'
  };

  function leerUbicacion(texto) {
    var s = String(texto || '').trim();
    if (!s) return { error: MENSAJES.nada };
    var enlace = /(https?:\/\/\S+|geo:\S+)/i.exec(s), r = null;
    if (enlace) {
      if (/^geo:/i.test(enlace[1])) r = par(enlace[1].slice(4));
      else r = desdeUrl(enlace[1].replace(/[)\].,;]+$/, ''));
      if (r && r.error) return { error: MENSAJES[r.error] };
    }
    r = r || gms(s) || par(s);
    if (r) return { lat: r.lat, lon: r.lon };
    if (/\b[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}\b/i.test(s)) return { error: MENSAJES.plus };
    return { error: MENSAJES.nada };
  }

  global.leerUbicacion = leerUbicacion;
  if (typeof module !== 'undefined' && module.exports) module.exports = leerUbicacion;
})(typeof window !== 'undefined' ? window : globalThis);
