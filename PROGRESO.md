# Progreso

Última actualización: 19 de octubre de 2026.

## Dónde estamos
**Fases 1 y 2 terminadas.** Ya se puede hacer la sesión diaria entera, de principio a fin, con las seis partes y el repaso. Falta el micrófono (fase 3) y el diseño fino y la instalación en el iPhone (fase 4).

| Fase | Qué es | Estado |
|---|---|---|
| 1 | Escenas (`scenes.json`) y comprobación | **hecha** |
| 2 | Sesión diaria y repaso, sin micrófono | **hecha** |
| 3 | Micro, "grábate y compárate" y reconocimiento de voz | siguiente |
| 4 | Pantallas, diseño y app instalable (icono, sin internet, recordatorio) | pendiente |
| 5 | Publicarla en GitHub Pages y ponerla en el iPhone | pendiente |

## Qué hay hecho
- `scenes.json`: los 28 días completos (280 líneas de diálogo, 84 preguntas, 140 retos, 550 frases de ejemplo).
- `tools/validar.mjs`: comprobación carácter a carácter. Sale limpio.
- `tools/test-repaso.mjs`: 20 pruebas de las cajas de repaso y del reparto de los 25 minutos. Todas pasan.
- `index.html`, `estilos.css` y `js/`: la app.
  - `js/datos.js` carga vocab.json y scenes.json.
  - `js/almacen.js` guarda el progreso en el aparato + exportar e importar copia.
  - `js/voz.js` la voz zh-TW, normal y lenta, con aviso si no hay voz china.
  - `js/repaso.js` cajas 1, 3, 7, 14 y 30 días.
  - `js/sesion.js` el reparto de los 25 minutos entre los seis pasos.
  - `js/pantallas.js` las cinco pantallas y la sesión.
- `package.json`: solo para que node pueda ejecutar los scripts de `tools/`. La app sigue sin npm ni librerías.

## Cómo funciona la sesión (ya probado)
1. **Oído**: suena una sílaba ya aprendida y eliges el tono; guarda tus fallos para insistir en ellos.
2. **La escena**: suena entera sin texto, luego las 3 preguntas, y después puedes ver el texto con pinyin y traducción.
3. **Nuevas**: cada palabra con audio normal y lento, significado, caracteres pequeños y su frase de la escena.
4. **Repaso**: primero solo el sonido; tocas y se revela. "Otra vez" la devuelve al final de la sesión de hoy.
5. **Dilo tú**: los 5 retos; lo dices y luego ves y oyes el modelo.
6. **Hazlo de verdad**: la escena con la app haciendo del otro personaje.

Lo que no cabe en los 25 minutos pasa al día siguiente, y el día del plan solo avanza cuando terminas las palabras nuevas de ese día. El progreso se guarda después de cada palabra y de cada repaso, así que puedes cerrar a media sesión.

## Lo que tiene que hacer Javi
- Probar una sesión entera (ver abajo) y decir qué le chirría.
- **En el ordenador no hay voz china instalada**: Configuración › Hora e idioma › Idioma y región › Agregar idioma › 中文 (繁體，台灣) › marcar "Texto a voz". Sin eso se ve todo pero no se oye nada. En el iPhone normalmente ya está.

## Cómo probarlo
1. Abrir la carpeta del proyecto, escribir `cmd` en la barra de direcciones y pulsar Intro.
2. `node tools/servidor.mjs`
3. En el ordenador: `http://localhost:5173`. En el iPhone (mismo wifi): la otra dirección que sale.
4. Comprobaciones: `node tools/validar.mjs` y `node tools/test-repaso.mjs`.
5. `prueba.html` sigue ahí por si quieres ver todas las escenas de un vistazo.

## Notas para mí (Claude)
- No tocar `vocab.json`.
- Fase 3: `js/grabadora.js` (getUserMedia + MediaRecorder, reproducir modelo → mi voz) y `js/reconocer.js` (webkitSpeechRecognition zh-TW, opcional, con pinyin del diccionario propio). El micro necesita https: en el iPhone solo funcionará una vez publicada (fase 5) o con localhost en el ordenador.
- Fase 4: anillos más grandes, icono, manifest, service worker, recordatorio `.ics`, y sustituir `prueba.html`.
