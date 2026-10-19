# Progreso

Última actualización: 19 de octubre de 2026.

## Dónde estamos
**Fases 1, 2 y 4 terminadas.** La app está lista para instalarla en el iPhone: funciona sin internet, tiene icono propio y recordatorio para el Calendario. Falta que Javi la publique (fase 5, instrucciones en `PUBLICAR.md`) y el micrófono (fase 3).

| Fase | Qué es | Estado |
|---|---|---|
| 1 | Escenas (`scenes.json`) y comprobación | **hecha** |
| 2 | Sesión diaria y repaso | **hecha** |
| 3 | Micro, "grábate y compárate" y reconocimiento de voz | pendiente (necesita https: mejor después de publicar) |
| 4 | Icono, sin internet, recordatorio y diseño | **hecha** |
| 5 | Publicar en GitHub Pages e instalar en el iPhone | **le toca a Javi** (`PUBLICAR.md`) |

## Qué hay hecho
- `scenes.json`: los 28 días (280 líneas de diálogo, 84 preguntas, 140 retos, 550 frases de ejemplo).
- La app entera: `index.html`, `estilos.css` y `js/` (datos, almacen, voz, repaso, sesion, pinyin, pantallas, recordatorio).
- `manifest.webmanifest` + `iconos/` (180, 192 y 512 px, generados con `tools/iconos.mjs`): se instala con su icono y a pantalla completa.
- `sw.js`: guarda los 17 archivos la primera vez; después funciona sin internet.
- `js/recordatorio.js`: crea el evento diario repetido para el Calendario del iPhone.
- Comprobaciones: `tools/validar.mjs` (escenas, limpio) y `tools/test-repaso.mjs` (20 pruebas, todas bien).
- La carpeta ya es un repositorio de git con el primer commit hecho.

## Probado el 19/10/2026
- Dos sesiones completas seguidas (día 1 y día 2): los seis pasos, las cajas de repaso (caja 1 → caja 2 al día siguiente), "Otra vez" devuelve la tarjeta al final de hoy, y lo que no cabe pasa al día siguiente.
- Las cinco pantallas, el buscador de palabras y las 28 escenas.
- Service worker activo con 17 archivos guardados; manifest e iconos correctos; el `.ics` sale con `RRULE:FREQ=DAILY` y su aviso.
- Sin errores en la consola.

## Lo que tiene que hacer Javi
1. **Publicarla**: seguir `PUBLICAR.md` (cuenta de GitHub, `git push`, encender Pages, instalar desde Safari).
2. **La voz china**: en el iPhone, Ajustes › Accesibilidad › Contenido leído › Voces › Chino (Taiwán). En el ordenador, Configuración › Hora e idioma › añadir 中文 (繁體，台灣) con "Texto a voz" (si no, en el PC no suena nada).
3. Decirme qué le chirría de la app o de las escenas.

## Notas para mí (Claude)
- No tocar `vocab.json`.
- **Cada vez que cambie la app, subir `VERSION` en `sw.js`**, o el móvil seguirá con la versión vieja.
- Fase 3: `js/grabadora.js` (getUserMedia + MediaRecorder; reproducir modelo → mi voz seguidas) y `js/reconocer.js` (webkitSpeechRecognition zh-TW, opcional, con pinyin sacado de vocab.json). El micro necesita https, así que solo se podrá probar en el iPhone con la app ya publicada.
- Identidad de git puesta solo en este repositorio: Javi / javiercarpri.work@gmail.com.
