/* Ecotonos del valle de Concá — comportamiento compartido por las tres páginas.
   Sin dependencias. Cada bloque revisa si su parte existe en la página antes de actuar. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const P = window.PROPUESTAS || [];
  const PLAYLIST = 'PLyzEvc1MvO1dcazSIlVPvjEUxeZJko2mq';

  /* ── barra superior ── */
  const top = $('.top');
  if (top) {
    const fija = top.hasAttribute('data-solida');
    const pinta = () => top.classList.toggle('solida', fija || window.scrollY > 40);
    pinta(); addEventListener('scroll', pinta, { passive: true });
    const menu = $('.menu', top), nav = $('nav', top);
    if (menu) {
      menu.addEventListener('click', () => { const a = nav.classList.toggle('abierto'); menu.setAttribute('aria-expanded', a); });
      nav.addEventListener('click', e => { if (e.target.closest('a')) nav.classList.remove('abierto'); });
    }
  }

  /* ── aparecer al entrar en pantalla ── */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('ya'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' }) : null;
  const observa = () => $$('.ver:not(.ya)').forEach(el => io ? io.observe(el) : el.classList.add('ya'));

  /* ── cifras que cuentan ── */
  $$('[data-cuenta]').forEach(el => {
    const fin = parseFloat(el.dataset.cuenta), dec = (el.dataset.cuenta.split('.')[1] || '').length;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !io) return;
    const o = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return; o.disconnect(); el.textContent = '0';
      const t0 = performance.now(), dur = 1400;
      const paso = t => { const k = Math.min(1, (t - t0) / dur), v = fin * (1 - Math.pow(1 - k, 3)); el.textContent = v.toFixed(dec); if (k < 1) requestAnimationFrame(paso); };
      requestAnimationFrame(paso);
      setTimeout(() => { el.textContent = fin.toFixed(dec); }, dur + 400); // por si la pestaña está en segundo plano
    });
    o.observe(el);
  });

  /* ── visor de imágenes (una o varias, con zoom) ── */
  let visor, vLista = [], vI = 0;
  function abreVisor(lista, i) {
    if (!visor) {
      visor = document.createElement('div'); visor.className = 'visor'; visor.setAttribute('role', 'dialog'); visor.setAttribute('aria-modal', 'true'); visor.setAttribute('aria-label', 'Imagen ampliada');
      visor.innerHTML = '<div class="barra"><p></p><button data-v="ant" aria-label="Anterior">←</button><button data-v="sig" aria-label="Siguiente">→</button><button data-v="zoom" aria-label="Acercar o alejar">＋</button><button data-v="x" aria-label="Cerrar">✕</button></div><div class="esc"><img alt=""></div>';
      document.body.appendChild(visor);
      visor.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (b) { const v = b.dataset.v; if (v === 'x') cierraVisor(); else if (v === 'zoom') zoom(); else mueve(v === 'sig' ? 1 : -1); return; }
        if (e.target.tagName === 'IMG') zoom(); else if (e.target.classList.contains('esc')) cierraVisor();
      });
      addEventListener('keydown', e => { if (!visor.classList.contains('on')) return; if (e.key === 'Escape') cierraVisor(); if (e.key === 'ArrowRight') mueve(1); if (e.key === 'ArrowLeft') mueve(-1); });
    }
    vLista = lista; vI = i || 0; pintaVisor(); visor.classList.add('on'); document.documentElement.style.overflow = 'hidden'; $('[data-v=x]', visor).focus();
  }
  function pintaVisor() {
    const it = vLista[vI], img = $('img', visor), escn = $('.esc', visor);
    escn.classList.remove('zoom'); img.src = it.src; img.alt = it.cap || '';
    $('p', visor).textContent = it.cap || '';
    $$('[data-v=ant],[data-v=sig]', visor).forEach(b => b.style.display = vLista.length > 1 ? '' : 'none');
  }
  function mueve(d) { if (vLista.length < 2) return; vI = (vI + d + vLista.length) % vLista.length; pintaVisor(); }
  function zoom() { const e = $('.esc', visor); e.classList.toggle('zoom'); if (e.classList.contains('zoom')) { e.scrollLeft = (e.scrollWidth - e.clientWidth) / 2; e.scrollTop = 0; } }
  function cierraVisor() { visor.classList.remove('on'); document.documentElement.style.overflow = ''; }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-ampliar]'); if (!b) return;
    const grupo = b.dataset.grupo;
    const els = grupo ? $$('[data-ampliar][data-grupo="' + grupo + '"]') : [b];
    abreVisor(els.map(x => ({ src: x.dataset.ampliar, cap: x.dataset.cap || '' })), els.indexOf(b));
  });

  /* ── video: no carga YouTube hasta que se pide ── */
  const marco = id => { const f = document.createElement('iframe'); f.src = 'https://www.youtube-nocookie.com/embed/' + (id ? id + '?autoplay=1&rel=0' : 'videoseries?list=' + PLAYLIST + '&autoplay=1&rel=0'); f.title = 'Video del proyecto Ecotonos'; f.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen'; f.allowFullscreen = true; return f; };
  document.addEventListener('click', e => {
    const b = e.target.closest('.video button'); if (b) { b.replaceWith(marco(b.dataset.yt)); return; }
    const l = e.target.closest('.vlista button'); if (!l) return;
    const v = $(l.dataset.en); v.innerHTML = ''; v.appendChild(marco(l.dataset.yt));
    $$('.vlista button').forEach(x => x.setAttribute('aria-pressed', x === l)); v.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });

  $$('[data-reproduce]').forEach(b => b.addEventListener('click', e => { const v = $(b.dataset.reproduce); if (!v) return; e.preventDefault(); v.closest('section').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => v.click(), 450); }));

  /* ── el corte del valle: con ecotonos / sin orden ── */
  const corte = $('.corte-caja');
  if (corte) {
    const bots = $$('.conmuta button', corte), tx = $$('.eco-t', corte), bandas = $$('.banda', corte);
    bots.forEach(b => b.addEventListener('click', () => {
      const sino = b.dataset.estado === 'sino';
      corte.classList.toggle('sino', sino);
      bots.forEach(x => x.setAttribute('aria-pressed', x === b));
    }));
    const caja = $('.corte-scroll', corte), svg = $('svg', corte);
    const elige = (n, mueve) => { tx.forEach(t => t.classList.toggle('on', t.dataset.eco === n)); bandas.forEach(g => g.classList.toggle('on', g.dataset.eco === n));
      if (mueve && caja.scrollWidth > caja.clientWidth) { const b = $('.banda[data-eco="' + n + '"] rect', corte); const cx = (b.x.baseVal.value + b.width.baseVal.value / 2) / 1200 * svg.clientWidth; caja.scrollTo({ left: cx - caja.clientWidth / 2, behavior: 'smooth' }); } };
    tx.forEach(t => { t.addEventListener('click', () => elige(t.dataset.eco, true)); t.addEventListener('mouseenter', () => elige(t.dataset.eco)); });
    bandas.forEach(g => { g.addEventListener('click', () => elige(g.dataset.eco)); g.addEventListener('mouseenter', () => elige(g.dataset.eco)); });
    elige('1');
  }

  /* ── mapa por capas ── */
  const capas = $('.capas');
  if (capas && P.length) {
    const L = $('.capas-l', capas), M = $('.capas-m', capas), Pn = $('.capas-p', capas);
    L.innerHTML = P.map((p, i) => `<button class="capa-b e-${p.eco}" data-i="${i}" aria-pressed="${i === 0}"><i>${i}</i><b>${esc(p.corto)}</b><small>${esc(p.cifra)} ${esc(p.unidad)}</small></button>`).join('');
    M.insertAdjacentHTML('afterbegin', P.map((p, i) => `<img ${i === 0 ? 'src' : 'data-src'}="img/${p.gal[0][0]}.webp" alt="${esc(p.gal[0][1])}" class="${i === 0 ? 'on' : ''}" width="2200" height="853">`).join(''));
    const imgs = $$('img', M), bs = $$('button', L);
    let act = 0;
    const pon = i => {
      act = i; const p = P[i];
      if (imgs[i].dataset.src) { imgs[i].src = imgs[i].dataset.src; delete imgs[i].dataset.src; }
      imgs.forEach((im, k) => im.classList.toggle('on', k === i));
      bs.forEach((b, k) => b.setAttribute('aria-pressed', k === i));
      Pn.className = 'capas-p e-' + p.eco;
      Pn.innerHTML = `<span class="chip">${i === 0 ? 'Propuesta síntesis' : 'Propuesta ' + i + ' · ' + esc(p.ecoN)}</span><div><h3>${esc(p.titulo)}</h3><p>${esc(p.cifra2.charAt(0).toUpperCase() + p.cifra2.slice(1))}. ${esc(p.puntos[0])}.</p></div><a class="btn teal chico" href="${p.slug}.html">Ver la propuesta →</a>`;
    };
    L.addEventListener('click', e => { const b = e.target.closest('button'); if (b) pon(+b.dataset.i); });
    M.addEventListener('click', () => abreVisor(P.map(p => ({ src: 'img/' + p.gal[0][0] + '.webp', cap: p.gal[0][1] })), act));
    pon(0);
    // precarga suave del resto cuando el mapa entra en pantalla
    if (io) { const o = new IntersectionObserver(es => { if (es[0].isIntersecting) { o.disconnect(); imgs.forEach(im => { if (im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; } }); } }, { rootMargin: '300px' }); o.observe(M); }
  }

  /* ── tarjetas de las siete propuestas ── */
  const lista = $('#lista-propuestas');
  if (lista && P.length) {
    const foto = p => p.gal.find(g => !g[2]) || p.gal[0];
    const tarjeta = p => `<a class="prop e-${p.eco} ver" href="${p.slug}.html"><div class="im"><img src="img/${foto(p)[0]}-s.webp" alt="${esc(foto(p)[1])}" loading="lazy"><span class="chip">${esc(p.ecoN)}</span><span class="cf">${esc(p.cifra)}<small>${esc(p.unidad)}</small></span></div><div class="tx"><h4>${esc(p.titulo)}</h4><ul>${p.puntos.map(x => `<li>${esc(x)}</li>`).join('')}</ul><span class="ir">Ver la propuesta →</span></div></a>`;
    const a = P[0];
    const pares = [
      ['agua', 'Ecotonos del agua', 'El río que bordea el valle y los manantiales que lo alimentan: los dos sistemas que hacen posible el riego y la vida.', [1, 2]],
      ['natural', 'Ecotonos rurales', 'Los bordes entre el campo, el cerro y los pueblos: la historia del Camino Real y el anillo verde que contiene el crecimiento.', [3, 6]],
      ['urbano', 'Ecotonos urbanos', 'La carretera que atraviesa el valle y los lugares donde crecerán las casas: ordenar el movimiento y el futuro de los pueblos.', [4, 5]]
    ];
    lista.innerHTML = `<a class="sintesis ver" href="${a.slug}.html"><div class="im"><img src="img/p0-valle-selva.webp" alt="El valle agrícola visto desde la selva baja del cerro" loading="lazy"></div><div class="tx"><span class="chip" style="--c:var(--amber);color:var(--ink)">Propuesta síntesis</span><div class="num" style="margin-top:16px">455<small>hectáreas</small></div><h3>${esc(a.titulo)}</h3><p>${esc(a.resumen)}</p><ul>${a.puntos.map(x => `<li>${esc(x)}</li>`).join('')}</ul><span class="ir">Conocer la propuesta →</span></div></a>` +
      pares.map(([e, t, d, ids]) => `<div class="par e-${e}"><div class="par-t"><h3>${t}</h3><p>${d}</p></div><div class="par-g">${ids.map(i => tarjeta(P[i])).join('')}</div></div>`).join('');
  }

  /* ── pestañas «¿y yo qué puedo hacer?» ── */
  $$('.pest').forEach(pest => {
    const bs = $$('button', pest);
    bs.forEach(b => b.addEventListener('click', () => bs.forEach(x => {
      x.setAttribute('aria-selected', x === b);
      const pn = document.getElementById(x.getAttribute('aria-controls')); if (pn) pn.classList.toggle('on', x === b);
    })));
  });

  /* ── antes y después ── */
  $$('.ad').forEach(ad => { const r = $('input', ad); r.addEventListener('input', () => ad.style.setProperty('--x', r.value + '%')); });

  /* ── tiras que se deslizan: flechas ── */
  $$('[data-mueve]').forEach(b => b.addEventListener('click', () => { const c = $(b.dataset.mueve); c.scrollBy({ left: (b.dataset.dir === 'ant' ? -1 : 1) * c.clientWidth * .8, behavior: 'smooth' }); }));

  /* ── menú: marca la sección visible ── */
  const enl = $$('.top nav a[href^="#"]');
  if (enl.length && io) {
    const o = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) enl.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
    enl.forEach(a => { const s = $(a.getAttribute('href')); if (s) o.observe(s); });
  }

  /* ── página de una propuesta ── */
  const hoja = $('#propuesta');
  if (hoja && P.length) {
    const q = hoja.dataset.p || new URLSearchParams(location.search).get('p') || location.hash.slice(1);
    let i = P.findIndex(p => p.slug === q); if (i < 0) i = 0;
    const p = P[i], ant = P[(i + P.length - 1) % P.length], sig = P[(i + 1) % P.length];
    if (!hoja.dataset.p) document.title = p.titulo + ' · Ecotonos del valle de Concá';
    const md = $('meta[name=description]'); if (md) md.content = p.resumen.slice(0, 180);
    const nn = '0' + i;
    hoja.className = 'e-' + p.eco;
    hoja.innerHTML = `
<header class="p-hero"><div class="wrap">
  <a class="volver" href="propuestas.html#propuestas">← Las siete propuestas</a><br>
  <span class="chip">${esc(p.chip)}</span>
  <h1>${esc(p.titulo)}</h1>
  <p class="res">${esc(p.resumen)}</p>
  <div class="p-cifra"><b>${esc(p.cifra)}</b><span>${esc(p.unidad)}</span><small>${esc(p.cifra2)}</small></div>
  <div class="p-gal"><figure class="gr" id="gr"><img alt=""><span class="lupa">⤢ Ampliar</span><figcaption></figcaption></figure></div>
</div></header>
<div class="tiras"><div class="wrap"><div class="tira" id="tira" aria-label="Imágenes de la propuesta">${p.gal.map((g, k) => `<button data-k="${k}" aria-label="${esc(g[1])}"><img src="img/${g[0]}-s.webp" alt="" loading="lazy"></button>`).join('')}</div></div></div>
<div class="wrap">
  <div class="p-cuerpo">
    <div class="prosa">
      <h2>Descripción</h2>
      <p>${esc(p.desc[0])}</p>${p.desc.length > 1 ? `<details class="mas"><summary>Leer la descripción completa</summary>${p.desc.slice(1).map(x => `<p>${esc(x)}</p>`).join('')}</details>` : ''}
      ${p.nota ? `<p class="nota-pie">${esc(p.nota)}</p>` : ''}
      <div class="fila" style="margin:26px 0 40px">
        <a class="btn teal" href="fichas/P${nn}_ficha.pdf" download>↓ Ficha síntesis (PDF)</a>
        <a class="btn linea" href="mapas/P${nn}_mapa.pdf" download>↓ Mapa (PDF)</a>
      </div>
      <h2>${i === 0 ? 'Cómo se llegó a esta propuesta' : 'La propuesta en video'}</h2>
      <div class="video"><button data-yt="${p.video}" aria-label="Reproducir el video"><img src="img/${(p.gal.find(g => !g[2]) || p.gal[0])[0]}-s.webp" alt="" loading="lazy"><span><i>▶</i>${i === 0 ? 'Ver el resumen de los talleres' : 'Ver el video de la propuesta'}</span></button></div>
      <p class="video-nota">Al reproducir se carga contenido de YouTube. <a href="propuestas.html#videos">Ver todos los videos</a></p>
    </div>
    <aside class="ficha"><h3>Ficha técnica</h3><dl>${p.ficha.map(f => `<dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd>`).join('')}</dl></aside>
  </div>
  <nav class="p-nav" aria-label="Otras propuestas">
    <a href="${ant.slug}.html"><small>← Anterior</small><b>${esc(ant.corto)}</b></a>
    <a href="${sig.slug}.html"><small>Siguiente →</small><b>${esc(sig.corto)}</b></a>
  </nav>
</div>`;
    const gr = $('#gr'), tira = $('#tira'); let k0 = 0;
    const pon = k => { k0 = k; const g = p.gal[k]; $('img', gr).src = 'img/' + g[0] + '.webp'; $('img', gr).alt = g[1]; $('figcaption', gr).textContent = g[1]; gr.classList.toggle('plano', !!g[2]); $$('button', tira).forEach((b, j) => b.setAttribute('aria-current', j === k)); };
    tira.addEventListener('click', e => { const b = e.target.closest('button'); if (b) pon(+b.dataset.k); });
    gr.addEventListener('click', () => abreVisor(p.gal.map(g => ({ src: 'img/' + g[0] + '.webp', cap: g[1] })), k0));
    pon(0);
  }

  /* ── simulador del reporte (no envía nada) ── */
  const sim = $('#simulador');
  if (sim) {
    const form = $('.cu', sim), acuse = $('.acuse', sim), pasos = $$('.seg li', acuse);
    $$('.ops', sim).forEach(g => g.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('button', g).forEach(x => x.setAttribute('aria-pressed', x === b)); }));
    let tm = [];
    $('.env', sim).addEventListener('click', () => {
      form.style.display = 'none'; acuse.classList.add('on');
      $('.folio b', acuse).textContent = 'EJEMPLO-' + String(Math.floor(100 + Math.random() * 900));
      pasos.forEach(l => l.classList.remove('ok'));
      pasos.forEach((l, i) => tm.push(setTimeout(() => { l.classList.add('ok'); $('i', l).textContent = '✓'; }, 500 + i * 1100)));
    });
    $('.otra', sim).addEventListener('click', () => { tm.forEach(clearTimeout); tm = []; pasos.forEach(l => { l.classList.remove('ok'); $('i', l).textContent = ''; }); acuse.classList.remove('on'); form.style.display = ''; });
  }

  /* ── portada: pase lento de fotos, cargadas después de la primera ── */
  const pase = $('.pase');
  if (pase && !matchMedia('(prefers-reduced-motion: reduce)').matches) addEventListener('load', () => setTimeout(() => {
    const fs = $$('img', pase); let n = 0;
    fs.forEach(f => { f.onload = () => { if (++n === fs.length) pase.classList.add('lista'); }; f.src = f.dataset.src; });
  }, 1800));

  /* ── el recorrido por el corte del valle ── */
  const paseo = $('.paseo');
  if (paseo && io) {
    const caja = $('.corte-caja', paseo), pts = $$('.pt', paseo), dots = $$('.paseo-prog i', paseo), pps = $$('.pp', paseo);
    const pon = k => { paseo.dataset.paso = k; caja.classList.toggle('sino', k === 4); pts.forEach((x, i) => x.classList.toggle('on', i === k)); dots.forEach((d, i) => d.classList.toggle('on', i <= k)); };
    const o = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) pon(+e.target.dataset.p); }), { rootMargin: '-50% 0px -50% 0px' });
    pps.forEach(x => o.observe(x)); pon(0);
    $$('.banda', paseo).forEach(g => g.addEventListener('click', () => pps[+g.dataset.eco].scrollIntoView({ behavior: 'smooth', block: 'center' })));
  }

  /* ── tu comunidad y «yo cuido el valle» ── */
  const COMUN = {
    'Concá': ['Aquí están los manantiales, el árbol milenario y la Acequia Madre. En el taller se dijo que las casas ya rodean los nacimientos de agua.', [['manantiales', 'El Nacimiento, El Abanico y las acequias que cruzan el pueblo'], ['corredores', 'El parque lineal de la Acequia Madre'], ['tejidos', 'Crecer primero en los baldíos con servicios y hacia Concá Norte'], ['rio', 'El corredor del río que bordea el pueblo']]],
    'Las Trancas': ['Aquí la tierra ya se vende hasta en $1,000 el metro cuadrado y hay terrenos ejidales lotificándose hacia El Salitrillo.', [['tejidos', 'Dónde sí y dónde no crecer'], ['carretera', 'Un tramo piloto de carretera con sombra y paso seguro'], ['rio', 'El arroyo Las Trancas y sus accesos'], ['camino-real', 'La reforestación piloto entre Las Trancas y El Salitrillo']]],
    'El Salitrillo': ['Entre El Salitrillo y Las Trancas se están lotificando terrenos ejidales sin una planeación clara.', [['aca', 'Las parcelas del distrito de riego El Abanico–El Salitrillo'], ['camino-real', 'El Camino Real y la franja que cuida el cerro'], ['tejidos', 'Completar el poblado sin bajar sobre las parcelas'], ['corredores', 'La franja verde que envuelve al pueblo']]],
    'El Crucero': ['Es donde más se nota el crecimiento sobre la carretera entre 2010 y 2026.', [['carretera', 'El corte de la propuesta se dibujó justo aquí'], ['tejidos', 'Ocupar primero los lotes vacíos del Crucero'], ['corredores', 'La franja verde entre las casas y las parcelas']]],
    'Mesa de Palo Blanco': ['Un poblado que la propuesta busca consolidar sin que baje sobre la tierra de riego.', [['tejidos', 'Consolidar la Mesa como núcleo, con sus servicios'], ['camino-real', 'El tramo del sendero entre el centro vecinal y el monte'], ['corredores', 'La franja productiva que la rodea']]],
    'El Coyote': ['La entrada al valle por la carretera, con selva baja a los dos lados.', [['carretera', 'El tramo empieza aquí: más espacio para la selva y pasos de fauna']]],
    'Otro lugar': ['Vengas de donde vengas, el valle también te toca: de aquí salen el agua, la fruta y el paisaje que visitas.', [['aca', 'El corazón del proyecto: 455 hectáreas de riego'], ['rio', 'El río donde se nada y se descansa']]]
  };
  const chips = $('.com-chips');
  if (chips && P.length) {
    const panel = $('#com-panel'), sum = $('#sumate'), API = window.ECOTONOS_API || '';
    let elegida = '', datos = null;
    const guardado = k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };
    const guarda = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
    const pintaCuenta = () => {
      if (!datos) return;
      $('#sum-total').textContent = datos.total;
      const n = elegida && datos.por ? (datos.por[elegida] || 0) : 0;
      $('#sum-de').textContent = elegida && elegida !== 'Otro lugar' ? (n ? n + (n === 1 ? ' es' : ' son') + ' de ' + elegida + '.' : 'Todavía nadie de ' + elegida + '. Sé la primera persona.') : '';
    };
    const elige = c => {
      elegida = c; guarda('eco-comunidad', c);
      $$('button', chips).forEach(b => b.setAttribute('aria-pressed', b.dataset.c === c));
      const [nota, props] = COMUN[c];
      panel.hidden = false;
      panel.innerHTML = `<h3>${c === 'Otro lugar' ? 'Aunque no vivas aquí' : 'En ' + esc(c)}</h3><p>${esc(nota)}</p><div class="com-props">` + props.map(([s, por]) => { const p = P.find(x => x.slug === s); return `<a class="e-${p.eco}" href="${s}.html"><b>${esc(p.corto)}</b><span>${esc(por)}</span></a>`; }).join('') + '</div>';
      pintaCuenta();
    };
    chips.addEventListener('click', e => { const b = e.target.closest('button'); if (b) elige(b.dataset.c); });
    const antes = guardado('eco-comunidad'); if (COMUN[antes]) elige(antes);
    if (API) {
      sum.hidden = false;
      const form = $('#sum-form');
      if (guardado('eco-sumado')) form.innerHTML = '<p class="sum-ok">Ya estás en la cuenta. Gracias por cuidar el valle.</p>';
      fetch(API).then(r => r.json()).then(d => { if (d && d.ok) { datos = d; pintaCuenta(); } }).catch(() => {});
      form.addEventListener('submit', e => {
        e.preventDefault();
        if (!elegida) { chips.scrollIntoView({ behavior: 'smooth', block: 'center' }); chips.classList.add('falta'); setTimeout(() => chips.classList.remove('falta'), 1600); return; }
        let id = guardado('eco-id'); if (!id) { id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()); guarda('eco-id', id); }
        const bot = $('button', form); bot.disabled = true; bot.textContent = 'Enviando…';
        fetch(API, { method: 'POST', body: JSON.stringify({ id, nombre: $('#sum-nombre').value.trim(), comunidad: elegida }) })
          .then(r => r.json()).then(d => { if (!d || !d.ok) throw 0; datos = d; guarda('eco-sumado', '1'); form.innerHTML = '<p class="sum-ok">Listo. Gracias por cuidar el valle.</p>'; pintaCuenta(); })
          .catch(() => { bot.disabled = false; bot.textContent = 'Sumarme'; let m = $('.sum-err', form); if (!m) { m = document.createElement('small'); m.className = 'sum-err'; form.appendChild(m); } m.textContent = 'No se pudo enviar. Revisa tu conexión e inténtalo otra vez.'; });
      });
    }
  }

  /* ── antes y después: marcas ── */
  $$('.ad').forEach(ad => {
    const notas = $('#ad-notas'), bot = $('#ad-pins'); if (!notas) return;
    const marca = n => { $$('.pin', ad).forEach(p => p.classList.toggle('on', p.dataset.n === n)); $$('li', notas).forEach(l => l.classList.toggle('on', l.dataset.n === n)); };
    ad.addEventListener('click', e => { const p = e.target.closest('.pin'); if (p) { marca(p.dataset.n); const l = $('li.on', notas); if (l && matchMedia('(max-width: 760px)').matches) l.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } });
    notas.addEventListener('click', e => { const l = e.target.closest('li'); if (l) marca(l.dataset.n); });
    if (bot) bot.addEventListener('click', () => { const ver = ad.classList.toggle('sin-pins'); bot.setAttribute('aria-pressed', !ver); bot.textContent = ver ? 'Mostrar las marcas' : 'Ocultar las marcas'; });
  });

  /* ── glosario al toque ── */
  const GLOS = [
    ['pmdu', /\bPMDU\b/, 'PMDU', 'Programa Municipal de Desarrollo Urbano: el documento del municipio que dice qué se puede construir en cada zona. El de Arroyo Seco se aprobó en enero de 2026.'],
    ['zona-federal', /\bzona federal\b/i, 'Zona federal', 'La franja de terreno junto a ríos, arroyos y acequias que pertenece a la nación. No se puede ocupar sin una concesión de CONAGUA.'],
    ['dominio-pleno', /\bdominio pleno\b/i, 'Dominio pleno', 'Trámite por el que una parcela ejidal pasa a ser propiedad privada y puede venderse libremente.'],
    ['selva-baja', /\bselva baja\b/i, 'Selva baja', 'El monte del cerro: árboles bajos que pierden la hoja en la temporada de secas.'],
    ['ecotono', /\becotonos?\b/i, 'Ecotono', 'La franja donde se tocan dos paisajes: el río y las parcelas, las parcelas y el pueblo, el campo y el cerro.'],
    ['ejido', /\bejidos?\b/i, 'Ejido', 'Tierra de propiedad colectiva. Sus decisiones se toman en asamblea de ejidatarios.'],
    ['lotificar', /\blotific[\p{L}]+/iu, 'Lotificar', 'Partir una parcela en lotes más chicos para venderlos o construir en ellos.'],
    ['acequia', /\bacequias?\b/i, 'Acequia', 'Canal que lleva el agua de los manantiales a las parcelas.'],
    ['ribera', /\bribera\b/i, 'Ribera', 'La orilla del río con su vegetación.'],
    ['cabildo', /\bcabildo\b/i, 'Cabildo', 'El ayuntamiento reunido: presidente municipal, síndicos y regidores. Es quien aprueba reglamentos y acuerdos del municipio.'],
    ['mojonera', /\bmojoneras?\b/i, 'Mojonera', 'Marca fija, de piedra o concreto, que señala un límite en el terreno.'],
    ['profepa', /\bPROFEPA\b/, 'PROFEPA', 'Procuraduría Federal de Protección al Ambiente: inspecciona y sanciona los daños ambientales.'],
    ['conanp', /\bCONANP\b/, 'CONANP', 'Comisión Nacional de Áreas Naturales Protegidas: administra la Reserva de la Biosfera Sierra Gorda.'],
    ['conagua', /\bCONAGUA\b/, 'CONAGUA', 'Comisión Nacional del Agua: la autoridad sobre ríos, arroyos y su zona federal.'],
    ['semarnat', /\bSEMARNAT\b/, 'SEMARNAT', 'Secretaría de Medio Ambiente y Recursos Naturales, del gobierno federal.']
  ];
  const principal = $('main');
  if (principal && !$('.hoja')) {
    const fuera = 'a,button,h1,h2,h3,h4,summary,svg,script,style,time,label,select,textarea,.glos,.ceja,.chip,.voces,.tel,.cita,q,.pin,.ad-notas,.pildora,figcaption,dt';
    $$('main section, main .p-cuerpo, .s-hero .lead, .r-hero .lead').forEach(zona => {
      const vistos = new Set();
      const tw = document.createTreeWalker(zona, NodeFilter.SHOW_TEXT, { acceptNode: n => (!n.nodeValue.trim() || n.parentElement.closest(fuera)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
      const nodos = []; while (tw.nextNode()) nodos.push(tw.currentNode);
      nodos.forEach(nodo => {
        for (const [k, re] of GLOS) {
          if (vistos.has(k)) continue;
          const m = re.exec(nodo.nodeValue); if (!m) continue;
          vistos.add(k);
          const resto = nodo.splitText(m.index); resto.nodeValue = resto.nodeValue.slice(m[0].length);
          const b = document.createElement('button'); b.className = 'glos'; b.type = 'button'; b.dataset.g = k; b.textContent = m[0]; b.setAttribute('aria-label', m[0] + ': ver qué significa');
          resto.parentNode.insertBefore(b, resto);
          break;
        }
      });
    });
    let globo;
    const cierra = () => { if (globo) { globo.classList.remove('on'); } };
    document.addEventListener('click', e => {
      const b = e.target.closest('.glos');
      if (!b) { if (!e.target.closest('.globo')) cierra(); return; }
      const g = GLOS.find(x => x[0] === b.dataset.g);
      if (!globo) { globo = document.createElement('div'); globo.className = 'globo'; globo.setAttribute('role', 'dialog'); globo.setAttribute('aria-live', 'polite'); document.body.appendChild(globo); }
      globo.innerHTML = '<button aria-label="Cerrar">✕</button><b></b><p></p>';
      $('b', globo).textContent = g[2]; $('p', globo).textContent = g[3];
      $('button', globo).addEventListener('click', cierra);
      globo.classList.add('on');
      if (matchMedia('(min-width: 761px)').matches) {
        const r = b.getBoundingClientRect(), w = 320;
        globo.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2)) + 'px';
        globo.style.top = (r.bottom + scrollY + 10) + 'px';
      } else { globo.style.left = ''; globo.style.top = ''; }
    });
    addEventListener('keydown', e => { if (e.key === 'Escape') cierra(); });
  }

  /* ── celular: barra de abajo, como una app ── */
  const aqui = (location.pathname.split('/').pop() || 'index.html');
  const TABS = [
    ['index.html', 'Valle', 'M3 19l5-9 4 6 3-4 6 7z'],
    ['historia.html', 'Historia', 'M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z'],
    ['propuestas.html', 'Propuestas', 'M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2zM9 4v14M15 6v14'],
    ['participa.html', 'Qué sigue', 'M5 12h14M13 6l6 6-6 6'],
    ['reporte.html', 'Reporta', 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z']
  ];
  if (top && !$('.hoja')) {
    const act = TABS.some(x => x[0] === aqui) ? aqui : 'propuestas.html';
    const barra = document.createElement('nav'); barra.className = 'tabs'; barra.setAttribute('aria-label', 'Recorrido');
    barra.innerHTML = TABS.map(([h, n, d]) => `<a href="${h}"${h === act ? ' class="on" aria-current="page"' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>${n}</a>`).join('');
    document.body.appendChild(barra); document.body.classList.add('con-tabs');
  }

  /* ── celular: las filas de tarjetas se deslizan con el dedo ── */
  $$('.hallazgos,.linea-t,.despues,.pesos,.hub,.tres,.que-g,.herr,.par-g,.desc-g').forEach(f => {
    f.classList.add('desliza-m');
    if (f.children.length > 1 && !f.nextElementSibling?.classList.contains('puntos')) {
      const p = document.createElement('div'); p.className = 'puntos'; p.setAttribute('aria-hidden', 'true');
      p.innerHTML = Array.from(f.children, (_, i) => `<i${i === 0 ? ' class="on"' : ''}></i>`).join('');
      f.after(p);
      let t0; f.addEventListener('scroll', () => { clearTimeout(t0); t0 = setTimeout(() => { const w = f.children[0].getBoundingClientRect().width + 12; const k = Math.round(f.scrollLeft / w); $$('i', p).forEach((d, i) => d.classList.toggle('on', i === k)); }, 60); }, { passive: true });
    }
  });

  /* ── computadora: índice lateral que sigue la lectura ── */
  const partes = $$('.indice a[href^="#"]').map(a => [a.getAttribute('href'), $('b', a).textContent]);
  const secs = partes.length ? partes : $$('main > section[id]').map(s => ['#' + s.id, ($('h2', s) || {}).textContent || '']).filter(x => x[1]);
  if (secs.length > 1 && io) {
    const lat = document.createElement('nav'); lat.className = 'lateral'; lat.setAttribute('aria-label', 'En esta página');
    lat.innerHTML = secs.map(([h, n]) => `<a href="${h}"><span>${esc(n)}</span><i></i></a>`).join('');
    document.body.appendChild(lat);
    const ls = $$('a', lat);
    const o = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) ls.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-40% 0px -55% 0px' });
    secs.forEach(([h]) => { const s = $(h); if (s) o.observe(s); });
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

  observa();
})();
