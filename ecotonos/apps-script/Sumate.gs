/**
 * «Yo cuido el valle» — registro y contador del sitio de Ecotonos.
 * Va pegado a una Hoja de Google con una pestaña llamada «sumados»
 * (columnas: fecha, nombre, comunidad, id). El sitio solo recibe de vuelta los totales, nunca los nombres.
 *
 * Para ponerlo a andar:
 *   1. En la Hoja: Extensiones → Apps Script. Pega este archivo completo y guarda.
 *   2. Implementar → Nueva implementación → tipo «Aplicación web».
 *      Ejecutar como: yo.  Quién tiene acceso: cualquier persona.
 *   3. Copia la URL que termina en /exec y pégala en js/config.js del sitio.
 */
var PESTANA = 'sumados';
var COMUNIDADES = ['Concá', 'Las Trancas', 'El Salitrillo', 'El Crucero', 'Mesa de Palo Blanco', 'El Coyote', 'Otro lugar'];

function hoja_() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var h = libro.getSheetByName(PESTANA);
  if (!h) { h = libro.insertSheet(PESTANA); h.appendRow(['fecha', 'nombre', 'comunidad', 'id']); }
  return h;
}

/** Lo que escribe la gente nunca debe evaluarse como fórmula. */
function celda_(v) {
  var s = String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 80);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function totales_() {
  var filas = hoja_().getDataRange().getValues().slice(1);
  var por = {};
  filas.forEach(function (f) { var c = f[2]; if (c) por[c] = (por[c] || 0) + 1; });
  return { ok: true, total: filas.length, por: por };
}

function responde_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() { return responde_(totales_()); }

function doPost(e) {
  var cerrojo = LockService.getScriptLock();
  try {
    cerrojo.waitLock(10000);
    var d = JSON.parse(e.postData.contents || '{}');
    var id = celda_(d.id), comunidad = String(d.comunidad || '');
    if (!id || COMUNIDADES.indexOf(comunidad) < 0) return responde_({ ok: false, error: 'datos' });
    var h = hoja_(), filas = h.getDataRange().getValues();
    var fila = -1;
    for (var i = 1; i < filas.length; i++) if (filas[i][3] === id) { fila = i + 1; break; }
    var nueva = [new Date(), celda_(d.nombre), comunidad, id];
    if (fila > 0) h.getRange(fila, 1, 1, 4).setValues([nueva]); else h.appendRow(nueva);
    return responde_(totales_());
  } catch (err) {
    return responde_({ ok: false, error: 'servidor' });
  } finally {
    try { cerrojo.releaseLock(); } catch (x) {}
  }
}
