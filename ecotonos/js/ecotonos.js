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

  /* ── el corte del valle: con ecotonos / sin orden ── */
  const corte = $('.corte-caja');
  if (corte) {
    const bots = $$('.conmuta button', corte), tx = $$('.eco-t', corte), bandas = $$('.banda', corte);
    bots.forEach(b => b.addEventListener('click', () => {
      const sino = b.dataset.estado === 'sino';
      corte.classList.toggle('sino', sino);
      bots.forEach(x => x.setAttribute('aria-pressed', x === b));
    }));
    const elige = n => { tx.forEach(t => t.classList.toggle('on', t.dataset.eco === n)); bandas.forEach(g => g.classList.toggle('on', g.dataset.eco === n)); };
    tx.forEach(t => { t.addEventListener('click', () => elige(t.dataset.eco)); t.addEventListener('mouseenter', () => elige(t.dataset.eco)); });
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
  <a class="volver" href="index.html#propuestas">← Las siete propuestas</a><br>
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
      ${p.desc.map(x => `<p>${esc(x)}</p>`).join('')}
      ${p.nota ? `<p class="nota-pie">${esc(p.nota)}</p>` : ''}
      <div class="fila" style="margin:26px 0 40px">
        <a class="btn teal" href="fichas/P${nn}_ficha.pdf" download>↓ Ficha síntesis (PDF)</a>
        <a class="btn linea" href="mapas/P${nn}_mapa.pdf" download>↓ Mapa (PDF)</a>
      </div>
      <h2>${i === 0 ? 'Cómo se llegó a esta propuesta' : 'La propuesta en video'}</h2>
      <div class="video"><button data-yt="${p.video}" aria-label="Reproducir el video"><img src="img/${(p.gal.find(g => !g[2]) || p.gal[0])[0]}-s.webp" alt="" loading="lazy"><span><i>▶</i>${i === 0 ? 'Ver el resumen de los talleres' : 'Ver el video de la propuesta'}</span></button></div>
      <p class="video-nota">Al reproducir se carga contenido de YouTube. <a href="index.html#videos">Ver todos los videos</a></p>
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

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

  observa();
})();
