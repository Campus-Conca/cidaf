/* Descifrador de claves de zona y pestañas por ancla */
(function(){
  var COMBOS={HR:['As','Mn','Bj'],HM:['As','Mn','Bj','Md'],HMM:['As','Mn','Bj'],CS:['As','Mn','Bj','Md']};
  var uso='HR',den='Mn';
  var $=function(id){return document.getElementById(id)};
  if(!$('decoUso'))return;
  function loteSVG(d){
    // Lote con el frente mínimo; fondo = lote / frente. Escala común para comparar densidades.
    var fondo=d.lote/d.frente, esc=4.2, W=20*esc+96, H=50*esc+70;
    var w=d.frente*esc, h=fondo*esc, x=(W-w)/2, y=H-36-h;
    var areaC=d.lote*d.cos, cw=w*.82, ch=Math.min(h*.9,(areaC*esc*esc)/cw), cx=x+(w-cw)/2, cy=y+h-ch-h*.06;
    var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Lote tipo de '+d.lote+' metros cuadrados con '+d.frente+' metros de frente">';
    s+='<rect x="0" y="'+(H-30)+'" width="'+W+'" height="30" fill="#D8D0BD"/><text x="'+(W/2)+'" y="'+(H-10)+'" text-anchor="middle" font-family="Instrument Sans,sans-serif" font-size="11" font-weight="600" fill="#4B5750">calle</text>';
    s+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="#CFE6B8" stroke="#1E2A24" stroke-width="1.5"/>';
    s+='<rect x="'+cx+'" y="'+cy+'" width="'+cw+'" height="'+ch+'" fill="#FEB565" stroke="#1E2A24" stroke-width="1.5"/>';
    s+='<text x="'+(cx+cw/2)+'" y="'+(cy+ch/2+4)+'" text-anchor="middle" font-family="Instrument Sans,sans-serif" font-size="11" font-weight="700" fill="#2A1A04">casa</text>';
    s+='<path d="M'+x+' '+(y-10)+'h'+w+'" stroke="#9A5B12" stroke-width="1.5"/><text x="'+(x+w/2)+'" y="'+(y-16)+'" text-anchor="middle" font-family="Instrument Sans,sans-serif" font-size="12" font-weight="700" fill="#9A5B12">'+d.frente+' m de frente</text>';
    s+='<text x="'+(x+w+8)+'" y="'+(y+h/2)+'" font-family="Instrument Sans,sans-serif" font-size="11" fill="#4B5750" transform="rotate(90 '+(x+w+8)+' '+(y+h/2)+')" text-anchor="middle">'+Math.round(fondo)+' m de fondo</text>';
    return s+'</svg>';
  }
  function pinta(){
    if(COMBOS[uso].indexOf(den)<0)den=COMBOS[uso][0];
    var d=PMDU_DENS[den],F=PMDU_FAM[uso];
    $('decoUso').innerHTML=Object.keys(COMBOS).map(function(k){return '<button class="chip" data-u="'+k+'" aria-pressed="'+(k===uso)+'"><b>'+k+'</b></button>'}).join('');
    $('decoDens').innerHTML=['As','Mn','Bj','Md'].map(function(k){var ok=COMBOS[uso].indexOf(k)>-1;return '<button class="chip" data-d="'+k+'" aria-pressed="'+(k===den)+'"'+(ok?'':' disabled style="opacity:.35"')+'><b>'+k+'</b>&nbsp;'+PMDU_DENS[k].n+'</button>'}).join('');
    $('decoClave').innerHTML='<span>'+uso+'</span><span class="coma">,</span><span class="d">'+den+'</span>';
    $('decoNom').textContent=F.t+', densidad '+d.n+'.';
    $('decoDatos').innerHTML='<div class="dato"><b>'+PMDU.fmt(d.lote)+' m²</b><span>lote tipo</span></div><div class="dato"><b>'+d.frente+' m</b><span>frente mínimo</span></div><div class="dato"><b>'+d.viv+'</b><span>viviendas por hectárea</span></div><div class="dato"><b>2 niveles</b><span>6 m de altura</span></div>';
    $('decoLote').innerHTML=loteSVG(d);
  }
  document.addEventListener('click',function(e){
    var u=e.target.closest('[data-u]'),dd=e.target.closest('[data-d]');
    if(u){uso=u.getAttribute('data-u');pinta()}
    if(dd&&!dd.disabled){den=dd.getAttribute('data-d');pinta()}
  });
  pinta();
  // Ancla directa a una pestaña: guia.html#comprar
  function porHash(){
    var k=(location.hash||'').replace('#','');
    var b=document.querySelector('[data-tab="'+k+'"]');
    if(b){b.click();document.getElementById('pasos').scrollIntoView()}
  }
  porHash();window.addEventListener('hashchange',porHash);
})();
