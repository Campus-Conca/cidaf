/* Reto «¿Se puede o no se puede?» */
(function(){
  var CASOS=[
    {d:'Parcela de riego',q:'Don Chuy quiere partir su parcela del valle en veinte lotes para venderlos.',r:false,
     e:'La parcela es campo: se siembra, no se lotifica.'},
    {d:'Purísima de Arista',q:'Ana va a levantar un segundo piso en su casa.',r:true,
     e:'Se permiten 2 niveles y hasta 6 metros. Le falta pedir su licencia.'},
    {d:'Concá',q:'Lupita quiere abrir una tienda de abarrotes en el frente de su casa.',r:true,
     e:'En zona de vivienda con comercio cabe una tienda. Se confirma con el dictamen de uso de suelo.'},
    {d:'Orilla de un arroyo',q:'Una familia quiere construir a diez metros del cauce, sin estudio alguno.',r:false,
     e:'Junto a un cauce se pide primero un estudio hidrológico. La orilla queda libre: de 25 a 30 metros por lado.'},
    {d:'El Tepozán',q:'Beto heredó 600 m² y quiere repartirlos en tres lotes de 200 m² para las casas de sus hijos.',r:true,
     e:'En zona de vivienda rural se permiten lotes desde 200 m², con 10 metros de frente, para casa unifamiliar.'},
    {d:'Ribera en Las Adjuntas',q:'Una cooperativa quiere rentar kayaks y vender comida junto al río, con sus permisos.',r:true,
     e:'Junto al río cabe el ecoturismo de bajo impacto, con opinión de CONANP y su estudio de impacto ambiental.'},
    {d:'Cerro, zona verde del mapa',q:'Te ofrecen un lote barato «con papelito» para hacer una cabaña.',r:false,
     e:'Un contrato privado no cambia la zona. En campo y monte no hay licencia ni servicios en regla.'},
    {d:'Ejido',q:'La asamblea decide seguir sembrando naranja y maíz en sus parcelas.',r:true,
     e:'Producir es justo lo que el Programa busca conservar en el campo.'}
  ];
  var caja=document.getElementById('reto'),i=0,ok=0,resp=false;
  function pinta(){
    if(i>=CASOS.length)return fin();
    var c=CASOS[i];resp=false;
    caja.innerHTML='<div class="prog"><i style="width:'+(i/CASOS.length*100)+'%"></i></div>'+
      '<span class="donde">Caso '+(i+1)+' de '+CASOS.length+' · '+c.d+'</span>'+
      '<p class="caso">'+c.q+'</p>'+
      '<div class="ops"><button data-r="1">Sí se puede</button><button data-r="0">No se puede</button></div>'+
      '<div id="exp"></div>';
  }
  function fin(){
    var msg=ok===8?'Ocho de ocho. Ya puedes explicarle el Programa a tus vecinos.':ok>=6?'Vas bien. Con el mapa a la mano no se te va una.':'Nadie nace sabiendo. El mapa y la guía resuelven la duda en un minuto.';
    caja.innerHTML='<div class="prog"><i style="width:100%"></i></div><span class="donde">Resultado</span><p class="caso">'+ok+' de '+CASOS.length+' aciertos</p><div class="exp">'+msg+'</div>'+
      '<div class="fila-btn"><a class="btn btn-verde" href="mapa.html">Buscar mi terreno</a><button class="btn btn-linea" id="otra">Otra vuelta</button><button class="btn btn-linea" id="comp">Retar a alguien</button></div>';
    document.getElementById('otra').onclick=function(){i=0;ok=0;pinta()};
    document.getElementById('comp').onclick=function(){compartir('¿Se puede o no se puede?','Saqué '+ok+' de 8 en el reto de las reglas para construir en Arroyo Seco. ¿Y tú?',urlSitio('reto.html'))};
  }
  caja.addEventListener('click',function(e){
    var b=e.target.closest('[data-r]');
    if(b&&!resp){
      resp=true;
      var c=CASOS[i],dijo=b.getAttribute('data-r')==='1',bien=dijo===c.r;
      if(bien)ok++;
      caja.querySelectorAll('[data-r]').forEach(function(x){var v=x.getAttribute('data-r')==='1';if(v===c.r)x.classList.add('ok');else if(x===b)x.classList.add('mal');x.disabled=true});
      document.getElementById('exp').innerHTML='<div class="exp"><b>'+(bien?'Así es. ':'No exactamente. ')+(c.r?'Sí se puede.':'No se puede.')+'</b> '+c.e+'</div><div class="fila-btn" style="margin-top:12px"><button class="btn btn-verde" id="sig">'+(i<CASOS.length-1?'Siguiente caso':'Ver resultado')+'</button></div>';
      document.getElementById('sig').onclick=function(){i++;pinta();caja.scrollIntoView({block:'nearest'})};
    }
  });
  pinta();
})();
