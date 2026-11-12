/* Contenido normativo en lenguaje ciudadano.
   Fuente: Programa Municipal de Desarrollo Urbano de Arroyo Seco (versión abreviada),
   Periódico Oficial «La Sombra de Arteaga», 18 de febrero de 2026, pp. 9668-9710,
   y Memoria Técnica del Programa, versión del 2 de diciembre de 2025 (232 páginas).
   Cartografía: zonificación secundaria M03, corte del 1 de diciembre de 2025. */

/* ===== Datos editables en un solo lugar ===== */
window.PMDU_CFG = {
  // Dirección final del sitio (para compartir). Vacío = usa la dirección donde esté alojado.
  urlSitio: '',
  // Datos de contacto: completar con el Municipio antes de difundir.
  ventanilla: 'Dirección de Desarrollo Urbano y Obras Públicas, Presidencia Municipal de Arroyo Seco',
  telefono: '',      // ej. '487 000 0000'
  horario: '',       // ej. 'Lunes a viernes, 9:00 a 15:00'
  whatsapp: '',      // número institucional, si se define
  // Sitio del mecanismo de reporte ciudadano (en construcción con el Municipio)
  urlReporte: 'https://eduardolusan-source.github.io/Reporteciudadano/',
  urlComic: 'https://eduardolusan-source.github.io/Reporteciudadano/comic_mientras_el_campo_viva.pdf',
  urlEcotonos: 'https://labrural.org/proyectos/ecotonos-urbanos-y-rurales-del-valle-agricola-de-conca/'
};

window.PMDU_COLOR = {
  'HR,As':'#ffffe5','HR,Mn':'#fefe8c','HR,Bj':'#fef507',
  'HM,As':'#fff2cc','HM,Mn':'#fee8a5','HM,Bj':'#f6d587','HM,Md':'#feb565',
  'HMM,As':'#d7cfc1','HMM,Mn':'#d7b2ab','HMM,Bj':'#fee007',
  'CS,As':'#ffe5e5','CS,Mn':'#ffcccc','CS,Bj':'#ffa6a6','CS,Md':'#ff8c8c',
  'E':'#4290f4','I':'#d0b3f6','ECO':'#78c0c8','PCCA':'#bee8ff','ZAM':'#88b286','ZN':'#186430'
};

/* Densidades: tabla de Normas Generales del Programa */
window.PMDU_DENS = {
  As:{n:'aislada', viv:10, lote:1000, frente:20, libre:50, cos:0.50, cus:1.00, cas:0.35},
  Mn:{n:'mínima',  viv:20, lote:500,  frente:15, libre:40, cos:0.60, cus:1.20, cas:0.30},
  Bj:{n:'baja',    viv:35, lote:350,  frente:12, libre:30, cos:0.70, cus:1.40, cas:0.25},
  Md:{n:'media',   viv:59, lote:200,  frente:10, libre:25, cos:0.75, cus:1.50, cas:0.20}
};

window.PMDU_FAM = {
  /* vs: 'si' = se puede construir con licencia · 'cond' = uso especial o con condiciones · 'no' = no se urbaniza */
  HR:{t:'Habitacional rural', corto:'Vivienda rural', vs:'si', v:'Aquí sí se puede construir vivienda, con licencia.',
    q:'Localidades rurales: casas con comercio y servicios de nivel básico.',
    si:['Vivienda rural','Tienda, taller o servicio vecinal','Subdividir para casas en lotes desde 200 m², con 10 m de frente'],
    no:['Más de 2 niveles o 6 metros de altura','Más viviendas de las que marca la clave','Abrir un giro sin dictamen de uso de suelo'],
    tram:'Antes de construir, pide el dictamen de uso de suelo y la licencia en Desarrollo Urbano.'},
  HM:{t:'Habitacional mixto', corto:'Vivienda con comercio básico', vs:'si', v:'Aquí sí se puede construir vivienda y comercio básico, con licencia.',
    q:'Vivienda que convive con comercios básicos y servicios vecinales.',
    si:['Vivienda','Comercio básico en el mismo predio','Equipamiento compatible'],
    no:['Más de 2 niveles o 6 metros de altura','Lotes más chicos que el lote tipo','Giros de mayor impacto sin dictamen'],
    tram:'Antes de construir o abrir un negocio, pide el dictamen de uso de suelo y la licencia en Desarrollo Urbano.'},
  HMM:{t:'Habitacional mixto medio', corto:'Vivienda con comercio más intenso', vs:'si', v:'Aquí sí se puede construir vivienda y comercio, con licencia.',
    q:'Vivienda con comercios y servicios más intensos, que pueden estar en el mismo predio.',
    si:['Vivienda','Comercios y servicios de intensidad media','Usos mezclados en el mismo predio'],
    no:['Más de 2 niveles o 6 metros de altura','Giros no compatibles sin dictamen'],
    tram:'Antes de construir o abrir un negocio, pide el dictamen de uso de suelo y la licencia en Desarrollo Urbano.'},
  CS:{t:'Comercio y servicios', corto:'Comercio y servicios', vs:'si', v:'Aquí sí se puede construir comercio, servicios y vivienda, con licencia.',
    q:'Zona donde predominan el comercio y los servicios. Puede integrar vivienda.',
    si:['Comercio y servicios','Vivienda con la densidad de la clave'],
    no:['Giros prohibidos por la Tabla de Compatibilidad','Operar sin dictamen de uso de suelo','Más de 2 niveles'],
    tram:'Pide el dictamen de uso de suelo antes de abrir.'},
  E:{t:'Equipamiento', corto:'Servicios a la comunidad', vs:'cond', v:'Zona reservada para servicios a la comunidad.',
    q:'Escuelas, salud, deporte, abasto, cultura y servicios públicos.',
    si:['Equipamiento educativo, de salud, deportivo y cultural','Mercados municipales'],
    no:['Usos privados incompatibles'],
    tram:'Cualquier cambio de destino pasa por el Ayuntamiento.'},
  I:{t:'Industria', corto:'Procesos productivos', vs:'cond', v:'Zona para actividad industrial.',
    q:'Transformación, almacenaje y distribución de productos. Solo existe en la cabecera.',
    regla:'Lote tipo de 300 m² · frente mínimo de 15 m · 2 niveles',
    si:['Procesos productivos','Almacenaje y distribución'],
    no:['Vivienda','Ocupar más del 80% del predio'],
    tram:'Pide el dictamen de uso de suelo y la licencia en Desarrollo Urbano.'},
  ECO:{t:'Ecoturístico', corto:'Turismo de bajo impacto', vs:'cond', v:'Solo proyectos de turismo de bajo impacto.',
    q:'Sitios donde la naturaleza permite recibir visitantes sin dañarla.',
    regla:'80% del predio libre de construcción · máximo 2 niveles',
    si:['Proyectos ecoturísticos de bajo impacto','Instalaciones ligeras'],
    no:['Construir en más del 20% del predio','Fraccionar para vivienda'],
    tram:'El proyecto necesita visto bueno de SEMARNAT y CONANP antes del permiso municipal.'},
  PCCA:{t:'Protección a cauces y cuerpos de agua', corto:'Ríos, arroyos y bordos', vs:'no', v:'Aquí no se construye: es el espacio del agua.',
    q:'Ríos, arroyos, presas y bordos, con sus riberas y zonas federales.',
    si:['Cuidar y restaurar la ribera','Ecoturismo de bajo impacto, con opinión de CONANP'],
    no:['Construir o lotificar','Ocupar el cauce, la ribera o la zona federal'],
    tram:'Cualquier intervención pasa por la autoridad del agua y por CONANP.'},
  ZAM:{t:'Zona de amortiguamiento', corto:'Campo y monte', vs:'no', v:'Aquí no se urbaniza ni se lotifica. Se siembra y se cuida.',
    q:'Campo, parcelas y monte que protegen a la Reserva de la Biosfera Sierra Gorda. Son 91 de cada 100 hectáreas del municipio.',
    si:['Seguir sembrando y criando ganado','Actividades productivas de las comunidades, compatibles con el Programa de Manejo de la Reserva'],
    no:['Urbanizar','Lotificar para vender','Desmontar sin autorización'],
    tram:'Las autorizaciones de aprovechamiento las expiden SEMARNAT y CONANP.'},
  ZN:{t:'Zona núcleo', corto:'Lo mejor conservado', vs:'no', v:'Solo conservación.',
    q:'Los ecosistemas mejor conservados de la Reserva de la Biosfera Sierra Gorda.',
    si:['Preservación','Investigación y educación ambiental'],
    no:['Urbanizar o construir','Aprovechamientos que alteren el ecosistema'],
    tram:'Las autorizaciones corresponden a SEMARNAT y CONANP.'}
};

/* Leyenda simple: cinco grupos en palabras de todos los días */
window.PMDU_GRUPOS = [
  {k:'vive', t:'Aquí sí se construye', d:'Vivienda y comercio, con licencia', f:['HR','HM','HMM','CS'], c:['#fefe8c','#feb565','#fee007','#ffa6a6']},
  {k:'serv', t:'Servicios a la comunidad', d:'Escuelas, salud, deporte', f:['E','I'], c:['#4290f4']},
  {k:'tur', t:'Turismo de bajo impacto', d:'Zonas ecoturísticas', f:['ECO'], c:['#78c0c8']},
  {k:'agua', t:'El espacio del agua', d:'Ríos, arroyos y bordos: no se construye', f:['PCCA'], c:['#bee8ff']},
  {k:'campo', t:'Campo y monte', d:'No se urbaniza ni se lotifica', f:['ZAM','ZN'], c:['#88b286','#186430']}
];

window.PMDU_FAM_ORDEN = ['HR','HM','HMM','CS','E','I','ECO','PCCA','ZAM','ZN'];

/* Superficies oficiales (tabla de zonificación secundaria publicada) */
window.PMDU_SUP = {
  'HR,As':388.32,'HR,Bj':27.58,'HR,Mn':309.70,'HM,As':17.48,'HM,Bj':52.42,'HM,Md':65.81,'HM,Mn':117.17,
  'HMM,As':43.86,'HMM,Bj':89.33,'HMM,Mn':12.16,'CS,As':39.76,'CS,Bj':12.19,'CS,Md':1.03,'CS,Mn':33.31,
  'E':126.07,'I':4.56,'PCCA':34.95,'ZAM':66682.22,'ZN':5019.51
};

/* Áreas de actuación del Programa (apartado 5.2.3) */
window.PMDU_AREAS = {
  CP:{t:'Conservación patrimonial', d:'Dentro del polígono se regulan las intervenciones para cuidar el paisaje urbano histórico. Las obras requieren autorización del INAH.'},
  CA:{t:'Protección y conservación ambiental', d:'Tierras, aguas y bosques que deben preservarse para mantener el equilibrio ambiental.'},
  PCA:{t:'Protección a cuerpos de agua y escurrimientos', d:'Mecanismos especiales de protección para los ríos Santa María, Ayutla y Jalpan.'},
  MU:{t:'Mejoramiento urbano', d:'Localidad que creció más rápido que sus servicios: se priorizan calles, redes, vivienda, equipamiento, saneamiento y mitigación de riesgos.'},
  CU:{t:'Consolidación urbana', d:'Localidad que funciona como centro de servicios: se refuerzan su infraestructura, su equipamiento y sus vialidades.'},
  PT:{t:'Potencial turístico', d:'Se fomentan el ecoturismo y los recorridos culturales de bajo impacto, sin perder la vocación de conservación.'},
  CUA:{t:'Borde entre el pueblo y la parcela', d:'Área de consolidación urbana y conservación agrícola: el borde puede habilitarse como espacio de recreación, cuidando la producción y la vegetación que ya existen.'}
};
window.PMDU_AREAS_LISTA = {
  CA:['Reserva de la Biosfera Sierra Gorda','Macizo montañoso de Pinal de Amoles y Arroyo Seco','Cadena montañosa Puente de Ayutla','Cadena montañosa de San José de las Flores','Valle de Concá y ribera del río Santa María','Valle de Arroyo Seco','Valle de Purísima de Arista'],
  PCA:['Río Santa María','Río Ayutla','Río Jalpan'],
  MU:['Mesas de Agua Fría','Las Trancas','Mesa de Palo Blanco','La Tinaja','La Huastequita','El Salitrillo','Ayutla','El Tepozán','Crucero del Sabinito','La Ceja – El Riachuelo'],
  CU:['El Refugio','Purísima de Arista','La Florida','Concá','San Juan Buenaventura','Cabecera municipal'],
  PT:['Río del Carrizal','Vegas Cuatas','Santa María de Cocos (Sótano del Barro)','Ayutla – Las Adjuntas','Concá','El Quirino (Sótano del Jabalí)','La Lagunita','La Florida','El Sabino','El Tepozán'],
  CUA:['Arroyo Seco (cabecera)','El Salitrillo','Las Trancas','Mesa de Palo Blanco','Mesas de Agua Fría','Río del Carrizal','Tierras Prietas','Valle agrícola de Concá'],
  CP:['Polígono de Protección Patrimonial de la cabecera municipal']
};

/* Intervenciones estratégicas (apartado 6.3) */
window.PMDU_PROYECTOS = [
  {t:'Red de senderos',l:['Varias localidades'],e:'Movilidad'},
  {t:'Corredor urbano sobre la carretera 69',l:['Cabecera municipal','Concá','Purísima de Arista'],e:'Movilidad'},
  {t:'Paraderos de transporte público',l:['Varias localidades'],e:'Movilidad'},
  {t:'Pasos de fauna',l:['El Trapiche – Panales','Cabecera – Mesas de Agua Fría'],e:'Ambiente'},
  {t:'Regeneración de la ribera de la acequia madre',l:['Concá'],e:'Ambiente'},
  {t:'Regeneración del área turística de la ribera de Las Adjuntas',l:['Ayutla – Las Adjuntas'],e:'Ambiente'},
  {t:'Cruces peatonales tipo canopy',l:['Vegas Cuatas','Río del Carrizal','Ayutla'],e:'Ambiente'},
  {t:'Mercado municipal',l:['Cabecera municipal'],e:'Economía'},
  {t:'Módulo de turismo',l:['Cabecera municipal','Concá','Purísima de Arista'],e:'Economía'},
  {t:'Escuela de artes y oficios',l:['Cabecera municipal'],e:'Comunidad'},
  {t:'Biblioteca itinerante',l:['Cabecera municipal','Concá','Purísima de Arista','San Juan Buenaventura','La Florida','Santa María de Cocos'],e:'Comunidad'},
  {t:'Mercado artesanal',l:['Cabecera municipal'],e:'Economía'},
  {t:'Centro ecoturístico',l:['Ayutla','Vegas Cuatas','Río del Carrizal'],e:'Economía'},
  {t:'Módulo de sanitarios públicos',l:['Cabecera municipal','Concá'],e:'Comunidad'},
  {t:'Centro integral de apoyo rural',l:['Concá','San Juan Buenaventura','La Florida'],e:'Economía'},
  {t:'Centro de capacitación para el trabajo',l:['Cabecera municipal','Concá'],e:'Comunidad'}
];

/* Utilidades compartidas */
window.PMDU = {
  fam:function(c){return (c||'').split(',')[0]},
  dens:function(c){var p=(c||'').split(',');return p.length>1?p[1]:null},
  nombre:function(c){var f=PMDU_FAM[this.fam(c)],d=PMDU_DENS[this.dens(c)];return (f?f.t:c)+(d?', densidad '+d.n:'')},
  prim:function(p){return p==='U'?'Urbano':p==='Z'?'Urbanizable':'No urbanizable'},
  plazo:function(z){return z==='C'?'corto plazo (a 2030)':z==='M'?'mediano plazo (2031-2039)':z==='L'?'largo plazo (2040-2050)':''},
  fmt:function(n){return Number(n).toLocaleString('es-MX')}
};
