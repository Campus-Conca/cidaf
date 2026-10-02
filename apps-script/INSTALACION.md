# Taller de fichas · Instalación del servicio central

Sin esta instalación, `fichas.html` funciona completo en el navegador de cada persona: guía, consejos, ejemplos, guardado automático y descarga en Word. El servicio central agrega dos cosas:

| Qué agrega | Dónde se ve |
|---|---|
| **Envío a coordinación**: cada ficha enviada queda en una Hoja de Google, con todas sus versiones | Botón «Enviar a coordinación» en el último paso |
| **Tablero en vivo**: el avance de cada integrante | `tablero.html` |

No tiene costo: solo usa tu cuenta de Google. Tiempo estimado: **10 minutos**, una sola vez.

---

## 1. Crea la Hoja y el script (5 min)

1. En Google Drive crea una **Hoja de cálculo** nueva llamada `Fichas CIDAF · Arroyo Seco 2027–2030`.
2. En la Hoja: menú **Extensiones → Apps Script**.
3. Borra el contenido de `Código.gs` y pega todo el contenido de [`Code.gs`](Code.gs).
4. Guarda (💾).

## 2. Prepara las hojas (2 min)

En el editor de Apps Script, elige la función **`prepararHojas`** en el menú desplegable y pulsa **Ejecutar**. La primera vez Google pedirá permisos: *Revisar permisos → tu cuenta → Configuración avanzada → Ir a (no seguro) → Permitir*. Es normal en scripts propios.

Al terminar, la Hoja tiene dos pestañas nuevas: `Estado` y `Envíos`.

## 3. Publica como aplicación web (3 min)

1. **Implementar → Nueva implementación**.
2. Tipo (⚙️): **Aplicación web**.
3. Descripción: `Taller de fichas v1`.
4. **Ejecutar como: Yo**.
5. **Quién tiene acceso: Cualquier usuario** (así lo usan colegas sin iniciar sesión).
6. **Implementar** → copia la **URL de la aplicación web** (termina en `/exec`).

## 4. Conecta el sitio (1 min)

En el repositorio `cidaf`, abre `assets/taller-config.js` y pega la URL:

```js
window.TALLER_API_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";
```

Guarda y sube el cambio. En uno o dos minutos GitHub Pages lo publica. Comprueba:

- `tablero.html` dice «En vivo · actualizado…».
- En `fichas.html`, al elegir tu nombre en el paso 0 aparece una fila en la pestaña `Estado` de la Hoja.

---

## Cómo se usa después

- **Ver las fichas enviadas:** hoja `Envíos`. Cada fila es un envío con el texto completo (columna `texto`) y el respaldo (`json`). Para abrir una ficha en el taller, copia el `json` a un archivo `.json` y cárgalo con «cargar respaldo».
- **Ver el avance:** hoja `Estado` o `tablero.html`.
- **Si editas `Code.gs`:** *Implementar → Gestionar implementaciones → ✏️ → Versión: Nueva versión → Implementar*. La URL no cambia.
- **Sumar o corregir colegas:** `assets/taller-datos.js`, lista `COLEGAS`.
- **Cambiar los consejos y ejemplos de cada paso:** `fichas.html`, lista `TIPS`.

## Privacidad

- El tablero público muestra nombre, tema, título, eje, avance y pendientes. **No** muestra correos ni el contenido de las fichas.
- El contenido completo vive solo en tu Hoja de Google.
- Lo que escribe cada persona se guarda en la Hoja como texto, nunca como fórmula, para que nadie pueda usar el tablero para leer otras celdas.
- El servicio es abierto: no pide iniciar sesión. Cualquiera que conozca la dirección puede registrar avance con el nombre de otra persona, así que el tablero es una referencia de trabajo, no un registro oficial.

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
8. **Sin revisión con IA.** La primera versión pedía retroalimentación a Claude por la API de Anthropic, que se paga aparte de la suscripción. Se retiró. En su lugar, cada paso trae consejos y ejemplos preestablecidos («¿Te atoras?»), y el último paso tiene una revisión de coherencia que corre en el navegador.
9. **Los ejemplos de los consejos usan temas que nadie del equipo tiene asignados** (residuos, incendios, mercado de productores) y marcadores como [X] o [fuente] en lugar de cifras, para no inventar datos ni escribirle la ficha a nadie.
10. **Temas y ejes precargados** a partir de la minuta del 6 de agosto. Los ejes son una sugerencia y cada persona puede cambiarlos. Marcela Quiroz y Octavio Roldán comparten el tema del andador: el taller les avisa que se pongan de acuerdo para llenar una sola ficha.
11. **La ficha de Eduardo Luna aparece en el tablero como «Ficha ejemplo»**, ya lista.
