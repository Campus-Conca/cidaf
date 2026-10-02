# Taller de fichas · Instalación del servicio central

Sin esta instalación, `fichas.html` funciona completo en el navegador de cada persona: guía, ejemplo, guardado automático y descarga en Word. El servicio central agrega tres cosas:

| Qué agrega | Dónde se ve |
|---|---|
| **Envío a coordinación**: cada ficha enviada queda en una Hoja de Google, con todas sus versiones | Botón «Enviar a coordinación» en el último paso |
| **Tablero en vivo**: el avance de cada integrante | `tablero.html` |
| **Revisión con Claude**: retroalimentación por campo y revisión de coherencia de la ficha completa | Botones ✨ en cada paso y al final |

Tiempo estimado: **15 a 20 minutos**, una sola vez.

---

## 1. Crea la llave de la API de Anthropic (5 min)

La API se paga aparte de la suscripción a Claude.ai.

1. Entra a **console.anthropic.com** e inicia sesión o crea una cuenta (puede ser con tu correo de la UAQ).
2. En **Billing**, agrega un método de pago y compra créditos. Con 10 USD alcanza de sobra para el proyecto: cada revisión de un campo cuesta alrededor de 1 a 2 centavos de dólar y una revisión completa de coherencia alrededor de 3 a 5 centavos.
3. **Pon un tope de gasto**: en **Limits** (o **Spend limits**), fija un límite mensual, por ejemplo 15 USD. Como la plataforma es abierta, este tope es tu principal protección.
4. En **API Keys**, crea una llave llamada `taller-fichas-cidaf` y cópiala; empieza con `sk-ant-`. Guárdala en un lugar seguro porque solo se muestra una vez.

## 2. Crea la Hoja y el script (5 min)

1. En Google Drive crea una **Hoja de cálculo** nueva llamada `Fichas CIDAF · Arroyo Seco 2027–2030`.
2. En la Hoja: menú **Extensiones → Apps Script**.
3. Borra el contenido de `Código.gs` y pega todo el contenido de [`Code.gs`](Code.gs).
4. Guarda (💾).

## 3. Guarda la llave en el script (1 min)

1. En el editor de Apps Script, abre ⚙️ **Configuración del proyecto** (barra izquierda).
2. Baja a **Propiedades del script → Agregar propiedad del script**.
3. Propiedad: `ANTHROPIC_API_KEY` · Valor: la llave `sk-ant-…` → **Guardar**.

La llave queda dentro de tu cuenta de Google; nunca viaja al navegador de nadie.

## 4. Prueba (2 min)

1. Vuelve al editor (`< >`), elige la función **`prepararHojas`** en el menú desplegable y pulsa **Ejecutar**. La primera vez Google pedirá permisos: *Revisar permisos → tu cuenta → Configuración avanzada → Ir a (no seguro) → Permitir*. Es normal en scripts propios.
2. Elige **`probarClaude`** y ejecútala. En el **Registro de ejecución** debe aparecer una revisión del título «Agua para todos» con veredicto «falta trabajo».
   - Si dice `sin llave`, revisa el paso 3.
   - Si dice `api 401`, la llave está mal copiada.
   - Si dice `api 400` o `api 404` con un mensaje sobre el modelo, cambia `MODEL` al inicio de `Code.gs` por otro modelo vigente (por ejemplo `claude-opus-5`).

## 5. Publica como aplicación web (3 min)

1. **Implementar → Nueva implementación**.
2. Tipo (⚙️): **Aplicación web**.
3. Descripción: `Taller de fichas v1`.
4. **Ejecutar como: Yo**.
5. **Quién tiene acceso: Cualquier usuario** (así lo usan colegas sin iniciar sesión).
6. **Implementar** → copia la **URL de la aplicación web** (termina en `/exec`).

## 6. Conecta el sitio (1 min)

En el repositorio `cidaf`, abre `assets/taller-config.js` y pega la URL:

```js
window.TALLER_API_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";
```

Guarda y sube el cambio. En uno o dos minutos GitHub Pages lo publica. Comprueba:

- `tablero.html` dice «En vivo · actualizado…».
- En `fichas.html`, el botón ✨ de cualquier paso devuelve una revisión.

---

## Cómo se usa después

- **Ver las fichas enviadas:** hoja `Envíos`. Cada fila es un envío con el texto completo (columna `texto`) y el respaldo (`json`). Para abrir una ficha en el taller, copia el `json` a un archivo `.json` y cárgalo con «cargar respaldo».
- **Ver el avance:** hoja `Estado` o `tablero.html`.
- **Cambiar el límite diario de revisiones:** `DAILY_LIMIT` en `Code.gs`. Viene en 150 revisiones al día para todo el equipo.
- **Si editas `Code.gs`:** *Implementar → Gestionar implementaciones → ✏️ → Versión: Nueva versión → Implementar*. La URL no cambia.
- **Sumar o corregir colegas:** `assets/taller-datos.js`, lista `COLEGAS`.

## Privacidad

- El tablero público muestra nombre, tema, título, eje, avance y pendientes. **No** muestra correos ni el contenido de las fichas.
- El contenido completo vive solo en tu Hoja de Google.
- Lo que escribe cada persona se guarda en la Hoja como texto, nunca como fórmula, para que nadie pueda usar el tablero para leer otras celdas.
- Lo que se manda a Claude para revisión es el texto del campo o de la ficha; no se envían correos.

---

## Decisiones interpretativas

Decisiones tomadas en zonas grises durante la construcción, para revisarlas en conjunto:

1. **La ficha ejemplo se actualizó con los acuerdos del 17 de julio de 2026.** Frente a la versión del brief:
   - el mecanismo queda anclado al municipio (recibe, verifica y canaliza), sin un canal de denuncia paralelo;
   - el primer paso es socializar el PMDU y capacitar al municipio;
   - la rendición de cuentas es ante el Consejo Asesor de la RBSG, en lugar de crear un observatorio con personalidad jurídica;
   - el reporte exige foto y ubicación obligatorias;
   - se añadió una estrategia dirigida a compradores migrantes y a agentes inmobiliarios;
   - el título pasó a «Sistema municipal para prevenir y dar seguimiento a los cambios irregulares de uso de suelo»;
   - la meta se unificó en ≥ 80% de respuestas en 30 días (el brief decía 100% y la ficha 80%);
   - el diagnóstico se recortó a menos de 120 palabras para cumplir la regla de los 90 segundos;
   - se omitió el dato del «17% de municipios» porque no tenía fuente verificable.
2. **Acciones y Plazo se llenan en un solo paso.** Cada acción lleva su horizonte y el campo 6 se arma solo, con hitos opcionales. La ficha exportada conserva los 10 campos.
3. **Paso 0 «Compromiso»** antes del título, para aplicar la regla «solo proponemos lo que estamos dispuestos a acompañar». El nombre de quien acompaña alimenta el campo 5.
4. **Campos armados a partir de preguntas cortas.** Por ejemplo, el diagnóstico se construye con problema, dato, fuente y consecuencia, y el objetivo con verbo, qué y meta.
5. **Botón «Aún no lo tengo claro»** en cada paso: marca el campo como pendiente sin bloquear el avance. Los campos ★ muestran un aviso rojo si quedan vacíos, pero no impiden continuar.
6. **Identidad visual del sitio del CIDAF** (azul marino y ámbar, Fraunces + Source Sans 3) en lugar de la paleta oscura del brief, para mantener una sola voz institucional.
7. **Exportación a Word en formato `.doc` basado en HTML**, que Word abre sin problema. Se eligió así porque no depende de librerías externas: funciona sin conexión y sin CDN.
8. **Modelo `claude-sonnet-5` con `effort: low` y salida en JSON validado por esquema**: rápido, barato y suficiente para retroalimentación editorial. Se cambia en una línea (`MODEL`).
9. **Acceso abierto con tres protecciones**: tope de gasto en la consola, límite diario de 150 revisiones y tope de texto por revisión.
10. **Temas y ejes precargados** a partir de la minuta del 6 de agosto. Los ejes son una sugerencia y cada persona puede cambiarlos. Marcela Quiroz y Octavio Roldán comparten el tema del andador: el taller les avisa que se pongan de acuerdo para llenar una sola ficha.
11. **La ficha de Eduardo Luna aparece en el tablero como «Ficha ejemplo»**, ya lista.
