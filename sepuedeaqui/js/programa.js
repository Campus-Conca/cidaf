/* Filtro de intervenciones estratégicas por localidad */
(function(){
  var P=window.PMDU_PROYECTOS||[],caja=document.getElementById('proyLista'),fil=document.getElementById('proyFiltro');
  if(!caja)return;
  var locs=['Todas','Cabecera municipal','Concá','Purísima de Arista','La Florida','San Juan Buenaventura','Ayutla','Río del Carrizal','Vegas Cuatas','Santa María de Cocos'];
  var act='Todas';
  function toca(p,l){return l==='Todas'||p.l.some(function(x){return x.indexOf(l)>-1||x==='Varias localidades'})}
  function pinta(){
    caja.innerHTML=P.filter(function(p){return toca(p,act)}).map(function(p){return '<div class="p"><i>'+p.e+'</i><b>'+p.t+'</b><span>'+p.l.join(' · ')+'</span></div>'}).join('');
    fil.innerHTML=locs.map(function(l){return '<button class="chip" aria-pressed="'+(l===act)+'" data-l="'+l+'">'+l+'</button>'}).join('');
  }
  fil.addEventListener('click',function(e){var b=e.target.closest('[data-l]');if(b){act=b.getAttribute('data-l');pinta()}});
  pinta();
})();
