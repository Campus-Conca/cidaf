/* actualizar.html: lee un KMZ nuevo en el navegador con kmz.js, muestra el informe y una vista previa,
   y deja descargar zonas.js y lugares.js listos para reemplazar. El archivo no sale de la computadora. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var entrada = $('archivo'), zona = $('soltar'), estado = $('estado');
  var mapa = null, capas = [];
  window.__actualizar = { listo: false };

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function enLinea(s) { return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'); }

  // El informe llega en Markdown (el mismo texto que escribe leer_kmz.py); aquí se pinta como HTML.
  function md(texto) {
    var L = texto.split('\n'), h = '', i = 0;
    while (i < L.length) {
      var l = L[i];
      if (!l.trim()) { i++; continue; }
      var m = /^(#{1,3}) (.*)$/.exec(l);
      if (m) { var n = m[1].length + 1; h += '<h' + n + '>' + enLinea(m[2]) + '</h' + n + '>'; i++; continue; }
      if (/^- /.test(l)) {
        h += '<ul>';
        while (i < L.length && /^- /.test(L[i])) { h += '<li>' + enLinea(L[i].slice(2)) + '</li>'; i++; }
        h += '</ul>';
        continue;
      }
      if (/^\|/.test(l)) {
        var filas = [];
        while (i < L.length && /^\|/.test(L[i])) { filas.push(L[i].replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); })); i++; }
        var der = (filas[1] || []).map(function (c) { return /:$/.test(c); });
        h += '<div class="tabla-caja"><table><thead><tr>' + filas[0].map(function (c, k) { return '<th' + (der[k] ? ' class="d"' : '') + '>' + enLinea(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
        filas.slice(2).forEach(function (f) { h += '<tr>' + f.map(function (c, k) { return '<td' + (der[k] ? ' class="d"' : '') + '>' + enLinea(c) + '</td>'; }).join('') + '</tr>'; });
        h += '</tbody></table></div>';
        continue;
      }
      h += '<p>' + enLinea(l) + '</p>';
      i++;
    }
    return h;
  }

  function boton(nombre, texto, tipo, etiqueta) {
    var a = document.createElement('a');
    a.className = 'btn btn-verde btn-chico';
    a.href = URL.createObjectURL(new Blob([texto], { type: tipo + ';charset=utf-8' }));
    a.download = nombre;
    a.textContent = etiqueta;
    return a;
  }

  function vista(r) {
    if (!window.L) return;
    if (!mapa) {
      mapa = L.map('mapaPrev', { preferCanvas: true }).setView([21.43, -99.6], 10);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, maxNativeZoom: 18, attribution: 'Imagen: Esri, Maxar, Earthstar Geographics' }).addTo(mapa);
    }
    capas.forEach(function (c) { mapa.removeLayer(c); });
    capas = [];
    if (!r.feats.length) return;
    var COLOR = window.PMDU_COLOR || {};
    var zonas = L.geoJSON({ type: 'FeatureCollection', features: r.feats }, {
      style: function (f) {
        var c = f.properties.cve, grande = c === 'ZAM' || c === 'ZN';
        return { color: '#1E2A24', weight: grande ? 0 : 0.8, fillColor: COLOR[c] || '#ff00ff', fillOpacity: grande ? 0.3 : 0.75 };
      },
      onEachFeature: function (f, l) { l.bindTooltip(f.properties.cve + ' · ' + f.properties.ha + ' ha', { sticky: true }); }
    });
    mapa.invalidateSize();
    mapa.fitBounds(zonas.getBounds(), { padding: [10, 10] });
    zonas.addTo(mapa);
    capas.push(zonas);
    if (r.cob) {
      [['hueco', r.cob.huecos, '#B4472E'], ['traslape', r.cob.traslapes, '#7A3FB8']].forEach(function (t) {
        t[1].forEach(function (o) {
          capas.push(L.circleMarker([o.lat, o.lon], { radius: 7, color: '#fff', weight: 2, fillColor: t[2], fillOpacity: 1 })
            .bindTooltip(t[0] + ' de ' + o.m2 + ' m²').addTo(mapa));
        });
      });
    }
  }

  function mostrar(nombre, r, seg) {
    var v = $('veredicto'), d = $('descargas');
    d.innerHTML = '';
    if (r.error) {
      v.className = 'veredicto mal';
      v.innerHTML = 'No se pudo leer el archivo<p>' + esc(r.error) + '</p>';
      $('informe').innerHTML = '';
      $('mapaPrev').hidden = true;
    } else {
      $('mapaPrev').hidden = false;
      if (r.errores.length) {
        v.className = 'veredicto mal';
        v.innerHTML = 'Con errores: no se debe publicar<p>' + r.errores.map(esc).join('<br>') + '</p>';
      } else {
        v.className = 'veredicto bien';
        v.innerHTML = 'Sin errores: se puede publicar<p>' + r.feats.length + ' polígonos · ' + esc(KMZ.pyFixed(r.v.total, 2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')) +
          ' ha · ' + r.lug.length + ' localidades rotuladas · ' + r.avisos.length + ' advertencias para revisar en el informe.</p>';
        d.appendChild(boton('zonas.js', r.zonasJs, 'text/javascript', 'Descargar zonas.js'));
        d.appendChild(boton('lugares.js', r.lugaresJs, 'text/javascript', 'Descargar lugares.js'));
      }
      d.appendChild(boton('reporte_kmz.md', r.reporte, 'text/markdown', 'Descargar el informe'));
      $('informe').innerHTML = md(r.reporte);
    }
    $('resultado').hidden = false;
    if (!r.error) vista(r);
    estado.textContent = '«' + nombre + '» leído en ' + seg + ' s.';
  }

  async function leerArchivo(f) {
    estado.textContent = 'Leyendo «' + f.name + '»…';
    $('resultado').hidden = true;
    window.__actualizar = { listo: false };
    try {
      var bytes = new Uint8Array(await f.arrayBuffer()), t0 = performance.now();
      var r = await KMZ.procesar(f.name, bytes, window.PMDU_ANCLAS || null);
      var seg = ((performance.now() - t0) / 1000).toFixed(1);
      mostrar(f.name, r, seg);
      window.__actualizar = r.error ? { listo: true, error: r.error } : {
        listo: true, reporte: r.reporte, zonasJs: r.zonasJs || null, lugaresJs: r.lugaresJs || null,
        errores: r.errores, avisos: r.avisos, porClave: r.v.filas.map(function (x) { return [x[0], x[2]]; }), segundos: Number(seg) };
    } catch (e) {
      mostrar(f.name, { error: 'Algo falló al leerlo (' + e.message + '). Prueba con otro navegador o avisa a quien mantiene el sitio.' }, '0');
      window.__actualizar = { listo: true, error: e.message };
    }
  }

  entrada.addEventListener('change', function () { if (entrada.files[0]) leerArchivo(entrada.files[0]); });
  ['dragenter', 'dragover'].forEach(function (t) { zona.addEventListener(t, function (e) { e.preventDefault(); zona.classList.add('encima'); }); });
  ['dragleave', 'drop'].forEach(function (t) { zona.addEventListener(t, function (e) { e.preventDefault(); zona.classList.remove('encima'); }); });
  zona.addEventListener('drop', function (e) { var f = e.dataTransfer.files[0]; if (f) leerArchivo(f); });
  // Que soltar el archivo fuera del recuadro no haga que el navegador lo abra.
  window.addEventListener('dragover', function (e) { e.preventDefault(); });
  window.addEventListener('drop', function (e) { e.preventDefault(); });
  if (!window.PMDU_ANCLAS) estado.textContent = 'Falta data/anclas.js: el informe saldrá sin nombres de localidad.';
})();
