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
   eje: índice sugerido en EJES (0 = I … 6 = VII). El taller no lo pregunta: se precarga y la coordinación lo ajusta al integrar. */
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

/* Sugerencias por línea de trabajo del CIDAF: aparecen junto a los campos del taller.
   Son las tres líneas sobre las que trabaja el centro. */
window.LINEAS = [
  { nombre: "Desarrollo rural",
    preguntas: ["¿A quién afecta más el problema (mujeres, jóvenes, personas mayores, localidades alejadas)?", "¿Qué ya hace la comunidad por su cuenta y cómo podría respaldarlo el municipio?"],
    fuentes: ["CONEVAL, medición municipal de pobreza", "INEGI, Censo 2020", "Diagnósticos participativos propios"],
    areas: ["Desarrollo Social", "DIF municipal", "Salud municipal", "Educación y Cultura", "Delegaciones municipales"],
    vinc: ["IMSS-Bienestar", "Secretaría de Salud Qro.", "INAES", "Ejidos y comunidades"],
    fondos: ["FAISMUN (Ramo 33)", "Recursos propios", "INAES", "Cooperación internacional"],
    indicadores: [
      { nombre: "% de localidades con comité comunitario activo", fuente: "Registro de Desarrollo Social" },
      { nombre: "Número de mujeres y jóvenes en proyectos comunitarios con acompañamiento", fuente: "Registro municipal; UAQ" },
      { nombre: "Prevalencia de sobrepeso u obesidad en la población escolar atendida", fuente: "Tamizaje anual UAQ / Salud" }
    ]
  },
  { nombre: "Economía",
    preguntas: ["¿Qué producto o práctica local tiene potencial y qué lo frena?", "¿Qué pasaría con el ingreso de las familias si se atiende?"],
    fuentes: ["SIAP / SADER", "INEGI, Censo Agropecuario", "Tu trabajo con productores"],
    areas: ["Desarrollo Agropecuario", "Desarrollo Económico y Turismo", "Tesorería"],
    vinc: ["SADER", "SEDEA Qro.", "INAES", "Secretaría de Turismo Qro.", "Ejidos y comunidades"],
    fondos: ["SADER", "SEDEA Qro.", "INAES", "Recursos propios", "Convenio UAQ"],
    indicadores: [
      { nombre: "Número de productores con asistencia técnica continua", fuente: "Padrón de Desarrollo Agropecuario; UAQ" },
      { nombre: "Variedades criollas conservadas en bancos comunitarios de semilla", fuente: "Inventario anual UAQ" },
      { nombre: "Ingreso anual por venta de productos con valor agregado", fuente: "Encuesta a productores (UAQ)" }
    ]
  },
  { nombre: "Medio ambiente",
    preguntas: ["¿Qué especie, ecosistema o servicio ambiental está en riesgo y cuánto se ha perdido?", "¿Qué competencia ambiental ya tiene el municipio y no ejerce?"],
    fuentes: ["CONANP, Programa de Manejo de la RBSG", "CONABIO", "Tu propio monitoreo o tesis"],
    areas: ["Ecología / Medio Ambiente", "Desarrollo Agropecuario", "Delegaciones municipales"],
    vinc: ["CONANP-RBSG", "PROFEPA", "CONAFOR", "SEMARNAT", "SEDESU Qro.", "Comités de vigilancia ambiental"],
    fondos: ["PROCODES (CONANP)", "Pago por servicios ambientales (CONAFOR)", "Recursos propios", "Cooperación internacional"],
    indicadores: [
      { nombre: "Hectáreas bajo restauración o manejo comunitario", fuente: "Registro municipal; verificación satelital UAQ" },
      { nombre: "Metros lineales de andador con mantenimiento programado", fuente: "Bitácora de Ecología; recorrido semestral UAQ" },
      { nombre: "Número de especies nativas monitoreadas con tendencia estable o al alza", fuente: "Monitoreo anual UAQ Campus Concá" }
    ]
  }
];

window.ejeIndex = function (eje) { return window.EJES.indexOf(eje); };
