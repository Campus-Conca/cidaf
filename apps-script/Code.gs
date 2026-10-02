/**
 * Taller de fichas CIDAF — servicio central (Google Apps Script)
 * ---------------------------------------------------------------
 * Hace tres cosas para fichas.html y tablero.html:
 *   1. Guarda el avance y las fichas enviadas en esta Hoja de cálculo.
 *   2. Entrega al tablero el estado de cada integrante (sin contenido de las fichas).
 *   3. Pide a Claude (API de Anthropic) retroalimentación sobre un campo o la ficha completa.
 *
 * La llave de la API vive en Propiedades del script (ANTHROPIC_API_KEY) y nunca llega
 * al navegador. Instalación paso a paso: apps-script/INSTALACION.md
 */

// ---------- Ajustes ----------
const MODEL = 'claude-sonnet-5';     // modelo acordado para la retroalimentación
const DAILY_LIMIT = 150;             // revisiones con IA por día, para todo el equipo
const MAX_INPUT_CHARS = 14000;       // tope de texto que se envía a Claude por revisión
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
      case 'review':    return json_({ ok: true, review: review_(p) });
      case 'coherence': return json_({ ok: true, review: coherence_(p) });
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

// ---------- Claude ----------
const SYSTEM = [
  'Eres una revisora editorial del Centro de Investigación CIDAF (UAQ Campus Concá) que acompaña a investigadoras e investigadores',
  'a escribir fichas de recomendación de política pública para el municipio de Arroyo Seco, Querétaro, periodo 2027–2030.',
  'El municipio contiene una fracción sustancial de la Reserva de la Biosfera Sierra Gorda; es rural, de alta marginación y con',
  'capacidad administrativa limitada. El documento es apartidista y se entrega a todas las candidaturas.',
  'Principio rector: recomendaciones encarnadas. Solo se propone lo que alguien del campus está dispuesto a acompañar en su implementación.',
  'La ficha tiene 10 campos: título, diagnóstico, objetivo, acciones, área responsable (innegociable), plazo, indicador (innegociable),',
  'costo y financiamiento, marco legal y semáforo.',
  'Tu retroalimentación es para personas expertas en su disciplina pero no necesariamente en política pública municipal, y muy ocupadas:',
  'sé cálida, directa y concreta; nada de jerga innecesaria; responde en español de México.',
  'Señala como máximo tres fortalezas y tres mejoras, las más importantes. Cada punto en una sola oración.',
  'No inventes datos, cifras, fuentes ni artículos de ley: si falta un dato, di qué dato buscar y dónde podría encontrarse.',
  'En la propuesta de redacción conserva el contenido y la voz de la persona; usa marcadores entre corchetes, como [dato], donde falte información.',
  'Veredicto: «listo» si cumple el criterio, «casi» si con ajustes menores queda, «falta trabajo» si le falta una pieza esencial.'
].join(' ');

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    veredicto: { type: 'string', enum: ['listo', 'casi', 'falta trabajo'] },
    fortalezas: { type: 'array', items: { type: 'string' } },
    mejoras: { type: 'array', items: { type: 'string' } },
    propuesta: { type: 'string', description: 'Redacción sugerida del campo; cadena vacía si no hace falta.' }
  },
  required: ['veredicto', 'fortalezas', 'mejoras', 'propuesta'],
  additionalProperties: false
};

const COHERENCE_SCHEMA = {
  type: 'object',
  properties: {
    veredicto: { type: 'string', enum: ['listo', 'casi', 'falta trabajo'] },
    resumen: { type: 'string', description: 'Dos o tres oraciones con la valoración general.' },
    observaciones: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          campo: { type: 'string' },
          observacion: { type: 'string' },
          sugerencia: { type: 'string' }
        },
        required: ['campo', 'observacion', 'sugerencia'],
        additionalProperties: false
      }
    }
  },
  required: ['veredicto', 'resumen', 'observaciones'],
  additionalProperties: false
};

function review_(p) {
  const prompt = [
    'Revisa este campo de una ficha de recomendación.',
    '', 'Campo: ' + clip_(p.campo, 80),
    'Criterio del CIDAF para este campo: ' + clip_(p.criterio, 1500),
    '', 'Contexto de la ficha:', clip_(p.contexto, 2500),
    '', 'Texto del campo:', clip_(p.texto, MAX_INPUT_CHARS)
  ].join('\n');
  return claude_(prompt, REVIEW_SCHEMA, 2500);
}

function coherence_(p) {
  const prompt = [
    'Revisa la coherencia interna de esta ficha completa. Comprueba en particular:',
    '1) que los indicadores midan el objetivo (no solo actividades);',
    '2) que cada acción importante tenga área responsable y un costo o fuente plausible;',
    '3) que el diagnóstico sostenga lo que se propone;',
    '4) que haya algo factible en los primeros 100 días y algo que perdure («Permanente»);',
    '5) que los dos campos innegociables (área responsable con acompañamiento del campus con nombre, e indicador con meta) estén completos;',
    '6) que la ficha quepa idealmente en una página.',
    'Da como máximo seis observaciones, ordenadas de la más a la menos importante. Si algo está bien, no lo menciones como observación.',
    '', 'Ficha:', clip_(p.texto, MAX_INPUT_CHARS)
  ].join('\n');
  return claude_(prompt, COHERENCE_SCHEMA, 4000);
}

function claude_(userText, schema, maxTokens) {
  const key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!key) throw new Error('sin llave');
  countUse_();
  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    system: SYSTEM,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: schema } },
    messages: [{ role: 'user', content: userText }]
  };
  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  const data = JSON.parse(res.getContentText());
  if (code !== 200) throw new Error('api ' + code + ': ' + (data.error && data.error.message || ''));
  if (data.stop_reason === 'refusal') throw new Error('rechazo');
  if (data.stop_reason === 'max_tokens') throw new Error('respuesta incompleta');
  const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
  return JSON.parse(text);
}

function countUse_() {
  const props = PropertiesService.getScriptProperties();
  const k = 'uso_' + Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyy-MM-dd');
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const n = Number(props.getProperty(k) || 0);
    if (n >= DAILY_LIMIT) throw new Error('limite');
    props.setProperty(k, String(n + 1));
  } finally { lock.releaseLock(); }
}

// ---------- Pruebas desde el editor ----------
/** Ejecuta esta función desde el editor para comprobar que la llave y el modelo funcionan. */
function probarClaude() {
  const r = review_({
    campo: '1 · Título',
    criterio: 'Frase breve que nombre el instrumento y el problema.',
    contexto: 'Eje IV. Agua y servicios públicos',
    texto: 'Agua para todos'
  });
  Logger.log(JSON.stringify(r, null, 2));
}

/** Crea las hojas vacías con sus encabezados. */
function prepararHojas() {
  sheet_(SHEET_ESTADO, ESTADO_COLS);
  sheet_(SHEET_ENVIOS, ENVIOS_COLS);
}
