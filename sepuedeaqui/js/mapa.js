/* Visor de zonificación «¿Esto se puede aquí?»
   Un solo motor para el mapa municipal y para la ventana del valle de Concá.
   Capa simple: veredicto, qué sí y qué no, y qué sigue. Capa de detalle: clave y medidas plegadas en «Más detalle».
   Configuración por página en window.MAPA_CFG. */
(function(){
  var CFG=window.MAPA_CFG||{};
  var ZONAS=window.PMDU_ZONAS, LUG=window.PMDU_LUGARES||[], COLOR=window.PMDU_COLOR, REF=window.PMDU_REFERENCIA||null;
  var $=function(id){return document.getElementById(id)};
  var panel=$('panel'), cuerpo=$('ficha'), asaTxt=$('asaTxt');
  var modo='usos', base='satelite', filtro=null, selCapa=null, yo=null, punto=null, vista='leyenda';
  var tieneRed=navigator.onLine!==false;

  // Avisos para lector de pantalla: una sola línea por cambio, en vez de leer todo el panel.
  var anuncio=document.createElement('p');anuncio.className='oculto';anuncio.setAttribute('aria-live','polite');document.body.appendChild(anuncio);
  function anunciar(t){anuncio.textContent='';setTimeout(function(){anuncio.textContent=t},60)}

  var MUN=L.latLngBounds([21.28607,-99.795131],[21.578261,-99.411164]);
  var map=L.map('mapa',{zoomControl:false,preferCanvas:true,zoomSnap:.25,zoomDelta:1,minZoom:CFG.minZoom||9.5,maxZoom:19,
    maxBounds:(CFG.limites?L.latLngBounds(CFG.limites):MUN).pad(.35),maxBoundsViscosity:.8});
  L.control.zoom({position:'bottomright'}).addTo(map);
  map.attributionControl.setPrefix(false);
  map.attributionControl.addAttribution('Zonificación del Programa, corte 1 dic 2025');
  map.createPane('referencia');map.getPane('referencia').style.zIndex=450;map.getPane('referencia').style.pointerEvents='none';

  var sat=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,maxNativeZoom:18,attribution:'Imagen: Esri, Maxar, Earthstar Geographics'});
  var calles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'});
  var cargas=0,fallas=0,avisado=false;
  sat.on('tileload',function(){cargas++});
  sat.on('tileerror',function(){fallas++;if(!cargas&&fallas>=4&&!avisado&&base==='satelite'){avisado=true;ponBase('esquema');aviso('Sin foto satelital por ahora: se muestra el esquema de zonas')}});

  /* --- Estilo: sobre la foto, relleno tenue y borde del color de la zona; en esquema, colores llenos --- */
  function colorDe(p){
    if(modo==='crece'){
      if(p.p==='U')return '#B0764A';
      if(p.p==='Z')return p.z==='C'?'#F2A93B':p.z==='M'?'#F7D060':'#FBEAA6';
    }
    return COLOR[p.c]||'#cccccc';
  }
  function estilo(f){
    var p=f.properties,fam=PMDU.fam(p.c),grande=(fam==='ZAM'||fam==='ZN'),z=map.getZoom(),col=colorDe(p),s;
    if(base==='esquema'){
      s={color:'#3d463f',weight:grande?0:.8,opacity:.85,fillColor:col,fillOpacity:grande?.95:1};
    }else if(grande){
      s={color:col,weight:0,opacity:0,fillColor:col,fillOpacity:z>=15?.05:z>=13?.12:.22};
    }else{
      s={color:col,weight:z>=16?2.4:z>=14?1.8:1.2,opacity:1,fillColor:col,fillOpacity:z>=16?.22:z>=14?.38:.7};
    }
    if(filtro){
      if(filtro.indexOf(fam)<0){s.fillOpacity=grande?(base==='esquema'?.45:.04):.06;s.weight=0}
      else if(!grande){s.fillOpacity=base==='esquema'?1:.6;s.weight=2}
      else{s.fillOpacity=base==='esquema'?.95:.35}
    }
    return s;
  }
  // Las zonas llegan después de la foto: así las teselas no esperan a zonas.js.
  var capa=null;
  function conZonas(){
    ZONAS=window.PMDU_ZONAS;
    capa=L.geoJSON(ZONAS,{style:estilo,onEachFeature:function(f,l){l.on('click',function(e){L.DomEvent.stopPropagation(e);selecciona(f,e.latlng)})}}).addTo(map);
    if(selCapa)selCapa.bringToFront();
    if(window.__mapa)window.__mapa.zonasListas=true;
    setTimeout(function(){conGiros(function(){})},400);
  }
  map.on('zoomend',function(){if(capa)capa.setStyle(estilo);estiloReferencia()});
  map.on('click',function(e){
    aviso(MUN.contains(e.latlng)?'En ese punto no hay una zona registrada. Pregunta en Desarrollo Urbano.':'Ahí ya no es Arroyo Seco: el Programa solo tiene zonas dentro del municipio.');
  });

  /* --- Capa de referencia (OpenStreetMap): carreteras, caminos, ríos y arroyos, solo en el esquema --- */
  var refCasco=null,refLinea=null,refNombres=[],refCargando=false;
  function estiloRef(f,casco){
    var t=f.properties.t,z=map.getZoom(),k=z>=15?1.6:z>=13?1.25:1;
    if(t==='carretera')return casco?{color:'#fff',weight:5.5*k,opacity:.9}:{color:'#6B4F2A',weight:3*k,opacity:1};
    if(t==='camino')return casco?{color:'#fff',weight:3.2*k,opacity:.75}:{color:'#8A7356',weight:1.4*k,opacity:.95};
    if(t==='rio')return {color:'#2E7CB8',weight:2.6*k,opacity:.95};
    if(t==='canal')return {color:'#2E7CB8',weight:1.4*k,opacity:.9,dashArray:'4 3'};
    return {color:'#4D97CC',weight:1*k,opacity:.75};
  }
  function armaReferencia(){
    if(!REF||refLinea)return;
    var caminos={type:'FeatureCollection',features:REF.features.filter(function(f){return f.properties.t==='carretera'||f.properties.t==='camino'})};
    refCasco=L.geoJSON(caminos,{pane:'referencia',interactive:false,style:function(f){return estiloRef(f,true)}});
    refLinea=L.geoJSON(REF,{pane:'referencia',interactive:false,attribution:'Caminos y ríos: © OpenStreetMap (ODbL)',style:function(f){return estiloRef(f,false)}});
    (REF.nombres||[]).forEach(function(n){
      refNombres.push(L.marker([n[1],n[0]],{pane:'referencia',interactive:false,keyboard:false,icon:L.divIcon({className:'ref-nom ref-'+n[3],html:'<span>'+n[2]+'</span>',iconSize:[0,0]})}));
    });
  }
  function cargaReferencia(){   // la capa pesa 150 KB: se pide solo cuando se usa el esquema
    if(REF||refCargando)return;
    refCargando=true;
    var s=document.createElement('script');s.src='data/referencia.js';
    s.onload=function(){REF=window.PMDU_REFERENCIA||null;armaReferencia();referencia(base==='esquema')};
    document.head.appendChild(s);
  }
  function estiloReferencia(){if(refLinea&&map.hasLayer(refLinea)){refCasco.setStyle(function(f){return estiloRef(f,true)});refLinea.setStyle(function(f){return estiloRef(f,false)})}}
  function referencia(ver){
    if(ver&&!REF){cargaReferencia();return}
    armaReferencia();
    if(!refLinea)return;
    [refCasco,refLinea].concat(refNombres).forEach(function(l){if(ver&&!map.hasLayer(l))l.addTo(map);if(!ver&&map.hasLayer(l))map.removeLayer(l)});
    if(ver)estiloReferencia();
  }

  function ponBase(b){
    base=b;
    map.removeLayer(sat);map.removeLayer(calles);
    if(b==='satelite')sat.addTo(map);
    if(b==='calles')calles.addTo(map);
    referencia(b==='esquema');
    if(capa)capa.bringToFront();if(selCapa)selCapa.bringToFront();
    $('mapa').classList.toggle('base-esquema',b!=='satelite');
    if(capa)capa.setStyle(estilo);
    var t=$('btnBaseTxt');if(t)t.textContent=b==='satelite'?'Foto':b==='calles'?'Calles':'Zonas';
  }

  /* --- Sin señal: esquema y una línea que lo dice --- */
  var sinRed=document.createElement('p');sinRed.className='sin-red';sinRed.setAttribute('role','status');sinRed.hidden=true;
  sinRed.textContent='Sin señal: se muestra el esquema de zonas.';
  $('mapa').parentNode.appendChild(sinRed);
  function revisaRed(){
    tieneRed=navigator.onLine!==false;
    sinRed.hidden=tieneRed;
    if(!tieneRed&&base!=='esquema')ponBase('esquema');
  }
  window.addEventListener('offline',revisaRed);
  window.addEventListener('online',function(){revisaRed();aviso('Hay conexión otra vez: puedes volver a la foto con el botón «Zonas»')});

  /* --- Localidades --- */
  var PRINC={'Arroyo Seco (cabecera municipal)':['cabecera','Arroyo Seco','der'],'Concá, Las Trancas y El Salitrillo':['conca','Concá',''],'Purísima de Arista':['purisima','Purísima de Arista',''],'La Florida':['la-florida','La Florida',''],'El Refugio y La Ceja':['el-refugio','El Refugio','izq'],'San Juan Buenaventura':['san-juan','San Juan Buenaventura','']};
  var marcas=[];
  LUG.forEach(function(l){
    var P=PRINC[l.n],pr=!!P,ec=l.e||l.c;
    var m=L.marker([ec[1],ec[0]],{icon:L.divIcon({className:'lug'+(pr?(' '+P[2]):' sec'),html:'<span>'+(pr?P[1]:l.n)+'</span>',iconSize:[0,0]}),keyboard:false});
    m.on('click',function(){irA(l)});
    m._pr=pr;marcas.push(m);
  });
  function etiquetas(){
    var z=map.getZoom();
    marcas.forEach(function(m){
      var ver=(m._pr&&z<15)||(!m._pr&&z>=12&&z<15);
      if(ver&&!map.hasLayer(m))m.addTo(map);
      if(!ver&&map.hasLayer(m))map.removeLayer(m);
    });
  }
  map.on('zoomend',etiquetas);
  function cajaDe(l){return L.latLngBounds([l.b[1],l.b[0]],[l.b[3],l.b[2]]).pad(.15)}
  function irA(l){map.flyToBounds(cajaDe(l),{duration:.8,maxZoom:16})}
  function lugarDe(lat,lng){
    var mejor=null,dm=1e9;
    LUG.forEach(function(l){
      var m=.004;
      if(lng>=l.b[0]-m&&lng<=l.b[2]+m&&lat>=l.b[1]-m&&lat<=l.b[3]+m){
        var d=Math.pow(lng-l.c[0],2)+Math.pow(lat-l.c[1],2);
        if(d<dm){dm=d;mejor=l}
      }
    });
    return mejor;
  }

  /* --- Selector «Ir a» --- */
  var selIr=$('irA');
  function dentroValle(l){var b=CFG.limites;return b&&l.c[1]>=b[0][0]&&l.c[1]<=b[1][0]&&l.c[0]>=b[0][1]&&l.c[0]<=b[1][1]}
  function opciones(conTodo){
    var h=conTodo?'<option value="">Ir a una localidad…</option><option value="_todo">'+(CFG.todoTxt||'Todo el municipio')+'</option>':'<option value="">Elige una localidad…</option>';
    var cab='',otras='';
    LUG.forEach(function(l,i){
      if(CFG.soloValle&&!dentroValle(l))return;
      var o='<option value="'+i+'">'+esc(l.n)+'</option>';
      if(PRINC[l.n])cab+=o;else otras+=o;
    });
    return h+'<optgroup label="Cabeceras">'+cab+'</optgroup>'+(otras?'<optgroup label="Otras localidades">'+otras+'</optgroup>':'');
  }
  if(selIr){
    selIr.innerHTML=opciones(true);
    selIr.addEventListener('change',function(){
      if(selIr.value==='_todo'){vistaInicial(true)}
      else if(selIr.value!==''){irA(LUG[+selIr.value])}
    });
  }
  function vistaInicial(anim){
    var b=CFG.vista?L.latLngBounds(CFG.vista):MUN;
    if(anim)map.flyToBounds(b,{duration:.8});else map.fitBounds(b);
  }

  /* --- Punto en polígono --- */
  function enAnillo(x,y,r){var d=false;for(var i=0,j=r.length-1;i<r.length;j=i++){var xi=r[i][0],yi=r[i][1],xj=r[j][0],yj=r[j][1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))d=!d}return d}
  function enPol(x,y,c){if(!enAnillo(x,y,c[0]))return false;for(var i=1;i<c.length;i++){if(enAnillo(x,y,c[i]))return false}return true}
  function zonaDe(lng,lat){
    if(!ZONAS)return null;
    for(var i=ZONAS.features.length-1;i>=0;i--){
      var g=ZONAS.features[i].geometry;
      if(g.type==='Polygon'){if(enPol(lng,lat,g.coordinates))return ZONAS.features[i]}
      else{for(var m=0;m<g.coordinates.length;m++){if(enPol(lng,lat,g.coordinates[m]))return ZONAS.features[i]}}
    }
    return null;
  }

  /* --- Giros: la Tabla de compatibilidad del Programa (Anexo 3.1), zona por zona.
         Pesa 24 KB y se pide después de las zonas. La tabla no asigna giros a ZAM ni a ZN. --- */
  var GIROS=window.PMDU_GIROS||null, GITEMS=null, girosEsperan=[], girosPidio=false, filtroGiro='';
  var G_VACIAS={de:1,del:1,la:1,las:1,el:1,los:1,y:1,o:1,u:1,en:1,con:1,sin:1,para:1,por:1,un:1,una:1,unos:1,unas:1,a:1,al:1,mi:1,se:1,que:1,quiero:1,poner:1,abrir:1,puedo:1,puede:1,negocio:1,local:1};
  var G_ALIAS={casa:['vivienda'],cuartos:['vivienda','huespedes'],departamentos:['vivienda'],tiendita:['miscelaneas','abarrotes'],tienda:['tiendas','miscelaneas'],
    airbnb:['cabanas','huespedes'],hospedaje:['hoteles','cabanas'],posada:['hoteles'],hotel:['hoteles'],ganado:['potreros','cria'],vacas:['potreros'],chivas:['potreros','cria'],borregos:['potreros','cria'],
    cerdos:['cria'],puercos:['cria'],pollos:['cria','pollerias'],gallinas:['cria'],establo:['establos'],corral:['corrales'],milpa:['cultivos'],siembra:['cultivos'],sembrar:['cultivos'],parcela:['cultivos'],
    peces:['piscicola'],tilapia:['piscicola'],pescado:['pescaderia','piscicola'],estetica:['belleza'],barberia:['peluquerias'],vulcanizadora:['llanteras'],talachera:['llanteras'],
    cerveza:['bebidas','cervecerias'],deposito:['deposito','depositos'],licoreria:['vinaterias'],iglesia:['templos'],capilla:['templos'],kinder:['jardines'],primaria:['primarias'],secundaria:['secundarias'],prepa:['preparatorias'],
    doctor:['consultorios'],medico:['consultorios'],dentista:['odontologos'],veterinaria:['veterinarios'],panteon:['cementerios'],funeraria:['funerarias'],purificadora:['purificada','purificacion'],
    ladrillera:['tabiqueras'],tabiquera:['tabiqueras'],grava:['petreos','grava'],banco:['bancos','petreos'],mina:['mineria'],gasolinera:['gasolina'],gas:['gas'],antena:['antenas'],
    taqueria:['taquerias'],comida:['restaurantes','comida'],fonda:['fondas'],cantina:['cantinas'],bar:['bares'],antro:['antros'],salon:['salones'],fiestas:['fiestas'],jardin:['jardines'],
    balneario:['balnearios'],alberca:['alberca','balnearios'],campamento:['campismo'],acampar:['campismo'],temazcal:['spa'],sendero:['senderos'],mirador:['miradores'],
    bodega:['bodegas'],herreria:['forjados'],carpinteria:['carpinteria'],mecanico:['mecanico'],autolavado:['lavado'],carwash:['lavado'],cancha:['canchas'],gimnasio:['gimnasios'],
    farmacia:['farmacias'],papeleria:['papelerias'],ferreteria:['ferreterias'],tortilleria:['tortilleria'],carniceria:['carnicerias'],panaderia:['panaderias'],fruteria:['fruteria'],
    escuela:['escuelas'],guarderia:['guarderia'],clinica:['clinicas'],hospital:['hospitales'],oficina:['oficinas'],pozo:['pozos'],tanque:['tanques'],invernadero:['invernaderos'],huerta:['huertas']};
  function gNorm(s){
    return String(s).toLowerCase().replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i').replace(/[óòö]/g,'o').replace(/[úùü]/g,'u').replace(/ñ/g,'n').replace(/[^a-z0-9]+/g,' ').trim();
  }
  function gRaiz(w){return w.length>4?w.replace(/(es|s)$/,''):w}
  function gPalabras(s){return gNorm(s).split(' ').filter(function(w){return w&&!G_VACIAS[w]}).map(gRaiz)}
  function preparaGiros(){
    if(!GIROS||GITEMS)return;
    GITEMS=[];
    GIROS.filas.forEach(function(f,fi){
      var pg=gPalabras(f[1]);
      f[3].forEach(function(t){GITEMS.push({t:t,g:f[1],u:f[0],m:f[2],w:gPalabras(t),wg:pg,fi:fi})});
    });
  }
  function conGiros(cb){
    if(GIROS){preparaGiros();cb();return}
    girosEsperan.push(cb);
    if(girosPidio)return;girosPidio=true;
    var s=document.createElement('script');s.src='data/giros.js';
    s.onload=function(){GIROS=window.PMDU_GIROS||null;preparaGiros();var e=girosEsperan;girosEsperan=[];if(GIROS)e.forEach(function(f){f()})};
    s.onerror=function(){girosPidio=false;girosEsperan=[];var r=$('gRes');if(r)r.innerHTML='<p class="g-nada">No se pudo cargar la lista de giros. Revisa la conexión e intenta de nuevo.</p>'};
    document.head.appendChild(s);
  }
  function gCasa(q,w){   // 2 = coincide; 1 = se parece (mismas cuatro letras iniciales)
    if(w.indexOf(q)===0||(w.length>=4&&q.indexOf(w)===0))return 2;
    if(q.length<5||w.length<5)return 0;
    var n=0;while(n<q.length&&n<w.length&&q.charAt(n)===w.charAt(n))n++;
    return n>=4?1+Math.min(n-4,9)/10:0;
  }
  function buscaGiros(texto){
    var qs=gNorm(texto).split(' ').filter(function(w){return w&&!G_VACIAS[w]});
    if(!qs.length||!GITEMS)return [];
    var res=[];
    GITEMS.forEach(function(it){
      var total=0;
      for(var i=0;i<qs.length;i++){
        var alt=[gRaiz(qs[i])].concat((G_ALIAS[qs[i]]||G_ALIAS[gRaiz(qs[i])]||[]).map(gRaiz)),mejor=0;
        for(var a=0;a<alt.length&&mejor<4;a++){
          for(var k=0;k<it.w.length;k++){var c=gCasa(alt[a],it.w[k])*2;if(c>mejor)mejor=c}
          for(var j=0;j<it.wg.length;j++){var d=gCasa(alt[a],it.wg[j]);if(d>mejor)mejor=d}
        }
        if(!mejor)return;
        total+=mejor;
      }
      res.push({it:it,p:total/qs.length});
    });
    var tope=res.reduce(function(m,r){return Math.max(m,r.p)},0);
    return res.filter(function(r){return r.p>=(tope>=4?3:tope-.35)}).sort(function(a,b){return b.p-a.p||a.it.t.length-b.it.t.length}).map(function(r){return r.it});
  }
  function gFams(m){var o=[];GIROS.cols.forEach(function(c,i){if(m.charAt(i)==='1')o.push(c)});return o}
  function gDonde(m){
    var f=gFams(m);
    return f.length?'Se permite en: '+f.map(function(k){return esc(PMDU_FAM[k].t)+' ('+k+')'}).join(', ')+'.':'No está permitido en ninguna de las zonas que regula la tabla. En campo y monte decide el Programa de Manejo de la Reserva.';
  }
  var G_ICO={si:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',no:'<path d="M6.500 6.500l11 11M17.500 6.500l-11 11"/>',na:'<path d="M12 7v6M12 16.500v.010"/>'};
  function gItem(it,fam){
    var i=fam?GIROS.cols.indexOf(fam):-2, v=i===-2?'':i<0?'na':it.m.charAt(i)==='1'?'si':'no', h;
    if(!fam){
      var fs=gFams(it.m);
      h='<li class="g-it"><div><span class="g-t">'+esc(it.t)+'</span><small>'+esc(it.g)+'</small><small class="g-donde">'+gDonde(it.m)+'</small>'+
        (fs.length?'<button class="enlace g-ver" data-f="'+fs.join(' ')+'" data-n="'+esc(it.t).replace(/"/g,'&quot;')+'">Resaltar esas zonas en el mapa</button>':'')+'</div></li>';
      return h;
    }
    h='<li class="g-it g-'+v+'"><svg viewBox="0 0 24 24" aria-hidden="true">'+G_ICO[v]+'</svg><div><b>'+(v==='si'?'Permitido aquí':v==='no'?'Prohibido aquí':'Aquí no lo decide esta tabla')+'</b><span class="g-t">'+esc(it.t)+'</span><small>'+esc(it.g)+'</small>';
    if(v!=='si')h+='<small class="g-donde">'+gDonde(it.m)+'</small>';
    return h+'</div></li>';
  }
  function gPinta(fam,texto){
    var r=$('gRes');if(!r)return;
    if(!gNorm(texto)){r.innerHTML='';return}
    var hall=buscaGiros(texto),MAX=8;
    if(!hall.length){
      r.innerHTML='<p class="g-nada"><b>«'+esc(texto)+'» no aparece en la tabla.</b> Cuando un giro no está, lo evalúa Desarrollo Urbano del Municipio. Prueba con otra palabra o pregunta en ventanilla.</p>';
      anunciar('Sin resultados para '+texto);return;
    }
    r.innerHTML='<ul class="g-lista">'+hall.slice(0,MAX).map(function(it){return gItem(it,fam)}).join('')+'</ul>'+
      (hall.length>MAX?'<p class="g-mas">Hay '+(hall.length-MAX)+' más: escribe otra palabra para afinar.</p>':'');
    var pr=hall[0],i=fam?GIROS.cols.indexOf(fam):-2;
    anunciar(hall.length+(hall.length===1?' resultado. ':' resultados. ')+pr.t+(i>=0?(pr.m.charAt(i)==='1'?': permitido aquí.':': prohibido aquí.'):'.'));
  }
  function gTodo(fam,cual){   // lista completa de la zona, plegada por uso genérico
    var i=GIROS.cols.indexOf(fam),h='';
    GIROS.usos.forEach(function(u,ui){
      var grupos=[],n=0,ult=null;
      GIROS.filas.forEach(function(f){
        if(f[0]!==ui||f[2].charAt(i)!==cual)return;
        if(!ult||ult.g!==f[1]){ult={g:f[1],l:[]};grupos.push(ult)}
        f[3].forEach(function(t){ult.l.push(t);n++});
      });
      if(!n)return;
      h+='<details class="g-uso"><summary>'+esc(u)+' <small>'+n+'</small></summary>'+grupos.map(function(g){return '<h4>'+esc(g.g)+'</h4>'+lista(g.l)}).join('')+'</details>';
    });
    return h||'<p>Ninguno.</p>';
  }
  function gCuenta(fam,cual){var i=GIROS.cols.indexOf(fam),n=0;GIROS.filas.forEach(function(f){if(f[2].charAt(i)===cual)n+=f[3].length});return n}
  var G_EJ={HR:['Tienda','Cabañas','Taller mecánico','Corrales'],HM:['Tienda','Tortillería','Hotel','Consultorio'],HMM:['Restaurante','Hotel','Oficinas','Taller mecánico'],CS:['Restaurante','Hotel','Gasolinera','Salón de fiestas'],
    E:['Escuela','Mercado','Canchas','Tanque de agua'],I:['Bodega','Purificadora','Taller de torno','Vivienda'],ECO:['Cabañas','Restaurante','Senderos','Vivienda'],PCCA:['Pozo','Estanque','Cabañas','Vivienda'],
    ZAM:['Cabañas','Vivienda','Corrales','Invernadero'],ZN:['Cabañas','Senderos','Vivienda','Corrales'],'':['Tienda','Cabañas','Taller mecánico','Restaurante']};
  function gBloque(fam){   // fam vacío = desde la leyenda: dice en qué zonas se permite cada giro
    var sinTabla=fam==='ZAM'||fam==='ZN';
    var h='<section class="giros" aria-labelledby="gTit"><h3 id="gTit">'+(fam?'¿Qué quieres poner aquí?':'¿Dónde se puede poner un negocio?')+'</h3>';
    if(sinTabla)h+='<p class="g-nota">La Tabla de compatibilidad no asigna giros a esta zona: la regulan el Decreto y el Programa de Manejo de la Reserva de la Biosfera Sierra Gorda. Lo que se quiera hacer aquí se consulta con CONANP y SEMARNAT. El buscador dice en qué zonas sí está permitido cada giro.</p>';
    h+='<label class="f-etq" for="gBusca">'+(fam?'Escribe el negocio o el uso y ve si la tabla lo permite':'Escribe un negocio o un uso y ve en qué zonas se permite')+'</label>'+
       '<input class="g-in" id="gBusca" type="search" autocomplete="off" spellcheck="false" enterkeyhint="search" placeholder="Ej. tortillería, cabañas, taller">'+
       '<div id="gRes"></div>'+
       '<div class="g-ej" id="gEj">'+(G_EJ[fam||'']||G_EJ['']).map(function(e){return '<button type="button">'+e+'</button>'}).join('')+'</div>';
    if(fam&&!sinTabla){
      h+='<details class="acc g-acc" id="gSi"><summary>Todo lo que la tabla permite aquí<small id="gSiN"></small></summary><div class="resp"></div></details>'+
         '<details class="acc g-acc" id="gNo"><summary>Lo que la tabla prohíbe aquí<small id="gNoN"></small></summary><div class="resp"></div></details>';
    }
    h+='<p class="fuente">Fuente: Tabla de compatibilidad de uso de suelo del Programa (Anexo 3.1). Un giro permitido también necesita dictamen de uso de suelo; la factibilidad de giro pide además las autorizaciones ambientales y de protección civil. Los usos condicionados y los giros que no aparecen los evalúa Desarrollo Urbano.</p></section>';
    return h;
  }
  function gActiva(fam){
    var inp=$('gBusca');if(!inp)return;
    var t=null;
    function va(){conGiros(function(){
      if($('gBusca')!==inp)return;
      gPinta(fam,inp.value);
      var sec=inp.closest('.giros');   // sube el buscador para que el resultado quede a la vista
      if(sec&&gNorm(inp.value))cuerpo.scrollTop+=sec.getBoundingClientRect().top-cuerpo.getBoundingClientRect().top-6;
    })}
    inp.addEventListener('input',function(){clearTimeout(t);t=setTimeout(va,160)});
    inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();clearTimeout(t);va();inp.blur()}});
    $('gEj').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;inp.value=b.textContent;va()});
    $('gRes').addEventListener('click',function(e){
      var b=e.target.closest('.g-ver');if(!b)return;
      filtro=b.getAttribute('data-f').split(' ');filtroGiro=b.getAttribute('data-n');
      if(capa)capa.setStyle(estilo);
      leyenda();
      if(window.matchMedia('(max-width:899px)').matches)abre(false);
      aviso('Resaltadas las zonas donde la tabla lo permite');
    });
    if(fam&&fam!=='ZAM'&&fam!=='ZN')conGiros(function(){
      if($('gBusca')!==inp)return;
      [['gSi','1'],['gNo','0']].forEach(function(p){
        var d=$(p[0]),n=$(p[0]+'N');if(!d)return;
        n.textContent=' · '+gCuenta(fam,p[1])+' giros';
        d.addEventListener('toggle',function(){var c=d.querySelector('.resp');if(d.open&&!c.firstChild)c.innerHTML=gTodo(fam,p[1])});
      });
    });
  }

  /* --- Ficha: primero el veredicto y qué sigue; la clave y las medidas, plegadas --- */
  var ICO_V={si:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',cond:'<path d="M12 7v6M12 16.5v.01"/>',no:'<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'};
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')}
  function lista(a){return '<ul>'+a.map(function(x){return '<li>'+esc(x)+'</li>'}).join('')+'</ul>'}
  function nombreCorto(fam){var F=PMDU_FAM[fam]||{};return F.corto||F.t||fam}
  function ficha(f,ll){
    var p=f.properties,fam=PMDU.fam(p.c),d=PMDU_DENS[PMDU.dens(p.c)],F=PMDU_FAM[fam]||{};
    var h='<h2 class="oculto" id="fichaTit" tabindex="-1">'+esc(nombreCorto(fam))+'</h2>';
    var crece=p.p==='Z'?'<small class="f-crece">Zona de crecimiento: se aprovecha cuando tenga agua, drenaje, luz y calle.</small>':'';
    h+='<div class="f-ver f-'+F.vs+'"><svg viewBox="0 0 24 24" aria-hidden="true">'+ICO_V[F.vs]+'</svg><div><b>'+esc(F.v)+'</b>'+crece+'</div></div>';
    h+='<div class="sino f-sino"><div class="si"><h3>Sí se puede</h3>'+lista(F.si)+'</div><div class="no"><h3>No se puede</h3>'+lista(F.no)+'</div></div>';
    h+='<p class="f-tram">'+esc(F.tram)+'</p>';
    h+=gBloque(fam);
    // --- detalle plegado: clave, medidas, etapa, localidad y fuente
    var conD=d&&fam!=='I'&&fam!=='ECO';
    var det='<div class="f-cab"><span class="f-clave" style="background:'+(COLOR[p.c]||'#ccc')+(fam==='ZN'?';color:#fff':'')+'">'+p.c.replace(',',' · ')+'</span><span class="f-nom">'+esc(PMDU.nombre(p.c))+'</span></div>';
    if(p.p==='Z')det+='<p>Crece a '+PMDU.plazo(p.z)+'.</p>';
    if(conD){
      det+='<div class="f-reglas"><div><b>'+PMDU.fmt(d.lote)+' m²</b><span>lote tipo</span></div><div><b>'+d.frente+' m</b><span>frente mínimo</span></div><div><b>2 niveles</b><span>6 m de altura</span></div><div><b>'+d.viv+'</b><span>viviendas por hectárea</span></div></div>';
    }else if(F.regla){det+='<p class="f-regla">'+esc(F.regla)+'</p>'}
    det+='<p>'+esc(F.q)+'</p>';
    if(conD)det+='<p>Debe quedar sin construir el '+d.libre+'% del lote en planta baja, y permeable el '+Math.round(d.cas*100)+'% para que la lluvia se infiltre.</p>';
    var l=ll?lugarDe(ll.lat,ll.lng):null;
    if(l){
      det+='<p><strong>'+esc(l.n)+'</strong>'+(l.d?' · Delegación '+esc(l.d):'')+'</p>';
      var vistos={};
      (l.a||[]).forEach(function(cod){var k=cod.split(' ')[0];if(vistos[k])return;vistos[k]=1;var A=PMDU_AREAS[k];if(A)det+='<p class="f-area"><strong>'+esc(A.t)+'</strong>'+esc(A.d)+'</p>'});
    }
    det+='<p class="fuente">Orientación con base en el Programa Municipal de Desarrollo Urbano de Arroyo Seco. No sustituye el dictamen de uso de suelo del Municipio.</p>';
    h+='<details class="acc f-mas"><summary>Más detalle de esta zona</summary><div class="resp">'+det+'</div></details>';
    h+='<div class="fila-btn"><a class="btn btn-verde btn-chico" href="guia.html">Qué sigue</a><button class="btn btn-linea btn-chico" id="btnComp">Compartir</button></div>';
    return h;
  }
  function selecciona(f,ll,desdeTeclado){
    if(selCapa)map.removeLayer(selCapa);
    var fam=PMDU.fam(f.properties.c);
    selCapa=(fam!=='ZAM'&&fam!=='ZN')?L.geoJSON(f,{style:{color:'#E8A85A',weight:4,fillOpacity:0,opacity:1},interactive:false}).addTo(map):null;
    vista='ficha';panel.classList.add('con-ficha');
    cuerpo.innerHTML=ficha(f,ll);
    gActiva(fam);
    cuerpo.scrollTop=0;
    abre(true);
    asaTxt.textContent=nombreCorto(fam);
    anunciar(nombreCorto(fam)+'. '+(PMDU_FAM[fam]||{}).v);
    if(desdeTeclado){var t=$('fichaTit');if(t)t.focus({preventScroll:true})}
    // En celular el panel tapa media pantalla: sube el punto tocado a la parte visible
    if(ll&&window.matchMedia('(max-width:899px)').matches){
      setTimeout(function(){
        var libre=map.getSize().y-panel.offsetHeight, pt=map.latLngToContainerPoint(ll);
        if(libre>80&&pt.y>libre-40)map.panBy([0,pt.y-libre/2],{animate:true});
      },60);
    }
    var b=$('btnComp');
    if(b)b.onclick=function(){compartir('¿Esto se puede aquí?','Consulta qué se puede hacer en tu terreno en Arroyo Seco:',urlSitio(CFG.pagina||'mapa.html'))};
  }
  function abre(si){panel.classList.toggle('min',!si);$('asa').setAttribute('aria-expanded',si?'true':'false')}
  $('asa').addEventListener('click',function(){abre(panel.classList.contains('min'))});

  /* --- Leyenda: cinco grupos; las claves completas quedan plegadas --- */
  function leyenda(){
    vista='leyenda';panel.classList.remove('con-ficha');
    var h='<div class="f-vacio"><div><span class="eyebrow">'+(CFG.eyebrow||'Mapa de zonificación')+'</span><h2>'+(CFG.titulo||'Toca tu terreno en el mapa')+'</h2></div>';
    h+='<p class="f-q">'+(CFG.intro||'Cada color tiene sus reglas. Toca un punto y ve qué se puede hacer ahí.')+'</p>';
    if(modo==='usos'){
      h+='<div class="ley" id="ley">';
      PMDU_GRUPOS.forEach(function(g){
        h+='<button data-g="'+g.k+'" aria-pressed="'+(filtro===g.f)+'"><span class="sws" aria-hidden="true">'+g.c.map(function(c){return '<i style="background:'+c+'"></i>'}).join('')+'</span><span>'+g.t+'<br><small>'+g.d+'</small></span></button>';
      });
      h+='</div>';
    }else{
      h+='<div class="ley-simple"><div><i style="background:#B0764A"></i>Lo que hoy ya es pueblo</div><div><i style="background:#F2A93B"></i>Crece primero, a 2030</div><div><i style="background:#F7D060"></i>Crece después, a 2039</div><div><i style="background:#FBEAA6"></i>Crece al final, a 2050</div><div><i style="background:#88b286"></i>Campo y monte: no se urbaniza</div></div>';
    }
    var claves=PMDU_FAM_ORDEN.map(function(k){
      var cols=Object.keys(COLOR).filter(function(c){return PMDU.fam(c)===k});
      return '<div><span class="sws" aria-hidden="true">'+cols.map(function(c){return '<i style="background:'+COLOR[c]+'"></i>'}).join('')+'</span><span><b>'+k+'</b> · '+PMDU_FAM[k].t+'</span></div>';
    }).join('');
    if(filtroGiro&&filtro)h+='<p class="g-filtro">Resaltado: zonas donde se permite «'+esc(filtroGiro)+'». <button class="enlace" id="gQuita">Quitar</button></p>';
    h+=gBloque('');
    h+='<details class="acc"><summary>Claves completas y etapas de crecimiento</summary><div class="resp"><div class="ley-claves">'+claves+'</div><p class="fuente">Los tonos más fuertes indican mayor densidad: aislada (As), mínima (Mn), baja (Bj) y media (Md).</p>'+
       '<button class="btn btn-linea btn-chico" id="btnModo">'+(modo==='usos'?'Ver por etapas de crecimiento':'Volver a ver por usos')+'</button></div></details>';
    h+='<p class="f-otros"><button class="enlace" id="btnLista">Sin mapa: ver las zonas en una lista</button> · <button class="enlace" id="btnPegar2">Pegar una ubicación</button></p>';
    h+='</div>';
    cuerpo.innerHTML=h;
    asaTxt.textContent='Leyenda';
    var ley=$('ley');
    if(ley)ley.addEventListener('click',function(e){
      var b=e.target.closest('button');if(!b)return;
      var g=PMDU_GRUPOS.filter(function(x){return x.k===b.getAttribute('data-g')})[0];
      filtro=(filtro===g.f)?null:g.f;filtroGiro='';if(capa)capa.setStyle(estilo);leyenda();
    });
    gActiva('');
    var gq=$('gQuita');if(gq)gq.addEventListener('click',function(){filtro=null;filtroGiro='';if(capa)capa.setStyle(estilo);leyenda()});
    $('btnModo').addEventListener('click',function(){modo=modo==='usos'?'crece':'usos';filtro=null;filtroGiro='';if(capa)capa.setStyle(estilo);leyenda()});
    $('btnLista').addEventListener('click',function(){listaZonas(true)});
    $('btnPegar2').addEventListener('click',function(){muestraPegar(true)});
  }

  /* --- Sin mapa: al elegir una localidad, la lista en palabras de sus zonas y su veredicto --- */
  function listaZonas(enfocar,idx){
    vista='lista';panel.classList.remove('con-ficha');
    var h='<div class="f-vacio"><div><span class="eyebrow">Sin mapa</span><h2 id="listaTit" tabindex="-1">Las zonas de cada localidad</h2></div>';
    h+='<label class="f-etq" for="selLista">Elige una localidad</label><select class="f-sel" id="selLista">'+opciones(false)+'</select>';
    h+='<div id="resLista"></div><p><button class="enlace" id="btnVolver">Volver a la leyenda</button></p></div>';
    cuerpo.innerHTML=h;
    asaTxt.textContent='Sin mapa';
    abre(true);
    var sel=$('selLista');
    sel.addEventListener('change',function(){pintaLista(sel.value)});
    $('btnVolver').addEventListener('click',function(){leyenda();var b=$('btnLista');if(b)b.focus()});
    if(idx!==undefined){sel.value=String(idx);pintaLista(sel.value)}
    if(enfocar)$('listaTit').focus({preventScroll:true});
  }
  function pintaLista(v){
    var res=$('resLista');
    if(v===''){res.innerHTML='';return}
    var l=LUG[+v],fams={},orden=[];
    (l.z||[]).forEach(function(x){var f=PMDU.fam(x[0]);if(!fams[f]){fams[f]=0;orden.push(f)}fams[f]+=x[1]});
    orden.sort(function(a,b){return fams[b]-fams[a]});
    var h='<h3>'+esc(l.n)+(l.d?' <small>· Delegación '+esc(l.d)+'</small>':'')+'</h3><ul class="f-lista">';
    orden.forEach(function(f){
      var F=PMDU_FAM[f]||{};
      h+='<li class="f-'+F.vs+'"><b>'+esc(nombreCorto(f))+'</b>'+esc(F.v)+'<small>'+PMDU.fmt(Math.round(fams[f]*10)/10)+' ha</small></li>';
    });
    h+='<li class="f-no"><b>Alrededor del pueblo: '+esc(PMDU_FAM.ZAM.corto)+'</b>'+esc(PMDU_FAM.ZAM.v)+'</li></ul>';
    h+='<details class="acc"><summary>Claves de esta localidad</summary><div class="resp"><p>'+(l.z||[]).map(function(x){return '<b>'+x[0].replace(',',' · ')+'</b> '+PMDU.fmt(x[1])+' ha'}).join(' · ')+'</p></div></details>';
    h+='<p class="fuente">Para saber qué toca a tu terreno exacto, búscalo en el mapa o pregunta en Desarrollo Urbano.</p>';
    res.innerHTML=h;
    anunciar(l.n+': '+orden.map(nombreCorto).join(', ')+' y, alrededor, campo y monte.');
  }

  /* --- Pegar una ubicación: enlace de Google Maps, de WhatsApp o coordenadas --- */
  var ctrlSup=document.querySelector('.ctrl-sup'),ctrlLat=document.querySelector('.ctrl-lat'),formP=null,entradaP=null,msgP=null;
  if(ctrlSup&&ctrlLat&&window.leerUbicacion){
    var bP=document.createElement('button');
    bP.className='fab';bP.id='btnPegar';bP.type='button';bP.title='Pegar una ubicación';
    bP.setAttribute('aria-label','Pegar una ubicación: un enlace de Google Maps o de WhatsApp, o unas coordenadas');
    bP.setAttribute('aria-expanded','false');
    bP.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="4" width="10" height="4" rx="1"/><path d="M9 6H6a1 1 0 00-1 1v13a1 1 0 001 1h12a1 1 0 001-1V7a1 1 0 00-1-1h-3"/><path d="M12 11.5c-1.6 0-2.8 1.2-2.8 2.7 0 2 2.8 4.3 2.8 4.3s2.8-2.3 2.8-4.3c0-1.5-1.2-2.7-2.8-2.7z"/></svg>';
    ctrlLat.insertBefore(bP,ctrlLat.firstChild);
    formP=document.createElement('form');
    formP.className='pegar';formP.hidden=true;formP.setAttribute('role','search');
    formP.innerHTML='<label for="ubic">Pega un enlace de Google Maps, una ubicación de WhatsApp o coordenadas</label><div><input id="ubic" type="text" inputmode="url" autocomplete="off" spellcheck="false" placeholder="21.44, -99.63"><button class="btn btn-verde btn-chico" type="submit">Ver</button></div><p class="pegar-msg" id="pegarMsg" aria-live="polite"></p>';
    ctrlSup.appendChild(formP);
    entradaP=$('ubic');msgP=$('pegarMsg');
    bP.addEventListener('click',function(){muestraPegar(formP.hidden)});
    formP.addEventListener('submit',function(e){e.preventDefault();irUbicacion(entradaP.value)});
  }
  function muestraPegar(si){
    if(!formP)return;
    formP.hidden=!si;$('btnPegar').setAttribute('aria-expanded',si?'true':'false');
    if(si){msgP.textContent='';entradaP.focus()}
  }
  function irUbicacion(texto){
    var r=window.leerUbicacion(texto);
    if(!ZONAS){msgP.textContent='Todavía se están cargando las zonas: intenta en un momento.';return}
    if(r.error){msgP.textContent=r.error;return}
    var ll=L.latLng(r.lat,r.lon);
    if(!MUN.contains(ll)){msgP.textContent='Ese punto ('+r.lat.toFixed(5)+', '+r.lon.toFixed(5)+') queda fuera de Arroyo Seco: el Programa solo tiene zonas dentro del municipio.';return}
    if(punto)map.removeLayer(punto);
    punto=L.marker(ll,{icon:L.divIcon({className:'',html:'<div class="yo pegado"></div>',iconSize:[18,18],iconAnchor:[9,9]}),interactive:false}).addTo(map);
    map.setView(ll,17);
    var f=zonaDe(r.lon,r.lat);
    if(f){muestraPegar(false);selecciona(f,ll,true)}
    else{msgP.textContent='Ese punto no cae en ninguna zona registrada (puede ser un hueco del dibujo). Pregunta en Desarrollo Urbano.'}
  }

  /* --- Controles --- */
  var bBase=$('btnBase');
  if(bBase)bBase.addEventListener('click',function(){ponBase(base==='satelite'?'esquema':base==='esquema'?'calles':'satelite')});
  var bLey=$('btnLey');
  if(bLey)bLey.addEventListener('click',function(){if(selCapa){map.removeLayer(selCapa);selCapa=null}leyenda();abre(true)});
  var bGps=$('btnGps');
  if(bGps)bGps.addEventListener('click',function(){
    if(!navigator.geolocation){aviso('Este navegador no comparte la ubicación');return}
    bGps.classList.add('act');aviso('Buscando tu ubicación…');
    try{
      navigator.geolocation.getCurrentPosition(function(pos){
        bGps.classList.remove('act');
        var lat=pos.coords.latitude,lng=pos.coords.longitude;
        if(!MUN.contains([lat,lng])){aviso('Tu ubicación está fuera del municipio de Arroyo Seco');return}
        if(yo)map.removeLayer(yo);
        yo=L.marker([lat,lng],{icon:L.divIcon({className:'',html:'<div class="yo"></div>',iconSize:[18,18],iconAnchor:[9,9]}),interactive:false}).addTo(map);
        map.setView([lat,lng],17);
        var f=zonaDe(lng,lat);
        if(f)selecciona(f,{lat:lat,lng:lng});else aviso('En tu ubicación no hay una zona registrada. Pregunta en Desarrollo Urbano.');
      },function(){bGps.classList.remove('act');aviso('No se pudo obtener tu ubicación. Revisa el permiso del navegador.')},{enableHighAccuracy:true,timeout:12000,maximumAge:30000});
    }catch(e){bGps.classList.remove('act');aviso('La ubicación no está disponible en esta vista')}
  });

  // Para teclado y lector de pantalla: un salto directo a la lista sin mapa.
  var salto=document.createElement('a');salto.href='#ficha';salto.className='salto';salto.textContent='Ver las zonas en una lista, sin mapa';
  salto.addEventListener('click',function(e){e.preventDefault();listaZonas(true)});
  var visor=$('mapa').closest('.visor,.visor-pag');if(visor)visor.insertBefore(salto,visor.firstChild);

  /* --- Arranque --- */
  var RUTAS={};Object.keys(PRINC).forEach(function(n){RUTAS[PRINC[n][0]]=n});
  function porHash(){
    var n=RUTAS[(location.hash||'').replace('#','')];
    if(!n)return false;
    var l=LUG.filter(function(x){return x.n===n})[0];
    if(l){map.fitBounds(cajaDe(l),{maxZoom:16});return true}
    return false;
  }
  ponBase(tieneRed?(CFG.base||'satelite'):'esquema');
  revisaRed();
  if(!porHash())vistaInicial(false);
  etiquetas();leyenda();
  if(window.matchMedia('(max-width:899px)').matches)abre(false);
  window.addEventListener('hashchange',porHash);
  setTimeout(function(){map.invalidateSize()},250);
  window.__mapa={buscaGiros:function(t){preparaGiros();return buscaGiros(t)},map:map,zonaDe:zonaDe,selecciona:selecciona,ponBase:ponBase,irUbicacion:irUbicacion,listaZonas:listaZonas,base:function(){return base},zonasListas:false};
  // Con señal lenta, primero la foto (para saber dónde está uno) y enseguida las zonas: a más tardar en 1.5 s.
  var pidio=false;
  function pideZonas(){
    if(pidio)return;pidio=true;
    var sz=document.createElement('script');sz.src='data/zonas.js';sz.onload=conZonas;
    sz.onerror=function(){aviso('No se pudieron cargar las zonas. Revisa la conexión y recarga la página.')};
    document.head.appendChild(sz);
  }
  if(window.PMDU_ZONAS)conZonas();
  else if(base==='satelite'){sat.once('load',pideZonas);setTimeout(pideZonas,1500)}
  else pideZonas();
})();
