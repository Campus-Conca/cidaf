/* Funciones compartidas del sitio */
(function(){
  var toastEl=document.getElementById('toast'),tt;
  window.aviso=function(msg){
    if(!toastEl)return;
    toastEl.textContent=msg;toastEl.classList.add('ver');
    clearTimeout(tt);tt=setTimeout(function(){toastEl.classList.remove('ver')},2600);
  };
  function copiar(txt,ok){
    function listo(){aviso(ok||'Copiado')}
    function plan_b(){
      var ta=document.createElement('textarea');ta.value=txt;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';
      document.body.appendChild(ta);ta.select();
      try{document.execCommand('copy');listo()}catch(e){aviso('No se pudo copiar: selecciona el texto a mano')}
      document.body.removeChild(ta);
    }
    try{
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(listo,plan_b)}else{plan_b()}
    }catch(e){plan_b()}
  }
  window.copiarTexto=copiar;
  window.urlSitio=function(pag){
    var c=window.PMDU_CFG||{};
    var base=c.urlSitio||location.href.replace(/[^\/]*([?#].*)?$/,'');
    return base+(pag||'');
  };
  window.compartir=function(titulo,texto,url){
    try{
      if(navigator.share){navigator.share({title:titulo,text:texto,url:url}).catch(function(){});return}
    }catch(e){}
    copiar(texto+' '+url,'Texto y enlace copiados: pégalos en WhatsApp');
  };
  // Botones [data-copiar="#id"] y [data-compartir]
  document.addEventListener('click',function(ev){
    var b=ev.target.closest('[data-copiar]');
    if(b){var el=document.querySelector(b.getAttribute('data-copiar'));if(el)copiar(el.innerText.trim(),'Mensaje copiado: pégalo en WhatsApp');return}
    var s=ev.target.closest('[data-compartir]');
    if(s){compartir(document.title,s.getAttribute('data-texto')||document.title,urlSitio(s.getAttribute('data-compartir')));return}
    var t=ev.target.closest('[data-tab]');
    if(t){
      var grupo=t.closest('[data-tabs]');
      grupo.querySelectorAll('[data-tab]').forEach(function(x){x.setAttribute('aria-pressed',x===t?'true':'false')});
      var cont=document.querySelector(grupo.getAttribute('data-tabs'));
      cont.querySelectorAll('.panel').forEach(function(p){p.hidden=p.id!==t.getAttribute('data-tab')});
    }
  });
  // Filtros [data-filtros="#zona"]: cada botón [data-filtro] deja ver solo lo que lleva ese tema en data-temas.
  // Sin JavaScript se ve todo. kit.html#conca abre ya filtrado.
  var barra=document.querySelector('[data-filtros]');
  if(barra){
    var zona=document.querySelector(barra.getAttribute('data-filtros')),cuenta=barra.querySelector('[data-cuenta]');
    var filtra=function(tema,guarda){
      var n=0;
      zona.querySelectorAll('[data-temas]').forEach(function(p){
        var si=tema==='todo'||(' '+p.getAttribute('data-temas')+' ').indexOf(' '+tema+' ')>=0;
        p.hidden=!si;if(si)n++;
      });
      zona.querySelectorAll('[data-grupo]').forEach(function(g){g.hidden=!g.querySelector('[data-temas]:not([hidden])')});
      barra.querySelectorAll('[data-filtro]').forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-filtro')===tema?'true':'false')});
      if(cuenta)cuenta.textContent=n===1?'1 material':n+' materiales';
      if(guarda)try{history.replaceState(null,'',tema==='todo'?location.pathname+location.search:'#'+tema)}catch(e){}
    };
    barra.hidden=false;
    barra.addEventListener('click',function(ev){var b=ev.target.closest('[data-filtro]');if(b)filtra(b.getAttribute('data-filtro'),true)});
    var pedido=location.hash.slice(1);
    filtra(barra.querySelector('[data-filtro="'+pedido+'"]')?pedido:'todo',false);
  }
  // Datos de contacto desde la configuración
  var c=window.PMDU_CFG;
  if(c){
    document.querySelectorAll('[data-cfg]').forEach(function(el){
      var k=el.getAttribute('data-cfg'),v=c[k];
      if(v){el.textContent=v;el.classList.remove('nota-obra')}
    });
    document.querySelectorAll('a[data-href]').forEach(function(a){var v=c[a.getAttribute('data-href')];if(v)a.href=v});
  }
  // Sin señal: el service worker guarda el sitio, los datos del mapa y la foto ya vista (sw.js)
  if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
    window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})});
  }
})();
