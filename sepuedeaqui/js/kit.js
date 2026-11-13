/* Visor de la página de materiales: cada pieza en grande, con sus medidas y láminas, para compartirla por WhatsApp
   (la imagen con su mensaje), descargarla o copiar el mensaje. Los datos de cada pieza vienen en #materiales-datos
   (los escribe build_kit.py). Sin JavaScript, cada tarjeta lleva directo a su archivo. */
(function(){
  var fuente=document.getElementById('materiales-datos'),dlg=document.getElementById('galeria');
  if(!fuente||!dlg)return;
  var D=JSON.parse(fuente.textContent);
  function q(n){return dlg.querySelector('[data-v="'+n+'"]')}
  var img=q('img'),actual=null,vista=0,lamina=0,origen=null,empujado=false,dialogo=typeof dlg.showModal==='function';
  // ¿El teléfono puede mandar archivos a otras aplicaciones (WhatsApp) desde la página?
  var conArchivos=false;
  try{conArchivos=!!(window.File&&navigator.canShare&&navigator.share&&navigator.canShare({files:[new File(['x'],'x.png',{type:'image/png'})]}))}catch(e){}

  function lista(){
    return [].slice.call(document.querySelectorAll('#materiales [data-pieza]:not([hidden])')).map(function(p){return p.getAttribute('data-pieza')});
  }
  function chip(txt,sub,activo,fn,etq){
    var b=document.createElement('button');
    b.type='button';b.className='chip';b.setAttribute('aria-pressed',activo?'true':'false');b.textContent=txt;
    if(sub){var s=document.createElement('small');s.textContent=' '+sub;b.appendChild(s)}
    if(etq)b.setAttribute('aria-label',etq);
    b.onclick=fn;return b;
  }
  function mostrar(src){
    img.classList.add('cargando');img.setAttribute('data-src',src);
    var c=new Image();
    c.onload=c.onerror=function(){if(img.getAttribute('data-src')===src){img.src=src;img.classList.remove('cargando')}};
    c.src=src;
  }
  function kb(n){return n>=1024?(n/1024).toFixed(1).replace('.0','')+' MB':n+' KB'}
  // En pantalla, el enlace del mensaje no se parte en su guion («campus-»), sino después de una «/».
  // Lo que se copia y se comparte es el mensaje tal cual (D[...].msg).
  function conCortes(t){
    var d=document.createElement('div');d.textContent=t;
    return d.innerHTML.replace(/https?:\/\/[^\s<]+/g,function(u){var i=u.indexOf('://')+3;return u.slice(0,i)+u.slice(i).replace(/-/g,'‑').replace(/\//g,'/<wbr>')});
  }
  function pinta(nueva){
    var p=D[actual],v=p.vistas[vista],imgs=v.imgs,L=lista(),i=L.indexOf(actual),hoja=v.tipo==='PDF'?'página':'lámina';
    if(lamina>=imgs.length)lamina=0;
    q('tit').textContent=p.tit;
    q('n').textContent=(i>=0?(i+1)+' de '+L.length:'')+(imgs.length>1?' · '+hoja+' '+(lamina+1)+' de '+imgs.length:'');
    if(nueva&&lamina===0)img.src='piezas/'+actual+'.jpg';   // la miniatura ya está en caché: algo se ve al instante
    mostrar(imgs[lamina]);
    img.alt=(p.alts&&p.alts[lamina])||p.alt;
    var m=q('medidas');m.innerHTML='';m.hidden=p.vistas.length<2;
    p.vistas.forEach(function(x,k){m.appendChild(chip(x.etq,x.med,k===vista,function(){vista=k;pinta()}))});
    var l=q('laminas');l.innerHTML='';l.hidden=imgs.length<2;
    imgs.forEach(function(x,k){l.appendChild(chip(String(k+1),'',k===lamina,function(){lamina=k;pinta()},(hoja==='página'?'Página ':'Lámina ')+(k+1)))});
    var b=q('bajar');b.href=v.bajar;b.setAttribute('download',v.bajar.split('/').pop());
    q('bajar-t').textContent='Descargar '+v.tipo+' · '+kb(v.kb);
    q('compartir').hidden=!conArchivos;
    q('copiar').hidden=!p.msg;q('msgcaja').hidden=!p.msg;q('msg').innerHTML=conCortes(p.msg||'');
    q('uso').textContent=p.uso;
    q('alt').textContent=img.alt;
    q('peso').textContent=v.etq+(v.med?' ('+v.med+')':'')+' · '+v.tipo+(imgs.length>1?' · '+imgs.length+' '+hoja+'s':'')+' · '+kb(v.kb);
    q('ant').disabled=i<=0&&lamina===0;
    q('sig').disabled=(i<0||i>=L.length-1)&&lamina>=imgs.length-1;
  }
  // «Siguiente» pasa a la lámina que sigue y, al terminar, a la siguiente pieza de la lista que se ve
  function paso(d){
    var p=D[actual],imgs=p.vistas[vista].imgs,L=lista(),i=L.indexOf(actual);
    if(d>0&&lamina<imgs.length-1){lamina++;pinta();return}
    if(d<0&&lamina>0){lamina--;pinta();return}
    var j=i+d;if(i<0||j<0||j>=L.length)return;
    actual=L[j];vista=0;lamina=d<0?D[actual].vistas[0].imgs.length-1:0;
    try{history.replaceState(history.state,'','#ver='+actual)}catch(e){}
    pinta(true);dlg.scrollTop=0;
  }
  function abre(nom,desde,empuja){
    if(!D[nom])return;
    actual=nom;vista=0;lamina=0;origen=desde||null;
    pinta(true);
    if(dialogo){if(!dlg.open)dlg.showModal()}else{dlg.setAttribute('open','');dlg.classList.add('sin-dialogo')}
    dlg.scrollTop=0;   // ya visible: cada pieza abre desde arriba, con su imagen a la vista
    document.documentElement.classList.add('galeria-abierta');
    if(empuja){try{history.pushState({visor:1},'','#ver='+nom);empujado=true}catch(e){}}
    q('cerrar').focus();
  }
  function cerrado(){   // después de cerrar por cualquier camino: la X, Escape o el botón «atrás» del teléfono
    document.documentElement.classList.remove('galeria-abierta');
    if(empujado){empujado=false;history.back()}
    else if(/^#ver=/.test(location.hash)){try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}}
    if(origen&&document.contains(origen))origen.focus();
  }
  function cierra(){
    if(dialogo){if(dlg.open)dlg.close()}
    else if(dlg.hasAttribute('open')){dlg.removeAttribute('open');cerrado()}
  }
  if(dialogo)dlg.addEventListener('close',cerrado);
  window.addEventListener('popstate',function(){if(empujado){empujado=false;cierra()}});

  document.addEventListener('click',function(ev){
    var a=ev.target.closest('[data-ver]');
    if(!a||!D[a.getAttribute('data-ver')])return;
    ev.preventDefault();
    var t=a.closest('.pieza');
    abre(a.getAttribute('data-ver'),t?t.querySelector('.ver-btn'):a,true);
  });
  q('cerrar').onclick=cierra;
  q('ant').onclick=function(){paso(-1)};
  q('sig').onclick=function(){paso(1)};
  dlg.addEventListener('keydown',function(ev){
    if(ev.key==='ArrowLeft'){paso(-1);ev.preventDefault()}
    else if(ev.key==='ArrowRight'){paso(1);ev.preventDefault()}
    else if(ev.key==='Escape'&&!dialogo)cierra();
  });
  var x0=null,y0=0,esc=q('escena');
  esc.addEventListener('touchstart',function(ev){x0=ev.touches[0].clientX;y0=ev.touches[0].clientY},{passive:true});
  esc.addEventListener('touchend',function(ev){
    if(x0===null)return;
    var t=ev.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;x0=null;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5)paso(dx<0?1:-1);
  });

  // Compartir: la imagen (o las láminas del carrusel, o el PDF) junto con su mensaje
  function archivo(u){
    return fetch(u).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.blob()}).then(function(b){
      return new File([b],u.split('/').pop(),{type:b.type||(/\.pdf$/.test(u)?'application/pdf':'image/png')});
    });
  }
  q('compartir').onclick=function(){
    var b=this,p=D[actual],v=p.vistas[vista],urls=v.tipo==='ZIP'?v.imgs:[v.bajar];
    b.disabled=true;b.setAttribute('aria-busy','true');
    Promise.all(urls.map(archivo)).then(function(fs){
      var d={files:fs};
      if(p.msg)d.text=p.msg;
      if(!navigator.canShare(d)){delete d.text;if(p.msg)copiarTexto(p.msg,'Mensaje copiado: pégalo junto a la imagen')}
      return navigator.share(d);
    }).catch(function(e){
      if(!e||e.name!=='AbortError')aviso('No se pudo compartir. Descarga la pieza y mándala desde WhatsApp.');
    }).then(function(){b.disabled=false;b.removeAttribute('aria-busy')});
  };
  q('copiar').onclick=function(){var p=D[actual];if(p.msg)copiarTexto(p.msg,'Mensaje copiado: pégalo en WhatsApp')};

  // «Compartir esta lista»: el enlace a la página con el filtro que se ve (p. ej., kit.html#conca)
  var cl=document.querySelector('[data-compartir-lista]');
  if(cl)cl.onclick=function(){
    var f=document.querySelector('[data-filtro][aria-pressed="true"]'),tema=f&&f.getAttribute('data-filtro')!=='todo'?' · '+f.textContent:'';
    compartir('Materiales · ¿Esto se puede aquí?','Materiales para pasar la voz'+tema+':',location.href.replace(/#ver=.*$/,''));
  };

  // kit.html#ver=conca-agua abre directo esa pieza, al cargar la página o si el enlace cambia con la página abierta
  function pedido(){
    var m=/^#ver=([\w-]+)$/.exec(location.hash);
    if(!m||!D[m[1]]||(dlg.open&&actual===m[1]))return;
    if(dlg.open){actual=m[1];vista=0;lamina=0;pinta(true);dlg.scrollTop=0}else abre(m[1],null,false);
  }
  window.addEventListener('hashchange',pedido);
  pedido();
})();
