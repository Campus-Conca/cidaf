/* Lector de KMZ en el navegador. Hace lo mismo que fuentes/src/leer_kmz.py, sin dependencias:
   abre el .kmz (es un ZIP; se descomprime con DecompressionStream) o el .kml, valida contra la tabla
   publicada, revisa la cobertura, rotula las localidades con sus anclas (data/anclas.js) y arma
   zonas.js, lugares.js y el informe, iguales byte a byte a los que escribe Python.
   Si cambias una regla aquí, cámbiala también en leer_kmz.py: la prueba de paridad lo vigila.
   Uso: KMZ.procesar(nombreDelArchivo, Uint8Array, anclas) -> Promise<resultado> */
(function (global) {
  'use strict';

  // ------------------------------------------------------------ lo que se espera del Programa
  var OFICIAL = {
    'HR,As': 388.32, 'HR,Bj': 27.58, 'HR,Mn': 309.70, 'HM,As': 17.48, 'HM,Bj': 52.42, 'HM,Md': 65.81, 'HM,Mn': 117.17,
    'HMM,As': 43.86, 'HMM,Bj': 89.33, 'HMM,Mn': 12.16, 'CS,As': 39.76, 'CS,Bj': 12.19, 'CS,Md': 1.03, 'CS,Mn': 33.31,
    'E': 126.07, 'I': 4.56, 'PCCA': 34.95, 'ZAM': 66682.22, 'ZN': 5019.51,
    'ECO': null   // la tabla publicada repite la cifra de Equipamiento en el renglón ecoturístico
  };
  var OFICIAL_PRIM = [['Urbano', 1211.76], ['Urbanizable', 149.59], ['No Urbanizable', 71736.68]];
  var OFICIAL_PLAZO = [['Corto', 61.97], ['Mediano', 55.65], ['Largo', 31.98]];
  var TOTAL_MUNICIPAL = 73098.03, TOL_TOTAL = 0.01, TOL_CLAVE = 0.03;
  var ORDEN_DIBUJO = { ZAM: 0, ZN: 1, PCCA: 2 };
  var CAJA_ESPERADA = [-100.0, 21.1, -99.2, 21.8];
  var CELDA = 2.0, ASTILLA_M2 = 100.0, MAX_RENGLONES = 12;
  var CLAVE_CANON = {};
  Object.keys(OFICIAL).forEach(function (k) { CLAVE_CANON[k.toLowerCase()] = k; });

  function ErrorLectura(msg) { var e = new Error(msg); e.lectura = true; return e; }
  function orden(c) { return Object.prototype.hasOwnProperty.call(ORDEN_DIBUJO, c) ? ORDEN_DIBUJO[c] : 3; }
  function suma(a) { var s = 0.0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }

  // ------------------------------------------------------------ números como los escribe Python
  function pyFixed(x, n) {                      // format(x, '.nf'): redondeo exacto, empates al par
    var a = Math.abs(x), s = a.toFixed(n);
    var y = a * Math.pow(10, n), fr = y - Math.floor(y);
    if (Math.abs(fr - 0.5) < 1e-6) {           // posible empate: mirar la expansión decimal exacta
      var e = a.toFixed(100), p = e.indexOf('.');
      if (/^50*$/.test(e.slice(p + 1 + n))) {
        var t = e.slice(0, p + 1 + n).replace(/\.$/, '');
        if (parseInt(t.charAt(t.length - 1), 10) % 2 === 0) s = t;
      }
    }
    return ((x < 0 || (x === 0 && 1 / x < 0)) ? '-' : '') + s;
  }
  function pyRound(x, n) { return Number(pyFixed(x, n)); }
  function redondeaDecenas(d) {               // round(d, -1) de Python
    if (!isFinite(d)) return d;
    var f = Math.floor(d / 10) * 10;
    if (d - f >= 10) f += 10; else if (d - f < 0) f -= 10;
    var r = d - f;
    if (r < 5) return f;
    if (r > 5) return f + 10;
    return (Math.round(f / 10) % 2 === 0) ? f : f + 10;
  }
  function fmt(x, n) {                         // format(x, ',.nf')
    var s = pyFixed(x, n), neg = s.charAt(0) === '-';
    if (neg) s = s.slice(1);
    var p = s.split('.');
    return (neg ? '-' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (p.length > 1 ? '.' + p[1] : '');
  }
  function signo(x, n) { var s = pyFixed(x, n); return s.charAt(0) === '-' ? s : '+' + s; }
  function g(x) { return String(x); }          // '%g' para los tamaños de celda (2.0 -> 2)
  function pyRepr(x) {                         // repr(float)
    if (x === 0) return (1 / x < 0) ? '-0.0' : '0.0';
    if (!isFinite(x)) return isNaN(x) ? 'NaN' : (x > 0 ? 'Infinity' : '-Infinity');
    var a = Math.abs(x), s;
    if (a >= 1e-4 && a < 1e16) {
      s = String(x);
      return s.indexOf('.') < 0 && s.indexOf('e') < 0 ? s + '.0' : s;
    }
    var m = x.toExponential().split('e'), ex = parseInt(m[1], 10);
    return m[0] + 'e' + (ex < 0 ? '-' : '+') + (Math.abs(ex) < 10 ? '0' : '') + Math.abs(ex);
  }
  function pyDumps(v) {                        // json.dumps(v, ensure_ascii=False, separators=(',', ':'))
    if (v === null || v === undefined) return 'null';
    if (typeof v === 'number') return pyRepr(v);
    if (typeof v === 'string') return JSON.stringify(v);
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (Array.isArray(v)) return '[' + v.map(pyDumps).join(',') + ']';
    return '{' + Object.keys(v).map(function (k) { return JSON.stringify(k) + ':' + pyDumps(v[k]); }).join(',') + '}';
  }
  function pyFloorDiv(v, w) {                  // v // w con flotantes, como CPython
    var mod = v % w, div = (v - mod) / w;
    if (mod) { if ((w < 0) !== (mod < 0)) { div -= 1.0; } }
    if (div) { var fl = Math.floor(div); if (div - fl > 0.5) fl += 1.0; return fl; }
    return 0 * (v / w);
  }
  function pyFloat(s) {
    if (/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) return parseFloat(s);
    var m = /^([+-]?)(inf|infinity|nan)$/i.exec(s);
    if (m) return /nan/i.test(m[2]) ? NaN : (m[1] === '-' ? -Infinity : Infinity);
    return null;
  }
  function comparaTuplas(a, b) {
    for (var i = 0; i < a.length; i++) {
      if (a[i] < b[i]) return -1;
      if (a[i] > b[i]) return 1;
    }
    return 0;
  }

  // ------------------------------------------------------------ proyección UTM 14N (WGS84)
  var DEG = Math.PI / 180, RAD = 180 / Math.PI;
  var A_ = 6378137.0, F_ = 1 / 298.257223563, K0 = 0.9996, E0 = 500000.0, LON0 = -99.0 * DEG;
  var N_ = F_ / (2 - F_);
  var AA = A_ / (1 + N_) * (1 + Math.pow(N_, 2) / 4 + Math.pow(N_, 4) / 64);
  var AL = [N_ / 2 - 2 * Math.pow(N_, 2) / 3 + 5 * Math.pow(N_, 3) / 16, 13 * Math.pow(N_, 2) / 48 - 3 * Math.pow(N_, 3) / 5, 61 * Math.pow(N_, 3) / 240];
  var BE = [N_ / 2 - 2 * Math.pow(N_, 2) / 3 + 37 * Math.pow(N_, 3) / 96, Math.pow(N_, 2) / 48 + Math.pow(N_, 3) / 15, 17 * Math.pow(N_, 3) / 480];
  var DE = [2 * N_ - 2 * Math.pow(N_, 2) / 3 - 2 * Math.pow(N_, 3), 7 * Math.pow(N_, 2) / 3 - 8 * Math.pow(N_, 3) / 5, 56 * Math.pow(N_, 3) / 15];
  var C_ = 2 * Math.sqrt(N_) / (1 + N_);

  function utm14(lon, lat) {
    var phi = lat * DEG, lam = lon * DEG - LON0;
    var t = Math.sinh(Math.atanh(Math.sin(phi)) - C_ * Math.atanh(C_ * Math.sin(phi)));
    var xi = Math.atan2(t, Math.cos(lam));
    var eta = Math.atanh(Math.sin(lam) / Math.sqrt(1 + t * t));
    var se = 0.0, sn = 0.0;
    for (var j = 0; j < 3; j++) {
      var k = 2 * (j + 1);
      se += AL[j] * Math.cos(k * xi) * Math.sinh(k * eta);
      sn += AL[j] * Math.sin(k * xi) * Math.cosh(k * eta);
    }
    return [E0 + K0 * AA * (eta + se), K0 * AA * (xi + sn)];
  }
  function utm14Inv(E, N) {
    var xi = N / (K0 * AA), eta = (E - E0) / (K0 * AA), sx = 0.0, sy = 0.0;
    for (var j = 0; j < 3; j++) {
      var k = 2 * (j + 1);
      sx += BE[j] * Math.sin(k * xi) * Math.cosh(k * eta);
      sy += BE[j] * Math.cos(k * xi) * Math.sinh(k * eta);
    }
    var xi2 = xi - sx, eta2 = eta - sy;
    var chi = Math.asin(Math.sin(xi2) / Math.cosh(eta2)), sp = 0.0;
    for (j = 0; j < 3; j++) sp += DE[j] * Math.sin(2 * (j + 1) * chi);
    return [(LON0 + Math.atan2(Math.sinh(eta2), Math.cos(xi2))) * RAD, (chi + sp) * RAD];
  }
  function areaAnilloM2(anillo) {
    var pts = anillo.map(function (p) { return utm14(p[0], p[1]); }), s = 0.0;
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i], b = pts[(i + 1) % pts.length];
      s += a[0] * b[1] - b[0] * a[1];
    }
    return Math.abs(s) / 2;
  }

  // ------------------------------------------------------------ abrir el archivo
  var DANADO = 'El KMZ está dañado o incompleto y no se puede abrir. Vuelve a descargarlo o pide otra copia.';

  function base(n) { return n.split('/').pop(); }

  function entradasZip(b) {
    var dv = new DataView(b.buffer, b.byteOffset, b.byteLength), fin = -1;
    for (var i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { fin = i; break; }
    }
    if (fin < 0) throw ErrorLectura(DANADO);
    var n = dv.getUint16(fin + 10, true), p = dv.getUint32(fin + 16, true), out = [];
    for (var k = 0; k < n; k++) {
      if (p + 46 > b.length || dv.getUint32(p, true) !== 0x02014b50) throw ErrorLectura(DANADO);
      var ln = dv.getUint16(p + 28, true), le = dv.getUint16(p + 30, true), lc = dv.getUint16(p + 32, true);
      out.push({ nombre: new TextDecoder('utf-8').decode(b.subarray(p + 46, p + 46 + ln)), metodo: dv.getUint16(p + 10, true),
                 csize: dv.getUint32(p + 20, true), off: dv.getUint32(p + 42, true) });
      p += 46 + ln + le + lc;
    }
    return out;
  }
  async function datosZip(b, e) {
    var dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    if (e.off + 30 > b.length || dv.getUint32(e.off, true) !== 0x04034b50) throw ErrorLectura(DANADO);
    var ini = e.off + 30 + dv.getUint16(e.off + 26, true) + dv.getUint16(e.off + 28, true);
    var comp = b.subarray(ini, ini + e.csize);
    if (e.metodo === 0) return comp;
    if (e.metodo !== 8) throw ErrorLectura('El KMZ usa una compresión que este lector no conoce. Vuelve a exportarlo desde Google Earth, ArcGIS o QGIS.');
    if (typeof DecompressionStream === 'undefined') {
      throw ErrorLectura('Este navegador no sabe abrir archivos KMZ. Usa Chrome, Edge, Firefox o Safari recientes, o descomprime el KMZ y arrastra aquí su doc.kml.');
    }
    try {
      var s = new Blob([comp]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return new Uint8Array(await new Response(s).arrayBuffer());
    } catch (err) { throw ErrorLectura(DANADO); }
  }
  async function archivosKml(nombre, b) {
    if (b[0] === 0x50 && b[1] === 0x4B) {
      var ents = entradasZip(b).filter(function (e) { return /\.kml$/i.test(e.nombre); });
      if (!ents.length) throw ErrorLectura('El KMZ no trae ningún archivo .kml adentro. ¿Seguro que es la capa de zonificación exportada desde Google Earth, ArcGIS o QGIS?');
      ents.sort(function (x, y) {
        var dx = base(x.nombre).toLowerCase() !== 'doc.kml', dy = base(y.nombre).toLowerCase() !== 'doc.kml';
        if (dx !== dy) return dx ? 1 : -1;
        return x.nombre < y.nombre ? -1 : x.nombre > y.nombre ? 1 : 0;
      });
      var out = [];
      for (var i = 0; i < ents.length; i++) out.push([ents[i].nombre, await datosZip(b, ents[i])]);
      return out;
    }
    if (/\.kmz$/i.test(nombre)) throw ErrorLectura('El archivo termina en .kmz pero por dentro no lo es (un KMZ es un ZIP). Puede estar dañado: vuelve a descargarlo.');
    return [[base(nombre), b]];
  }

  // ------------------------------------------------------------ XML sin espacios de nombres
  var UTF8 = ['utf-8', 'utf8', 'us-ascii', 'ascii'];

  function latin1(b) { var s = ''; for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return s; }
  function xml(texto) {
    var d = new DOMParser().parseFromString(texto.replace(/^\s*<\?xml[^>]*\?>/, ''), 'application/xml');
    var err = d.getElementsByTagName('parsererror');
    if (err.length) throw new Error(err[0].textContent.replace(/\s+/g, ' ').trim());
    return d;
  }
  function parsear(datos, nombre) {
    var avisos = [], cod, doc = null, detalle = '';
    var u8 = datos[0] === 0xEF && datos[1] === 0xBB && datos[2] === 0xBF;
    var le = datos[0] === 0xFF && datos[1] === 0xFE, be = datos[0] === 0xFE && datos[1] === 0xFF;
    var m = /^\s*<\?xml[^>]*?encoding\s*=\s*["']([A-Za-z0-9._:-]+)["']/i.exec(latin1(datos.subarray(0, 300)));
    cod = u8 ? 'utf-8' : (le || be) ? 'utf-16' : (m ? m[1].toLowerCase() : 'utf-8');
    try {
      var etq = le ? 'utf-16le' : be ? 'utf-16be' : u8 ? 'utf-8' : cod;
      doc = xml(new TextDecoder(etq, { fatal: true }).decode(datos));
    } catch (e) { doc = null; detalle = e.message; }
    if (!doc && !(le || be)) {
      var indef = false;
      for (var i = 0; i < datos.length && !indef; i++) indef = [0x81, 0x8D, 0x8F, 0x90, 0x9D].indexOf(datos[i]) >= 0;
      try { doc = xml(new TextDecoder('windows-1252').decode(datos)); } catch (e) { doc = null; }
      if (doc) {
        avisos.push('«' + nombre + '» no venía en UTF-8: se leyó como ' + (indef ? 'latín-1' : 'Windows-1252 (latín)') + '. Revisa que los nombres con acento se vean bien.');
        cod = indef ? 'latin-1' : 'cp1252';
      }
    }
    if (!doc) {
      throw ErrorLectura('«' + nombre + '» no se puede leer como KML: el texto está cortado o no es XML (detalle técnico: ' + detalle + '). Vuelve a exportar la capa o pide otra copia del archivo.');
    }
    if (UTF8.indexOf(cod) < 0 && !avisos.length) avisos.push('«' + nombre + '» viene en ' + cod.toUpperCase() + ', no en UTF-8. Se leyó bien; si ves letras raras en los nombres, avisa.');
    return { doc: doc, avisos: avisos };
  }
  function texto(el) {                         // como .text de ElementTree: lo que va antes del primer hijo
    var s = '';
    for (var c = el.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 1) break;
      if (c.nodeType === 3 || c.nodeType === 4) s += c.nodeValue;
    }
    return s;
  }
  function hijos(el, n) { var r = []; for (var c = el.firstElementChild; c; c = c.nextElementSibling) if (c.localName === n) r.push(c); return r; }
  function ruta(el, partes) { var nivel = [el]; partes.forEach(function (p) { var s = []; nivel.forEach(function (x) { s = s.concat(hijos(x, p)); }); nivel = s; }); return nivel; }
  function todos(el, n) { return Array.prototype.slice.call(el.getElementsByTagNameNS('*', n)); }
  function desescapar(s) { var t = document.createElement('textarea'); t.innerHTML = s; return t.value; }

  var CELDAS = /<t[dh][^>]*>\s*([^<]*?)\s*<\/t[dh]>\s*<t[dh][^>]*>\s*([^<]*?)\s*<\/t[dh]>/gi;
  function atributos(pm) {
    var d = {};
    todos(pm, 'Data').forEach(function (x) { var v = hijos(x, 'value')[0]; d[x.getAttribute('name')] = v ? texto(v).trim() : ''; });
    todos(pm, 'SimpleData').forEach(function (x) { d[x.getAttribute('name')] = texto(x).trim(); });
    if (!Object.prototype.hasOwnProperty.call(d, 'cve_z_sec')) {
      var de = hijos(pm, 'description')[0];
      if (de && texto(de)) {
        var h = desescapar(texto(de)), m;
        CELDAS.lastIndex = 0;
        while ((m = CELDAS.exec(h))) { var k = m[1].trim(); if (!Object.prototype.hasOwnProperty.call(d, k)) d[k] = m[2].trim(); }
      }
    }
    return d;
  }
  function anillo(el, cuenta) {
    var pts = [], limpio = [];
    texto(el).replace(/\s*,\s*/g, ',').split(/\s+/).forEach(function (tok) {
      if (!tok) return;
      var p = tok.split(',');
      if (p.length < 2) return;
      var x = pyFloat(p[0]), y = pyFloat(p[1]);
      if (x === null || y === null || !isFinite(x) || !isFinite(y)) { cuenta.ilegibles++; return; }
      pts.push([pyRound(x, 7), pyRound(y, 7)]);
    });
    pts.forEach(function (p) { var u = limpio[limpio.length - 1]; if (!u || u[0] !== p[0] || u[1] !== p[1]) limpio.push(p); });
    if (limpio.length && (limpio[0][0] !== limpio[limpio.length - 1][0] || limpio[0][1] !== limpio[limpio.length - 1][1])) {
      limpio.push(limpio[0]);
      cuenta.sin_cerrar++;
    }
    return limpio;
  }
  function estilos(doc) {
    var out = {};
    todos(doc, 'Style').forEach(function (st) {
      var c = ruta(st, ['PolyStyle', 'color'])[0], t = c ? texto(c).trim() : '';
      if (t.length === 8) out[st.getAttribute('id')] = '#' + t.slice(6, 8) + t.slice(4, 6) + t.slice(2, 4);
    });
    return out;
  }
  function normClave(c) { c = (c || '').replace(/\s+/g, ''); return CLAVE_CANON[c.toLowerCase()] || c; }

  function ejemplo(pts) { return fmt(pts[0][0], 2) + ', ' + fmt(pts[0][1], 2); }
  function revisarCoordenadas(pts) {
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    pts.forEach(function (p) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    var c = CAJA_ESPERADA;
    if (c[1] < x0 && x1 < c[3] && c[0] < y0 && y1 < c[2]) {
      return 'La longitud y la latitud vienen al revés (por ejemplo ' + ejemplo(pts) + '): cada punto debe ir como «longitud,latitud». Vuelve a exportar la capa desde el programa original.';
    }
    if (x0 < -180 || x1 > 180 || y0 < -90 || y1 > 90) {
      return 'Las coordenadas están en metros (por ejemplo ' + ejemplo(pts) + ') y no en grados de longitud y latitud. Vuelve a exportar la capa en WGS 84 (EPSG:4326): en ArcGIS, la herramienta «Capa a KML» lo hace sola; en QGIS, «Exportar → Guardar objetos como…», formato KML, SRC EPSG:4326.';
    }
    if (!(c[0] < x0 && x1 < c[2] && c[1] < y0 && y1 < c[3])) {
      return 'Las coordenadas caen fuera de Arroyo Seco (de ' + pyFixed(x0, 4) + ', ' + pyFixed(y0, 4) + ' a ' + pyFixed(x1, 4) + ', ' + pyFixed(y1, 4) + '). ¿Es la capa de otro municipio o viene en otra proyección? Debe ser la zonificación de Arroyo Seco en longitud y latitud WGS 84.';
    }
    return null;
  }

  function leer(archivos) {
    var feats = [], avisos = [], errores = [], cuenta = { sin_cerrar: 0, ilegibles: 0 }, capas = [];
    archivos.forEach(function (a) {
      var px = parsear(a[1], a[0]);
      avisos = avisos.concat(px.avisos);
      var est = estilos(px.doc), regs = [];
      todos(px.doc, 'Placemark').forEach(function (pm, i) {
        var crudos = [];
        todos(pm, 'Polygon').forEach(function (pg) {
          var ext = ruta(pg, ['outerBoundaryIs', 'LinearRing', 'coordinates'])[0];
          if (!ext) return;
          var huecos = ruta(pg, ['innerBoundaryIs', 'LinearRing', 'coordinates']).map(function (h) { return anillo(h, cuenta); });
          crudos.push([anillo(ext, cuenta), huecos]);
        });
        if (crudos.length) {
          var su = hijos(pm, 'styleUrl')[0];
          regs.push([i, atributos(pm), su ? texto(su).replace(/^#+/, '') : '', crudos]);
        }
      });
      capas.push({ nombre: a[0], est: est, regs: regs, zonas: regs.filter(function (r) { return normClave(r[1].cve_z_sec); }).length });
    });
    var conZonas = capas.filter(function (c) { return c.zonas; });
    var usar = conZonas.length ? conZonas : capas.filter(function (c) { return c.regs.length; });
    capas.forEach(function (c) {
      if (c.regs.length && usar.indexOf(c) < 0) avisos.push('Se ignoró «' + c.nombre + '»: trae ' + c.regs.length + ' polígonos, pero ninguno con clave de zona.');
    });
    if (conZonas.length > 1) {
      avisos.push('El KMZ trae ' + conZonas.length + ' capas con zonas (' + conZonas.map(function (c) { return c.nombre + ': ' + c.zonas; }).join(', ') + '): se leyeron juntas. Si una es copia de otra, la superficie total lo delata.');
    }
    var nombre = usar.map(function (c) { return c.nombre; }).join(' + ') || (capas.length ? capas[0].nombre : '');
    var pts = [];
    usar.forEach(function (c) { c.regs.forEach(function (r) { r[3].forEach(function (pp) { pp[0].forEach(function (p) { pts.push(p); }); }); }); });
    if (!pts.length) {
      errores.push('No se leyó ningún polígono. ¿Es la capa de zonificación? Debe traer polígonos con la clave de zona (cve_z_sec).');
      return { feats: feats, avisos: avisos, errores: errores, nombre: nombre };
    }
    var problema = revisarCoordenadas(pts);
    if (problema) { errores.push(problema); return { feats: feats, avisos: avisos, errores: errores, nombre: nombre }; }
    var descartados = 0;
    usar.forEach(function (c) {
      c.regs.forEach(function (r) {
        var i = r[0], at = r[1], su = r[2], clave = normClave(at.cve_z_sec), polis = [], m2 = 0.0;
        r[3].forEach(function (pp) {
          var fuera = pp[0];
          if (fuera.length < 4 || areaAnilloM2(fuera) < 0.5) { descartados++; return; }
          var hs = pp[1].filter(function (h) { return h.length >= 4 && areaAnilloM2(h) >= 0.5; });
          m2 += areaAnilloM2(fuera) - suma(hs.map(areaAnilloM2));
          polis.push([fuera].concat(hs));
        });
        if (!polis.length) return;
        var ref = at.OBJECTID_1 || String(i);
        if (!clave) { errores.push('El polígono ' + ref + ' no trae clave de zona (cve_z_sec). Complétala en el archivo de origen.'); return; }
        if (!Object.prototype.hasOwnProperty.call(OFICIAL, clave)) {
          errores.push('Clave desconocida «' + clave + '» en el polígono ' + ref + ': no está en la tabla del Programa. Si es un error de captura, corrígelo en el archivo de origen; si es una clave nueva, hay que añadirla a la tabla oficial (leer_kmz.py, kmz.js y pmdu-data.js).');
        }
        var val = function (k) { return Object.prototype.hasOwnProperty.call(at, k) ? at[k] : ''; };
        feats.push({ type: 'Feature', properties: {
          id: ref, cve: clave, desc: val('desc_z_sec'), prim: val('desc_z_pri'), cprim: val('cve_z_prim'), plazo: val('plazo_crec'),
          ha_attr: val('Shape_Area'), ha: pyRound(m2 / 1e4, 3), kcolor: Object.prototype.hasOwnProperty.call(c.est, su) ? c.est[su] : null },
          geometry: polis.length > 1 ? { type: 'MultiPolygon', coordinates: polis } : { type: 'Polygon', coordinates: polis[0] } });
      });
    });
    if (descartados) avisos.push(descartados + ' anillos degenerados (menos de 4 puntos o sin superficie) se descartaron.');
    if (cuenta.sin_cerrar) avisos.push(cuenta.sin_cerrar + ' anillos venían sin cerrar: se cerraron con su primer punto.');
    if (cuenta.ilegibles) avisos.push(cuenta.ilegibles + ' coordenadas ilegibles se saltaron. Revisa el archivo de origen.');
    if (!feats.length && !errores.length) errores.push('No quedó ningún polígono con superficie. Revisa que la capa sea la de zonificación.');
    return { feats: feats, avisos: avisos, errores: errores, nombre: nombre };
  }

  // ------------------------------------------------------------ validación
  function polis(f) { return f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates]; }

  function validar(feats, avisos, errores) {
    var porClave = new Map(), prim = {}, plazo = {}, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, nv = 0;
    feats.forEach(function (f) {
      var p = f.properties;
      if (!porClave.has(p.cve)) porClave.set(p.cve, [0, 0.0]);
      var pc = porClave.get(p.cve); pc[0] += 1; pc[1] += p.ha;
      prim[p.prim] = (prim[p.prim] || 0.0) + p.ha;
      if (p.plazo) plazo[p.plazo] = (plazo[p.plazo] || 0.0) + p.ha;
      polis(f).forEach(function (po) {
        po.forEach(function (rg) { nv += rg.length; });
        po[0].forEach(function (c) { x0 = Math.min(x0, c[0]); x1 = Math.max(x1, c[0]); y0 = Math.min(y0, c[1]); y1 = Math.max(y1, c[1]); });
      });
    });
    var total = suma(Array.from(porClave.values()).map(function (v) { return v[1]; }));
    if (Math.abs(total - TOTAL_MUNICIPAL) / TOTAL_MUNICIPAL > TOL_TOTAL) {
      errores.push('La superficie total es ' + fmt(total, 2) + ' ha y la del municipio es ' + fmt(TOTAL_MUNICIPAL, 2) + ' ha (se admite 1 %). Falta o sobra territorio: ¿está completa la capa? ¿Viene repetida alguna parte?');
    }
    var claves = Object.keys(OFICIAL);
    porClave.forEach(function (v, k) { if (claves.indexOf(k) < 0) claves.push(k); });
    claves.sort(function (a, b) { return comparaTuplas([orden(a), a], [orden(b), b]); });
    var filas = claves.map(function (c) {
      var v = porClave.get(c) || [0, 0.0], of = Object.prototype.hasOwnProperty.call(OFICIAL, c) ? OFICIAL[c] : null;
      var dif = of ? (v[1] - of) / of * 100 : null;
      if (v[0] === 0) avisos.push('La clave ' + c + ' está en la tabla oficial y no aparece en el archivo.');
      else if (dif !== null && Math.abs(dif) > TOL_CLAVE * 100) avisos.push('Clave ' + c + ': ' + pyFixed(v[1], 2) + ' ha en el archivo y ' + pyFixed(of, 2) + ' ha en la tabla oficial (' + signo(dif, 1) + ' %).');
      return [c, v[0], v[1], of, dif];
    });
    OFICIAL_PRIM.forEach(function (kv) {
      var x = prim[kv[0]] || 0;
      if (Math.abs(x - kv[1]) / kv[1] > TOL_CLAVE) avisos.push('Suelo ' + kv[0].toLowerCase() + ': ' + pyFixed(x, 2) + ' ha en el archivo y ' + pyFixed(kv[1], 2) + ' ha en la tabla oficial.');
    });
    OFICIAL_PLAZO.forEach(function (kv) {
      var x = plazo[kv[0]] || 0;
      if (Math.abs(x - kv[1]) / kv[1] > TOL_CLAVE) avisos.push('Plazo ' + kv[0].toLowerCase() + ': ' + pyFixed(x, 2) + ' ha en el archivo y ' + pyFixed(kv[1], 2) + ' ha en la tabla oficial.');
    });
    return { filas: filas, prim: prim, plazo: plazo, caja: [x0, y0, x1, y1], total: total, vertices: nv };
  }

  // ------------------------------------------------------------ geometría en metros
  function proyectar(feats) {
    return feats.map(function (f) { return polis(f).map(function (po) { return po.map(function (rg) { return rg.map(function (p) { return utm14(p[0], p[1]); }); }); }); });
  }
  function enAnillo(x, y, r) {
    var d = false;
    for (var i = 0, j = r.length - 1; i < r.length; j = i++) {
      var xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) d = !d;
    }
    return d;
  }
  function contiene(partes, x, y) {
    for (var i = 0; i < partes.length; i++) {
      var po = partes[i];
      if (enAnillo(x, y, po[0]) && !po.slice(1).some(function (h) { return enAnillo(x, y, h); })) return true;
    }
    return false;
  }
  function distSegmento(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    var t = L === 0 ? 0.0 : Math.max(0.0, Math.min(1.0, ((px - ax) * dx + (py - ay) * dy) / L));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }
  function distPartes(partes, x, y) {
    if (contiene(partes, x, y)) return 0.0;
    var best = Infinity;
    partes.forEach(function (po) { po.forEach(function (rg) {
      for (var i = 0; i + 1 < rg.length; i++) { var d = distSegmento(x, y, rg[i][0], rg[i][1], rg[i + 1][0], rg[i + 1][1]); if (d < best) best = d; }
    }); });
    return best;
  }

  // ------------------------------------------------------------ localidades
  function gruposUrbanos(feats, dist) {
    dist = dist || 300.0;
    var urb = feats.filter(function (f) { return !Object.prototype.hasOwnProperty.call(ORDEN_DIBUJO, f.properties.cve); });
    var rej = new Map();
    urb.forEach(function (f, i) {
      polis(f).forEach(function (po) {
        var rg = po[0].map(function (p) { return utm14(p[0], p[1]); });
        for (var q = 0; q + 1 < rg.length; q++) {
          var ax = rg[q][0], ay = rg[q][1], bx = rg[q + 1][0], by = rg[q + 1][1];
          var n = Math.max(1, Math.trunc(pyFloorDiv(Math.hypot(bx - ax, by - ay), 50)));
          for (var t = 0; t < n; t++) {
            var x = ax + (bx - ax) * t / n, y = ay + (by - ay) * t / n;
            var k = Math.trunc(pyFloorDiv(x, dist)) + ',' + Math.trunc(pyFloorDiv(y, dist));
            if (!rej.has(k)) rej.set(k, []);
            rej.get(k).push([x, y, i]);
          }
        }
      });
    });
    var padre = urb.map(function (_, i) { return i; });
    function raiz(a) { while (padre[a] !== a) { padre[a] = padre[padre[a]]; a = padre[a]; } return a; }
    var d2 = dist * dist;
    rej.forEach(function (pts, k) {
      var cx = parseInt(k.split(',')[0], 10), cy = parseInt(k.split(',')[1], 10), vecinos = [];
      [-1, 0, 1].forEach(function (dx) { [-1, 0, 1].forEach(function (dy) { var v = rej.get((cx + dx) + ',' + (cy + dy)); if (v) vecinos = vecinos.concat(v); }); });
      pts.forEach(function (p) {
        vecinos.forEach(function (q) {
          if (p[2] !== q[2] && raiz(p[2]) !== raiz(q[2]) && (p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]) < d2) padre[raiz(p[2])] = raiz(q[2]);
        });
      });
    });
    var gs = new Map();
    urb.forEach(function (_, i) { var r = raiz(i); if (!gs.has(r)) gs.set(r, []); gs.get(r).push(i); });
    var out = [];
    gs.forEach(function (idx) {
      var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      idx.forEach(function (i) { polis(urb[i]).forEach(function (po) { po[0].forEach(function (c) { x0 = Math.min(x0, c[0]); x1 = Math.max(x1, c[0]); y0 = Math.min(y0, c[1]); y1 = Math.max(y1, c[1]); }); }); });
      var caja = [pyRound(x0, 5), pyRound(y0, 5), pyRound(x1, 5), pyRound(y1, 5)];
      out.push({ b: caja, c: [pyRound((caja[0] + caja[2]) / 2, 5), pyRound((caja[1] + caja[3]) / 2, 5)],
                 ha: pyRound(suma(idx.map(function (i) { return urb[i].properties.ha; })), 1), n: idx.length, m: idx });
    });
    return out.sort(function (a, b) { return b.ha - a.ha; });
  }

  function nombrar(grupos, avisos, feats, anclas) {
    if (!anclas) { avisos.push('No existe fuentes/datos/localidades.csv: el mapa quedará sin nombres de localidad.'); return { lug: [], tabla: [] }; }
    var urb = feats.filter(function (f) { return !Object.prototype.hasOwnProperty.call(ORDEN_DIBUJO, f.properties.cve); });
    var urbM = proyectar(urb);
    var cajas = grupos.map(function (g) { var a = utm14(g.b[0], g.b[1]), b = utm14(g.b[2], g.b[3]); return [a[0], a[1], b[0], b[1]]; });
    var lug = [], tabla = [], usados = {};
    anclas.forEach(function (r) {
      var e = utm14(parseFloat(r.lon), parseFloat(r.lat)), ex = e[0], ey = e[1], cand = [];
      grupos.forEach(function (g, i) {
        var c = cajas[i], dc = Math.hypot(Math.max(c[0] - ex, 0, ex - c[2]), Math.max(c[1] - ey, 0, ey - c[3]));
        if (dc > 600) return;
        var partes = [];
        g.m.forEach(function (k) { urbM[k].forEach(function (po) { partes.push(po); }); });
        var d = urbM.length ? distPartes(partes, ex, ey) : dc;
        cand.push([redondeaDecenas(d), -g.ha, i, d]);
      });
      cand.sort(comparaTuplas);
      if (!cand.length || cand[0][3] > 600) { avisos.push('Localidad «' + r.nombre + '»: no hay zona urbana a menos de 600 m de su ancla. No se rotula.'); return; }
      var i = cand[0][2];
      if (Object.prototype.hasOwnProperty.call(usados, i)) { avisos.push('Localidad «' + r.nombre + '»: cae en el mismo grupo urbano que «' + usados[i] + '». Se conserva el primer nombre.'); return; }
      usados[i] = r.nombre;
      var g = grupos[i];
      var item = { n: r.nombre, c: g.c, b: g.b, d: r.delegacion || null, a: (r.areas || '').split('|').filter(function (a) { return a; }) };
      if (r.etiqueta_lon && r.etiqueta_lat) item.e = [parseFloat(r.etiqueta_lon), parseFloat(r.etiqueta_lat)];
      if (urb.length) {                        // qué zonas tiene la localidad (para la lista sin mapa)
        var comp = new Map();
        g.m.forEach(function (k) { var p = urb[k].properties; comp.set(p.cve, (comp.get(p.cve) || 0.0) + p.ha); });
        item.z = Array.from(comp.entries()).sort(function (a, b) { return comparaTuplas([-a[1], a[0]], [-b[1], b[0]]); })
          .map(function (t) { return [t[0], pyRound(t[1], 1)]; });
      }
      lug.push(item);
      tabla.push({ n: r.nombre, d: r.delegacion || '', ha: g.ha, f: r.fuente || 'sin fuente anotada' });
    });
    grupos.forEach(function (g, i) {
      if (!Object.prototype.hasOwnProperty.call(usados, i) && g.ha >= 3) avisos.push('Grupo urbano sin nombre: ' + pyFixed(g.ha, 1) + ' ha cerca de ' + pyFixed(g.c[1], 5) + ', ' + pyFixed(g.c[0], 5) + '.');
    });
    return { lug: lug, tabla: tabla };
  }

  function cercaDe(lon, lat, lug) {
    var e = utm14(lon, lat), mejor = null;
    lug.forEach(function (l) {
      var a = utm14(l.b[0], l.b[1]), b = utm14(l.b[2], l.b[3]);
      var d = Math.hypot(Math.max(a[0] - e[0], 0, e[0] - b[0]), Math.max(a[1] - e[1], 0, e[1] - b[1]));
      if (d <= 2000 && (mejor === null || d < mejor[0])) mejor = [d, l.n];
    });
    return mejor ? mejor[1] : '—';
  }

  // ------------------------------------------------------------ cobertura
  function cobertura(feats, celda, proy) {
    celda = celda || CELDA;
    proy = proy || proyectar(feats);
    var mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
    proy.forEach(function (f) { f.forEach(function (po) { po[0].forEach(function (p) { mnx = Math.min(mnx, p[0]); mxx = Math.max(mxx, p[0]); mny = Math.min(mny, p[1]); mxy = Math.max(mxy, p[1]); }); }); });
    if (mnx === Infinity) return { celda: celda, huecos: [], traslapes: [] };
    var x0 = Math.floor(mnx / celda) * celda - celda, y0 = Math.floor(mny / celda) * celda - celda;
    var nc = Math.trunc(Math.ceil((mxx - x0) / celda)) + 2, nf = Math.trunc(Math.ceil((mxy - y0) / celda)) + 2;
    var eventos = [];
    for (var r = 0; r < nf; r++) eventos.push([]);
    proy.forEach(function (f) {
      f.forEach(function (po) {
        var cortes = new Map();
        po.forEach(function (rg) {
          for (var i = 0; i + 1 < rg.length; i++) {
            var ax = rg[i][0], ay = rg[i][1], bx = rg[i + 1][0], by = rg[i + 1][1];
            if (ay === by) continue;
            var lo = ay < by ? ay : by, hi = ay < by ? by : ay;
            var r0 = Math.trunc(Math.ceil((lo - y0) / celda - 0.5)), r1 = Math.trunc(Math.ceil((hi - y0) / celda - 0.5));
            for (var rr = r0; rr < r1; rr++) {
              var yc = y0 + (rr + 0.5) * celda;
              if (!cortes.has(rr)) cortes.set(rr, []);
              cortes.get(rr).push(ax + (yc - ay) * (bx - ax) / (by - ay));
            }
          }
        });
        cortes.forEach(function (cx, rr) {
          cx.sort(function (a, b) { return a - b; });
          for (var k = 0; k + 1 < cx.length; k += 2) {
            var c0 = Math.trunc(Math.ceil((cx[k] - x0) / celda - 0.5)), c1 = Math.trunc(Math.ceil((cx[k + 1] - x0) / celda - 0.5)) - 1;
            if (c0 <= c1) { eventos[rr].push([c0, 1]); eventos[rr].push([c1 + 1, -1]); }
          }
        });
      });
    });
    var padre = [], info = [];
    function raiz(a) { while (padre[a] !== a) { padre[a] = padre[padre[a]]; a = padre[a]; } return a; }
    function unir(a, b) { a = raiz(a); b = raiz(b); if (a !== b) padre[Math.max(a, b)] = Math.min(a, b); }
    var previo = { v: [], t: [] };
    for (r = 0; r < nf; r++) {
      var ev = eventos[r].slice().sort(comparaTuplas), tramos = { v: [], t: [] }, cnt = 0, pos = 0, i = 0;
      while (i < ev.length) {
        var c = ev[i][0];
        if (c > pos) { if (cnt === 0) tramos.v.push([pos, c - 1]); else if (cnt >= 2) tramos.t.push([pos, c - 1]); }
        while (i < ev.length && ev[i][0] === c) { cnt += ev[i][1]; i++; }
        pos = c;
      }
      if (pos < nc) tramos[cnt === 0 ? 'v' : 't'].push([pos, nc - 1]);
      var actual = { v: [], t: [] };
      ['v', 't'].forEach(function (tipo) {
        var j = 0, ant = previo[tipo];
        tramos[tipo].forEach(function (ab) {
          var a = ab[0], b = ab[1], k = padre.length;
          padre.push(k); info.push([tipo, r, a, b]); actual[tipo].push([a, b, k]);
          while (j < ant.length && ant[j][1] < a) j++;
          for (var jj = j; jj < ant.length && ant[jj][0] <= b; jj++) unir(k, ant[jj][2]);
        });
      });
      previo = actual;
    }
    var comp = new Map();
    info.forEach(function (x, k) {
      var tipo = x[0], rr = x[1], a = x[2], b = x[3], q = raiz(k);
      if (!comp.has(q)) comp.set(q, { tipo: tipo, celdas: 0, r0: rr, r1: rr, c0: a, c1: b, borde: false, largo: [-1, 0, 0, 0] });
      var cc = comp.get(q);
      cc.celdas += b - a + 1;
      cc.r0 = Math.min(cc.r0, rr); cc.r1 = Math.max(cc.r1, rr); cc.c0 = Math.min(cc.c0, a); cc.c1 = Math.max(cc.c1, b);
      if (rr === 0 || rr === nf - 1 || a === 0 || b === nc - 1) cc.borde = true;
      if (b - a > cc.largo[0]) cc.largo = [b - a, rr, a, b];
    });
    var huecos = [], traslapes = [];
    comp.forEach(function (cc) {
      if (cc.tipo === 'v' && cc.borde) return;
      var rr = cc.largo[1], a = cc.largo[2], b = cc.largo[3];
      var x = x0 + (Math.floor((a + b) / 2) + 0.5) * celda, y = y0 + (rr + 0.5) * celda, ll = utm14Inv(x, y);
      var item = { m2: cc.celdas * celda * celda, ancho: (cc.c1 - cc.c0 + 1) * celda, alto: (cc.r1 - cc.r0 + 1) * celda,
                   lon: pyRound(ll[0], 5), lat: pyRound(ll[1], 5), x: x, y: y };
      if (cc.tipo === 'v') huecos.push(item);
      else {
        item.claves = [];
        proy.forEach(function (f, i) { if (contiene(f, x, y)) item.claves.push(feats[i].properties.cve); });
        item.claves.sort();
        traslapes.push(item);
      }
    });
    var ord = function (a, b) { return comparaTuplas([-a.m2, -a.lat, a.lon], [-b.m2, -b.lat, b.lon]); };
    return { celda: celda, huecos: huecos.sort(ord), traslapes: traslapes.sort(ord) };
  }

  // ------------------------------------------------------------ escritura
  function ligero(feats) {
    var P = { 'Urbano': 'U', 'Urbanizable': 'Z', 'No Urbanizable': 'N' }, Z = { 'Corto': 'C', 'Mediano': 'M', 'Largo': 'L' }, out = [];
    feats.forEach(function (f) {
      var p = f.properties, ps = [];
      polis(f).forEach(function (po) {
        var rs = [];
        po.forEach(function (rg) {
          var o = [];
          rg.forEach(function (pt) { var q = [pyRound(pt[0], 5), pyRound(pt[1], 5)], u = o[o.length - 1]; if (!u || u[0] !== q[0] || u[1] !== q[1]) o.push(q); });
          if (o[0][0] !== o[o.length - 1][0] || o[0][1] !== o[o.length - 1][1]) o.push(o[0]);
          if (o.length >= 4) rs.push(o);
        });
        if (rs.length) ps.push(rs);
      });
      if (ps.length) {
        out.push({ type: 'Feature', properties: { c: p.cve, p: Object.prototype.hasOwnProperty.call(P, p.prim) ? P[p.prim] : 'N', z: Object.prototype.hasOwnProperty.call(Z, p.plazo) ? Z[p.plazo] : '', h: pyRound(p.ha, 2) },
                   geometry: ps.length > 1 ? { type: 'MultiPolygon', coordinates: ps } : { type: 'Polygon', coordinates: ps[0] } });
      }
    });
    return out.sort(function (a, b) { return comparaTuplas([orden(a.properties.c), -a.properties.h], [orden(b.properties.c), -b.properties.h]); });
  }
  function sup(m2) { return m2 < 10000 ? fmt(m2, 0) + ' m²' : fmt(m2 / 1e4, 2) + ' ha'; }

  function informe(nombreArchivo, capa, feats, v, lug, avisos, errores, cob, tablaLoc) {
    var L = ['# Informe de lectura del KMZ', '', '- Archivo: `' + nombreArchivo + '` (capa `' + capa + '`)',
      '- Polígonos leídos: **' + feats.length + '** · vértices: ' + v.vertices,
      '- Superficie total: **' + fmt(v.total, 2) + ' ha** (oficial: ' + fmt(TOTAL_MUNICIPAL, 2) + ' ha)',
      '- Caja geográfica: ' + pyFixed(v.caja[0], 5) + ', ' + pyFixed(v.caja[1], 5) + ' a ' + pyFixed(v.caja[2], 5) + ', ' + pyFixed(v.caja[3], 5),
      '- Localidades rotuladas: ' + lug.length, '',
      '## Resultado', '', (errores.length ? '**Con errores: no se debe publicar.**' : '**Sin errores.**') + ' Advertencias: ' + avisos.length + '.', ''];
    if (errores.length) L = L.concat(['### Errores', ''], errores.map(function (e) { return '- ' + e; }), ['']);
    if (avisos.length) L = L.concat(['### Advertencias', ''], avisos.map(function (a) { return '- ' + a; }), ['']);
    L = L.concat(['## Superficie por clave', '', '| Clave | Polígonos | Archivo (ha) | Oficial (ha) | Diferencia |', '|---|---:|---:|---:|---:|']);
    v.filas.forEach(function (f) { L.push('| ' + f[0] + ' | ' + f[1] + ' | ' + fmt(f[2], 2) + ' | ' + (f[3] ? fmt(f[3], 2) : '—') + ' | ' + (f[4] !== null ? signo(f[4], 1) + ' %' : '—') + ' |'); });
    L = L.concat(['', '## Zonificación primaria', '', '| Suelo | Archivo (ha) | Oficial (ha) |', '|---|---:|---:|']);
    OFICIAL_PRIM.forEach(function (kv) { L.push('| ' + kv[0] + ' | ' + fmt(v.prim[kv[0]] || 0, 2) + ' | ' + fmt(kv[1], 2) + ' |'); });
    L = L.concat(['', '## Plazos de crecimiento', '', '| Plazo | Archivo (ha) | Oficial (ha) |', '|---|---:|---:|']);
    OFICIAL_PLAZO.forEach(function (kv) { L.push('| ' + kv[0] + ' | ' + fmt(v.plazo[kv[0]] || 0, 2) + ' | ' + fmt(kv[1], 2) + ' |'); });
    if (cob) {
      L = L.concat(['', '## Cobertura', '',
        'Se revisó con una cuadrícula de ' + g(cob.celda) + ' m dentro del borde exterior de la zonificación. Un hueco es terreno que no cae en ninguna zona; un traslape, terreno que cae en dos a la vez. Lo que mida menos de ' + sup(ASTILLA_M2) + ' se cuenta como astilla de dibujo, no como faltante. Lo que falte en la orilla del municipio no se distingue de lo que está fuera. Solo se informa: no se corrige.', '']);
      [[cob.huecos, 'Huecos'], [cob.traslapes, 'Traslapes']].forEach(function (le) {
        var lista = le[0], grandes = lista.filter(function (o) { return o.m2 >= ASTILLA_M2; }), chicos = lista.filter(function (o) { return o.m2 < ASTILLA_M2; });
        var txt = grandes.length ? grandes.length + ' de ' + sup(ASTILLA_M2) + ' o más (' + sup(suma(grandes.map(function (o) { return o.m2; }))) + ' en total)' : 'ninguno de ' + sup(ASTILLA_M2) + ' o más';
        if (chicos.length) txt += '; ' + chicos.length + ' ' + (chicos.length === 1 ? 'astilla' : 'astillas') + ' menores (' + sup(suma(chicos.map(function (o) { return o.m2; }))) + ' en total)';
        L.push('- **' + le[1] + ':** ' + txt + '.');
      });
      var filas = cob.huecos.map(function (o) { return ['Hueco', o]; }).concat(cob.traslapes.map(function (o) { return ['Traslape', o]; }));
      filas.sort(function (a, b) { return comparaTuplas([-a[1].m2, a[0]], [-b[1].m2, b[0]]); });
      if (filas.length) {
        L = L.concat(['', '| Qué | Superficie | Tamaño aprox. | Ubicación (lat, lon) | Cerca de | Zonas |', '|---|---:|---|---|---|---|']);
        filas.slice(0, MAX_RENGLONES).forEach(function (t) {
          var o = t[1];
          L.push('| ' + t[0] + ' | ' + sup(o.m2) + ' | ' + g(o.ancho) + ' × ' + g(o.alto) + ' m | ' + pyFixed(o.lat, 5) + ', ' + pyFixed(o.lon, 5) + ' | ' + cercaDe(o.lon, o.lat, lug) + ' | ' + ((o.claves || []).join(' + ') || '—') + ' |');
        });
        if (filas.length > MAX_RENGLONES) L.push('| … | ' + (filas.length - MAX_RENGLONES) + ' más, todos menores | | | | |');
      }
    }
    if (tablaLoc) {
      L = L.concat(['', '## Localidades', '',
        'Cada grupo de zonas urbanas se rotula con la localidad ancla más cercana (`fuentes/datos/localidades.csv`). Los grupos de 3 ha o más que quedan sin nombre aparecen en las advertencias.', '',
        '| Localidad | Delegación | Zona urbana | Fuente |', '|---|---|---:|---|']);
      tablaLoc.forEach(function (t) { L.push('| ' + t.n + ' | ' + (t.d || '—') + ' | ' + fmt(t.ha, 1) + ' ha | ' + t.f + ' |'); });
    }
    return L.join('\n') + '\n';
  }

  // ------------------------------------------------------------ todo junto
  async function procesar(nombreArchivo, bytes, anclas) {
    var r;
    try {
      r = leer(await archivosKml(nombreArchivo, bytes));
    } catch (e) {
      if (e.lectura) return { error: e.message };
      throw e;
    }
    var feats = r.feats, avisos = r.avisos, errores = r.errores;
    var v = feats.length ? validar(feats, avisos, errores) : { filas: [], prim: {}, plazo: {}, caja: [0, 0, 0, 0], total: 0, vertices: 0 };
    var lug = [], tabla = [], cob = null;
    if (feats.length) {
      var nm = nombrar(gruposUrbanos(feats), avisos, feats, anclas);
      lug = nm.lug; tabla = nm.tabla;
      cob = cobertura(feats);
    }
    var reporte = informe(base(nombreArchivo), r.nombre, feats, v, lug, avisos, errores, cob, feats.length ? tabla : null);
    var ordenadas = feats.slice().sort(function (a, b) { return comparaTuplas([orden(a.properties.cve), -a.properties.ha], [orden(b.properties.cve), -b.properties.ha]); });
    var out = { feats: feats, avisos: avisos, errores: errores, nombre: r.nombre, v: v, lug: lug, tabla: tabla, cob: cob, reporte: reporte };
    if (!errores.length) {
      out.zonas = ligero(ordenadas);
      out.zonasJs = 'window.PMDU_ZONAS=' + pyDumps({ type: 'FeatureCollection', features: out.zonas }) + ';';
      out.lugaresJs = 'window.PMDU_LUGARES=' + pyDumps(lug) + ';';
    }
    return out;
  }

  global.KMZ = { procesar: procesar, utm14: utm14, utm14Inv: utm14Inv, pyFixed: pyFixed, pyRepr: pyRepr, CELDA: CELDA, ASTILLA_M2: ASTILLA_M2 };
})(typeof window !== 'undefined' ? window : this);
