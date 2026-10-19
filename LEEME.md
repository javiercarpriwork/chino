# Empieza aquí

Esta carpeta es una app web para aprender chino de Taiwán. Se instala en el iPhone desde Safari, no hace falta Mac ni Xcode.

## Para seguir trabajando con Claude Code
1. Abre Claude Code en esta carpeta.
2. Escribe "sigue con la siguiente fase".

Claude Code se acuerda de todo gracias a `CLAUDE.md` (el plan) y `PROGRESO.md` (por dónde vamos).

## Qué hay en la carpeta
- `CLAUDE.md`: el plan completo de la app (Claude Code lo lee solo).
- `PROGRESO.md`: qué está hecho y qué falta.
- `vocab.json`: las 500 palabras y las 50 expresiones. No se toca.
- `scenes.json`: las 28 escenas (diálogos, preguntas y retos). Se crea en la fase 1.
- El resto de archivos son la app.

## Para ver la app en el ordenador
1. Abre la carpeta en el Explorador.
2. Haz clic en la barra de direcciones, escribe `cmd` y pulsa Intro.
3. Escribe `node tools/servidor.mjs` y pulsa Intro.
4. Abre el navegador en `http://localhost:5173`.
5. Para pararlo, pulsa Ctrl + C en esa ventana negra.

## Para ponerla en el iPhone
Se explica paso a paso en la fase 5: se publica gratis en internet y luego, en Safari, botón de compartir → "Añadir a pantalla de inicio".
