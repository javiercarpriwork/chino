# Empieza aquí

Esta carpeta es una app web para aprender chino de Taiwán. Se instala en el iPhone desde Safari, sin Mac y sin Xcode.

## Para usarla en el ordenador
1. Abre la carpeta en el Explorador.
2. Haz clic en la barra de direcciones, escribe `cmd` y pulsa Intro.
3. Escribe `node tools/servidor.mjs` y pulsa Intro.
4. Abre el navegador en `http://localhost:5173`.
5. Para pararlo, pulsa Ctrl + C en esa ventana.

En la misma ventana sale otra dirección: esa es para abrirla **en el iPhone** estando en el mismo wifi.

## Para ponerla en el iPhone de verdad
Sigue `PUBLICAR.md` paso a paso: se publica gratis en internet y se instala desde Safari.

## Para seguir trabajando con Claude Code
Abre Claude Code en esta carpeta y escribe "sigue con la siguiente fase".
Se acuerda de todo gracias a `CLAUDE.md` (el plan) y `PROGRESO.md` (por dónde vamos).

## Qué hay en la carpeta
- `CLAUDE.md`: el plan completo de la app.
- `PROGRESO.md`: qué está hecho y qué falta.
- `PUBLICAR.md`: cómo publicarla y meterla en el iPhone.
- `index.html`, `estilos.css`, `js/`: la app.
- `vocab.json`: las 500 palabras y las 50 expresiones. No se toca.
- `scenes.json`: las 28 escenas con sus diálogos, preguntas y retos.
- `tools/`: el servidor local y las comprobaciones (`validar.mjs`, `test-repaso.mjs`, `iconos.mjs`).
- `prueba.html`: una vista rápida de todas las escenas, por si quieres repasarlas de un vistazo.
