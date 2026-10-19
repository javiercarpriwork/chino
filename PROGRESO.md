# Progreso

Última actualización: 19 de octubre de 2026.

## Dónde estamos
**Las cinco fases están hechas por mi parte.** Solo falta que Javi publique la app (`PUBLICAR.md`), que necesita su cuenta de GitHub.

| Fase | Qué es | Estado |
|---|---|---|
| 1 | Escenas (`scenes.json`) y comprobación | **hecha** |
| 2 | Sesión diaria y repaso | **hecha** |
| 3 | Micro: "grábate y compárate" y reconocimiento de voz | **hecha** |
| 4 | Icono, sin internet, recordatorio y diseño | **hecha** |
| 5 | Publicar en GitHub Pages e instalar en el iPhone | **le toca a Javi** (`PUBLICAR.md`) |

## Qué hay hecho
- `scenes.json`: los 28 días (280 líneas de diálogo, 84 preguntas, 140 retos, 550 frases de ejemplo).
- La app: `index.html`, `estilos.css` y `js/` (datos, almacen, voz, repaso, sesion, pinyin, pantallas, recordatorio, grabadora, reconocer).
- `manifest.webmanifest` + `iconos/`: se instala con su icono y a pantalla completa.
- `sw.js` (v3): guarda los 19 archivos; después funciona sin internet.
- Comprobaciones: `tools/validar.mjs` (escenas, limpio) y `tools/test-repaso.mjs` (41 pruebas, todas bien).
- Repositorio de git con cuatro commits.

## Los tres tipos de sesión
La sesión se adapta al día en el que estés. Lo decide `planificar()` en `js/sesion.js`.

| Días | Qué pasa | Dura |
|---|---|---|
| 1 a 28 | Los seis pasos de siempre | 25 min |
| 29 y 30 | **Prueba final de escucha** en el hueco de las palabras nuevas | 25 min |
| 31 en adelante | **Mantenimiento**: una escena al azar y repasos, nada más | 10 min |

- **Prueba final de escucha (días 29 y 30).** Suena algo que ya has aprendido —una palabra o una frase de una escena— y eliges su significado entre cuatro. Una de cada tres preguntas es una frase, y las frases salen de escenas distintas (como mucho dos de cada una). Caben 20 preguntas en esos 8 minutos. Esos días no entran palabras nuevas, la escena es una ya vista al azar, y los repasos atrasados **no** le quitan tiempo a la prueba. Al acabar la sesión ves tu puntuación ("Prueba de escucha: 14 de 20"). Puedes dejarla a medias con el botón de abajo.
- **Mantenimiento (desde el día 31).** Solo dos pasos: la escena al azar (3 min) y el repaso (7 min). Ni palabras nuevas, ni tonos, ni retos. El contador de días se queda en 31 y en Progreso pone "mantenimiento".

## El micrófono (fase 3)
- **Grábate y compárate** en los pasos 3 (Nuevas), 5 (Dilo tú) y 6 (Hazlo de verdad): botón 🎤 Grabarme, y luego "▶ Modelo y yo" reproduce el modelo y a continuación tu voz.
- Antes de pedir el micrófono se explica para qué es. La grabación **no se guarda**: vive mientras estás en esa palabra, y al acabar la sesión se suelta el micrófono.
- **"¿Me has entendido?"** (opcional): si el navegador sabe reconocer chino, dice lo que ha oído con su pinyin y si se parece a lo que tocaba. El pinyin sale de `vocab.json` y de las palabras de las escenas, sin librerías.
- Si no hay micrófono o no hay reconocimiento, se avisa en pequeño y **todo lo demás sigue funcionando**; nunca bloquea.
- Se puede apagar el reconocimiento en Ajustes.

## Probado el 19/10/2026
- Sesiones completas de los días 1 y 2: los seis pasos, las cajas (caja 1 → caja 2), "Otra vez" devuelve la tarjeta al final, lo que no cabe pasa a mañana.
- Grabación: pedir permiso → grabar → parar → "Modelo y yo" se activa. En los tres pasos.
- Reconocimiento: `我要一杯咖啡，謝謝` → `wǒ yào yī bēi kāfēi xièxie`, y la comparación distingue bien / casi / no es eso.
- Service worker, manifest, iconos y el `.ics` con `RRULE:FREQ=DAILY`.
- Sin errores en la consola.

### Los modos nuevos, probados el 19/10/2026
- **Día 29** (poniendo `diaPlan` a 29): Hoy dice "Día 29 de 30 · prueba final de escucha", 20 preguntas, 25 min. La sesión va 1/6 Oído → 2/6 La escena (una ya vista al azar) → **3/6 Prueba de escucha** → 4/6 Repaso → 5/6 Dilo tú → 6/6 Hazlo de verdad. En la prueba salieron palabras y frases de escenas distintas, el acierto se marca en verde y el fallo en rojo enseñando la buena, y al final apareció "Prueba de escucha: 1 de 3". Después el día pasó solo al 30.
- **Día 31**: Hoy dice "Mantenimiento · 10 minutos al día", sin palabras nuevas. La sesión es 1/2 La escena → 2/2 Repaso, el reloj marca 10 minutos, el resumen final solo trae repasos y tiempo, y el día se queda en 31.
- **Arreglado de paso:** la barra de pestañas de abajo tapaba media pantalla del botón grande durante la sesión (el `display: flex` de `nav#pestanas` ganaba al atributo `hidden`). Una línea de CSS: `nav#pestanas[hidden] { display: none; }`. Se notaba al tocar la parte baja del botón: en vez de avanzar, te sacaba a otra pestaña.

## Lo que tiene que hacer Javi
1. **Publicarla**: `PUBLICAR.md`, paso a paso.
2. **La voz china**: iPhone › Ajustes › Accesibilidad › Contenido leído › Voces › Chino (Taiwán). En el PC, añadir 中文 (繁體，台灣) con "Texto a voz".
3. Dar permiso al micrófono la primera vez que toque 🎤.
4. Decirme qué le chirría.

## Notas para mí (Claude)
- No tocar `vocab.json`.
- **Cada vez que cambie la app, subir `VERSION` en `sw.js`** y añadir los archivos nuevos a la lista. Si no, el móvil sigue con la versión vieja (me pasó al probar: hay que cerrar la app del todo y volver a abrirla).
- El micrófono necesita https: en el iPhone solo funcionará con la app ya publicada. En el ordenador, localhost vale.
- En el iPhone, el reconocimiento de voz puede no existir dentro de la app instalada; la grabación sí funciona. Por eso el método principal es "grábate y compárate".
- Identidad de git solo en este repositorio: Javi / javiercarpri.work@gmail.com.
