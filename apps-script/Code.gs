/**
 * Taller de fichas CIDAF — servicio central (Google Apps Script)
 * ---------------------------------------------------------------
 * Hace dos cosas para fichas.html y tablero.html:
 *   1. Guarda el avance y las fichas enviadas en esta Hoja de cálculo.
 *   2. Entrega al tablero el estado de cada integrante (sin contenido de las fichas).
 *
 * No usa servicios de pago. Instalación paso a paso: apps-script/INSTALACION.md
 */

// ---------- Ajustes ----------
const SHEET_ESTADO = 'Estado';       // una fila por integrante (lo que ve el tablero)
const SHEET_ENVIOS = 'Envíos';       // una fila por cada envío (historial completo)

// ---------- Entradas web ----------
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';
  if (action === 'board') return json_({ ok: true, items: board_() });
  return json_({ ok: true, servicio: 'Taller de fichas CIDAF', estado: 'activo' });
}

function doPost(e) {
  let p;
  try { p = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'json' }); }
  try {
    switch (p.action) {
      case 'progress':  upsertEstado_(p, 'borrador'); return json_({ ok: true });
      case 'submit':    logEnvio_(p); upsertEstado_(p, 'enviada'); return json_({ ok: true });
      default:          return json_({ ok: false, error: 'accion' });
    }
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- Hoja de cálculo ----------
function sheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#16263e').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}
const ESTADO_COLS = ['colega', 'nombre', 'correo', 'eje', 'tema', 'titulo', 'avance', 'estado', 'pendientes', 'actualizado'];
const ENVIOS_COLS = ['fecha', 'colega', 'nombre', 'correo', 'eje', 'tema', 'titulo', 'avance', 'pendientes', 'texto', 'json'];

function clip_(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) : s; }

// Todo lo que llega del navegador se guarda como texto. Sin el apóstrofo, la Hoja evaluaría como
// fórmula cualquier valor que empiece con = + - @, y el tablero público devolvería su resultado
// (por ejemplo, el correo de otra fila).
function celda_(s, n) { s = clip_(s, n); return /^[=+\-@\t\r\n]/.test(s) ? "'" + s : s; }

// Identificador de integrante: solo minúsculas, números y guiones, como los ids de taller-datos.js.
function id_(s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60); }

function upsertEstado_(p, estado) {
  const colega = id_(p.colega);
  if (!colega) throw new Error('sin colega');
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sh = sheet_(SHEET_ESTADO, ESTADO_COLS);
    const data = sh.getDataRange().getValues();
    let row = -1;
    for (let i = 1; i < data.length; i++) if (data[i][0] === colega) { row = i + 1; break; }
    // Una ficha ya enviada sigue como «enviada» aunque su autor vuelva a editarla.
    if (row > 0 && estado === 'borrador' && data[row - 1][7] === 'enviada') estado = 'enviada';
    const vals = [colega, celda_(p.nombre, 120), celda_(p.correo, 120), celda_(p.eje, 80), celda_(p.tema, 300),
                  celda_(p.titulo, 300), Number(p.avance) || 0, estado, celda_(p.pendientes, 300), new Date()];
    if (row > 0) sh.getRange(row, 1, 1, vals.length).setValues([vals]); else sh.appendRow(vals);
  } finally { lock.releaseLock(); }
}

function logEnvio_(p) {
  const colega = id_(p.colega);
  if (!colega) throw new Error('sin colega');
  const sh = sheet_(SHEET_ENVIOS, ENVIOS_COLS);
  sh.appendRow([new Date(), colega, celda_(p.nombre, 120), celda_(p.correo, 120), celda_(p.eje, 80), celda_(p.tema, 300),
                celda_(p.titulo, 300), Number(p.avance) || 0, celda_(p.pendientes, 300), celda_(p.texto, 45000), celda_(p.json, 45000)]);
}

function board_() {
  const sh = sheet_(SHEET_ESTADO, ESTADO_COLS);
  const data = sh.getDataRange().getValues();
  // El tablero es público: se omiten correo y contenido de la ficha.
  return data.slice(1).map(r => ({ colega: r[0], nombre: r[1], eje: r[3], tema: r[4], titulo: r[5], avance: r[6],
                                   estado: r[7], pendientes: r[8], actualizado: r[9] instanceof Date ? r[9].toISOString() : r[9] }));
}

// ---------- Desde el editor ----------
/** Crea las hojas vacías con sus encabezados. */
function prepararHojas() {
  sheet_(SHEET_ESTADO, ESTADO_COLS);
  sheet_(SHEET_ENVIOS, ENVIOS_COLS);
}
