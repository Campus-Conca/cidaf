/* ============================================================
   Taller de fichas — datos compartidos (fichas.html y tablero.html)
   Para sumar o corregir colegas, edita COLEGAS.
   ============================================================ */

window.EJES = [
  "I. Gobernanza, hacienda y transparencia",
  "II. Gestión ambiental y RBSG",
  "III. Ordenamiento territorial",
  "IV. Agua y servicios públicos",
  "V. Desarrollo económico sostenible",
  "VI. Desarrollo social y comunidades rurales",
  "VII. Protección civil y gestión del riesgo"
];

/* Integrantes que manifestaron interés (minuta CIDAF, 6 de agosto de 2026, v3.4).
   eje: índice sugerido en EJES (0 = I … 6 = VII); es solo una sugerencia editable. */
window.COLEGAS = [
  { id: "eduardo-luna", nombre: "Eduardo Luna Sánchez", linea: "Planeación territorial participativa", tema: "Mecanismo para detener cambios irregulares de uso de suelo", eje: 2, ejemplo: true },
  { id: "guillermo-pena", nombre: "Guillermo Peña", linea: "Producción agroecológica y agroacuícola", tema: "Cultivo de especies acuícolas nativas", eje: 4 },
  { id: "julieta-sanchez", nombre: "Julieta Sánchez", linea: "Fisiología y metabolismo de organismos acuáticos nativos", tema: "", eje: 1 },
  { id: "marcela-quiroz", nombre: "Marcela Quiroz Sodi", linea: "Botánica aplicada y desarrollo sustentable", tema: "Andador ecológico La Maroma–Salitrillo", eje: 1, con: "Octavio Roldán Padrón" },
  { id: "octavio-roldan", nombre: "Octavio Roldán Padrón", linea: "Botánica aplicada y desarrollo sustentable", tema: "Andador ecológico La Maroma–Salitrillo", eje: 1, con: "Marcela Quiroz Sodi" },
  { id: "perla-ocampo", nombre: "Perla Viridiana Ocampo Anguiano", linea: "Nutrición humana en enfermedades crónico-degenerativas", tema: "", eje: 5 },
  { id: "alma-moya", nombre: "Alma Rosa Moya Alvarado", linea: "Género, feminismos, intervención comunitaria y problemáticas socioambientales", tema: "Manejo agroecológico de cultivos prioritarios (maíz, frijol y miel)", eje: 4 },
  { id: "mayra-chavez", nombre: "Mayra Chávez", linea: "Tecnología social y participación comunitaria para el desarrollo rural sostenible", tema: "Asesoría para el diseño y mejora de programas municipales que fortalezcan la organización y participación comunitaria", eje: 5 },
  { id: "ivan-gomez", nombre: "Iván Gómez", linea: "Producción animal (ovina, caprina y bovina)", tema: "Suplementos alimenticios para ganado", eje: 4 },
  { id: "alexandro-escobar", nombre: "Alexandro Escobar", linea: "Ciencia y tecnología de los alimentos", tema: "Conservación del maíz y frijol criollo y agroindustria rural", eje: 4 },
  { id: "adan-mercado", nombre: "Adán Mercado", linea: "", tema: "Perfiles ad hoc en los puestos de desarrollo agropecuario y convenio de colaboración con el CIDAF", eje: 0 }
];

/* Kit de ideas por eje: sugerencias que aparecen en cada paso del taller. */
window.KIT = [
  { // I
    preguntas: ["¿Qué capacidad institucional falta para que otras recomendaciones funcionen?", "¿Hay un perfil de puesto, un convenio o un trámite que destrabaría varias cosas a la vez?"],
    fuentes: ["INEGI, Censo Nacional de Gobiernos Municipales", "INAFED, Guía Consultiva de Desempeño Municipal", "Cuenta pública municipal"],
    areas: ["Presidencia municipal", "Tesorería", "Cabildo", "Desarrollo Agropecuario"],
    vinc: ["INAFED", "Secretaría de Planeación y Finanzas Qro.", "UAQ Campus Concá"],
    fondos: ["Recursos propios", "FORTAMUN", "Convenio UAQ"],
    leyes: ["Constitución, Art. 115", "Ley Orgánica Municipal del Estado de Querétaro", "Ley de Planeación del Estado de Querétaro", "Ley de Transparencia y Acceso a la Información Pública del Estado de Querétaro"],
    indicadores: [
      { nombre: "% de puestos técnicos ocupados por perfiles con formación afín", fuente: "Plantilla municipal; revisión anual UAQ" },
      { nombre: "Convenio de colaboración municipio–UAQ firmado y con programa anual (sí/no)", fuente: "Actas de cabildo" },
      { nombre: "% de trámites municipales con requisitos publicados en línea", fuente: "Portal municipal" }
    ]
  },
  { // II
    preguntas: ["¿Qué especie, ecosistema o servicio ambiental está en riesgo y cuánto se ha perdido?", "¿Qué competencia ambiental ya tiene el municipio y no ejerce?"],
    fuentes: ["CONANP, Programa de Manejo de la RBSG", "CONABIO", "Tu propio monitoreo o tesis"],
    areas: ["Ecología / Medio Ambiente", "Desarrollo Agropecuario", "Delegaciones municipales"],
    vinc: ["CONANP-RBSG", "PROFEPA", "CONAFOR", "SEMARNAT", "SEDESU Qro.", "Comités de vigilancia ambiental"],
    fondos: ["PROCODES (CONANP)", "Pago por servicios ambientales (CONAFOR)", "Recursos propios", "Cooperación internacional"],
    leyes: ["LGEEPA", "Programa de Manejo de la RBSG (1999)", "Ley General de Desarrollo Forestal Sustentable", "Ley General para la Prevención y Gestión Integral de los Residuos", "NOM-059-SEMARNAT-2010"],
    indicadores: [
      { nombre: "Hectáreas bajo restauración o manejo comunitario", fuente: "Registro municipal; verificación satelital UAQ" },
      { nombre: "Metros lineales de andador con mantenimiento programado", fuente: "Bitácora de Ecología; recorrido semestral UAQ" },
      { nombre: "Número de especies nativas monitoreadas con tendencia estable o al alza", fuente: "Monitoreo anual UAQ Campus Concá" }
    ]
  },
  { // III
    preguntas: ["¿Qué instrumento de planeación existe pero no se aplica?", "¿Qué se pierde de forma irreversible cada año si no se actúa?"],
    fuentes: ["PMDU de Arroyo Seco", "Talleres participativos EDVAC-UAQ (2025)", "Imágenes satelitales (INEGI, Google Earth)"],
    areas: ["Obras Públicas y Desarrollo Urbano", "Tesorería", "Cabildo", "Delegaciones municipales"],
    vinc: ["SEDESU Qro.", "CONAGUA", "CONANP-RBSG", "PROFEPA", "Registro Agrario Nacional"],
    fondos: ["Recursos propios", "Convenio UAQ", "SEDESU Qro."],
    leyes: ["LGAHOTDU", "Código Urbano del Estado de Querétaro", "PMDU de Arroyo Seco", "Ley Agraria", "Ley de Aguas Nacionales"],
    indicadores: [
      { nombre: "% de obras en construcción con licencia vigente", fuente: "Padrón municipal de licencias" },
      { nombre: "Hectáreas con cambio de uso de suelo no autorizado", fuente: "Imagen satelital anual (UAQ)" },
      { nombre: "% de delegaciones con mapa de zonificación visible", fuente: "Recorrido anual UAQ" }
    ]
  },
  { // IV
    preguntas: ["¿Cuánta agua se pierde, se contamina o no llega?", "¿Quién opera hoy el sistema y con qué recursos?"],
    fuentes: ["CONAGUA, REPDA", "CEA Querétaro", "Muestreos propios de calidad del agua"],
    areas: ["Organismo o comités de agua", "Obras Públicas y Desarrollo Urbano", "Salud municipal"],
    vinc: ["CONAGUA", "CEA Querétaro", "Secretaría de Salud Qro.", "Ejidos y comunidades"],
    fondos: ["FAISMUN (Ramo 33)", "Recursos propios", "Programas de CONAGUA"],
    leyes: ["Ley de Aguas Nacionales", "NOM-127-SSA1-2021", "Ley Orgánica Municipal del Estado de Querétaro"],
    indicadores: [
      { nombre: "% de tomas con cloro residual dentro de norma", fuente: "Muestreo trimestral UAQ / Salud" },
      { nombre: "% de pérdidas por fugas en las redes comunitarias", fuente: "Macromedición municipal" },
      { nombre: "% de aguas residuales con tratamiento", fuente: "Informe anual del organismo de agua" }
    ]
  },
  { // V
    preguntas: ["¿Qué producto o práctica local tiene potencial y qué lo frena?", "¿Qué pasaría con el ingreso de las familias si se atiende?"],
    fuentes: ["SIAP / SADER", "INEGI, Censo Agropecuario", "Tu trabajo con productores"],
    areas: ["Desarrollo Agropecuario", "Desarrollo Económico y Turismo", "Tesorería"],
    vinc: ["SADER", "SEDEA Qro.", "INAES", "Secretaría de Turismo Qro.", "Ejidos y comunidades"],
    fondos: ["SADER", "SEDEA Qro.", "INAES", "Recursos propios", "Convenio UAQ"],
    leyes: ["Ley de Desarrollo Rural Sustentable", "Ley de la Economía Social y Solidaria", "Ley Agraria"],
    indicadores: [
      { nombre: "Número de productores con asistencia técnica continua", fuente: "Padrón de Desarrollo Agropecuario; UAQ" },
      { nombre: "Variedades criollas conservadas en bancos comunitarios de semilla", fuente: "Inventario anual UAQ" },
      { nombre: "Ingreso anual por venta de productos con valor agregado", fuente: "Encuesta a productores (UAQ)" }
    ]
  },
  { // VI
    preguntas: ["¿A quién afecta más el problema (mujeres, jóvenes, personas mayores, localidades alejadas)?", "¿Qué ya hace la comunidad por su cuenta y cómo podría respaldarlo el municipio?"],
    fuentes: ["CONEVAL, medición municipal de pobreza", "INEGI, Censo 2020", "Diagnósticos participativos propios"],
    areas: ["Desarrollo Social", "DIF municipal", "Salud municipal", "Educación y Cultura", "Delegaciones municipales"],
    vinc: ["IMSS-Bienestar", "Secretaría de Salud Qro.", "INAES", "Ejidos y comunidades"],
    fondos: ["FAISMUN (Ramo 33)", "Recursos propios", "INAES", "Cooperación internacional"],
    leyes: ["Ley General de Desarrollo Social", "Ley General de Salud", "Ley de la Economía Social y Solidaria"],
    indicadores: [
      { nombre: "% de localidades con comité comunitario activo", fuente: "Registro de Desarrollo Social" },
      { nombre: "Número de mujeres y jóvenes en proyectos comunitarios con acompañamiento", fuente: "Registro municipal; UAQ" },
      { nombre: "Prevalencia de sobrepeso u obesidad en la población escolar atendida", fuente: "Tamizaje anual UAQ / Salud" }
    ]
  },
  { // VII
    preguntas: ["¿Qué evento extremo ya ocurrió y qué dejó?", "¿Qué localidades están más expuestas y por qué?"],
    fuentes: ["CENAPRED", "Atlas estatal de riesgos", "Registros de Protección Civil"],
    areas: ["Protección Civil", "Obras Públicas y Desarrollo Urbano", "Delegaciones municipales"],
    vinc: ["Coordinación Estatal de Protección Civil", "CONAGUA", "CONAFOR"],
    fondos: ["Recursos propios", "Fondos estatales de protección civil", "FAISMUN (Ramo 33)"],
    leyes: ["Ley General de Protección Civil", "Ley de Protección Civil del Estado de Querétaro"],
    indicadores: [
      { nombre: "Atlas municipal de riesgo actualizado y publicado (sí/no)", fuente: "Protección Civil municipal" },
      { nombre: "Número de localidades con plan comunitario de emergencia", fuente: "Protección Civil; UAQ" },
      { nombre: "Hectáreas afectadas por incendio forestal al año", fuente: "CONAFOR" }
    ]
  }
];

window.ejeIndex = function (eje) { return window.EJES.indexOf(eje); };
