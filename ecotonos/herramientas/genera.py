#!/usr/bin/env python3
"""Genera una página propia por propuesta (aca.html, rio.html, ...) a partir de propuesta.html y js/datos.js,
para que cada una tenga su título y su vista previa al compartirla. También crea las imágenes de vista previa.
Uso, desde la carpeta ecotonos/:  python3 herramientas/genera.py
Vuelve a correrlo cuando cambien propuesta.html o los textos de datos.js."""
import json, os, html
AQUI = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = 'https://campus-conca.github.io/cidaf/ecotonos/'
datos = open(os.path.join(AQUI, 'js', 'datos.js'), encoding='utf-8').read().split('window.PROPUESTAS = ', 1)[1].rstrip().rstrip(';')
P = json.loads(datos)
plantilla = open(os.path.join(AQUI, 'propuesta.html'), encoding='utf-8').read()

def recorta(src, dst, ancho=1200, alto=630):
    from PIL import Image
    im = Image.open(src).convert('RGB'); w, h = im.size; r = ancho / alto
    if w / h > r: nw = int(h * r); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else: nh = int(w / r); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    im.resize((ancho, alto), Image.LANCZOS).save(dst, 'JPEG', quality=82, optimize=True)

for p in P:
    foto = next((g for g in p['gal'] if len(g) < 3), p['gal'][0])[0]
    try: recorta(os.path.join(AQUI, 'img', foto + '.webp'), os.path.join(AQUI, 'img', 'og-' + p['slug'] + '.jpg'))
    except ImportError: pass
    tit = html.escape(p['titulo'], quote=True); des = html.escape(p['resumen'][:190].rsplit(' ', 1)[0] + '…', quote=True)
    t = plantilla
    t = t.replace('<title>Propuesta · Ecotonos del valle de Concá</title>', '<title>%s · Ecotonos del valle de Concá</title>' % tit)
    t = t.replace('<meta name="description" content="Una de las siete propuestas para cuidar el territorio del valle agrícola de Concá.">',
        '<meta name="description" content="%s">\n<meta property="og:title" content="%s">\n<meta property="og:description" content="%s">\n<meta property="og:image" content="%simg/og-%s.jpg">\n<meta property="og:url" content="%s%s.html">\n<meta property="og:type" content="article">\n<meta name="twitter:card" content="summary_large_image">' % (des, tit, des, URL, p['slug'], URL, p['slug']))
    t = t.replace('<main id="propuesta">', '<main id="propuesta" data-p="%s">' % p['slug'])
    assert 'data-p="%s"' % p['slug'] in t and tit in t
    open(os.path.join(AQUI, p['slug'] + '.html'), 'w', encoding='utf-8').write(t)
    print('ok', p['slug'] + '.html')
try:
    recorta(os.path.join(AQUI, 'img', 'p0-valle-selva.webp'), os.path.join(AQUI, 'img', 'og.jpg'))
    recorta(os.path.join(AQUI, 'img', 'p0-acequia.webp'), os.path.join(AQUI, 'img', 'og-reporte.jpg'))
except ImportError: print('sin Pillow: no se regeneraron las imágenes de vista previa')
