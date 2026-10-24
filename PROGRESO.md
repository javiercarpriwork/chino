# Progreso

Última actualización: 24 de octubre de 2026.

## Dónde estamos
**Plan nuevo, empieza hoy (sábado 24 de octubre) y acaba el 30 de noviembre.** La app está hecha; falta que Javi la publique (`PUBLICAR.md`) y que empiece.

| | |
|---|---|
| Días | 38 (24 oct – 30 nov) |
| Entre semana | 10 minutos, 7 palabras nuevas |
| Sábado y domingo | 30 minutos, 14 palabras nuevas |
| Total | 620 minutos, 340 palabras y moldes |
| Escenas | las 17 primeras (de "Presentarme" a "La farmacia") |
| Para diciembre | 194 palabras y 16 moldes más, con las escenas 18 a 28 |

## Por qué 340 y no 550 (decidido el 24/10/2026)
Las cuentas: 620 minutos dan para unos 90 segundos por palabra entre verla la primera vez y repasarla las veces que hace falta para que se quede. Con 550 palabras saldrían 2-3 repasos por palabra: verlas pasar. Javi eligió **350 bien aprendidas** en vez de las 550 a medias. Han quedado 340: las 306 palabras más frecuentes y sus 34 moldes, porque así encajan justas con las 17 primeras escenas (que ya están comprobadas carácter a carácter).

## Lo que cambió el 24/10/2026
- `js/plan.js` (nuevo): el calendario. Fechas, días largos y cortos, bloques de 20 palabras, y cuánto deberías llevar cada día.
- `js/sesion.js`: cuatro modos — **corto** (10 min, 4 pasos), **largo** (30 min, 6 pasos), **prueba** (al acabar las 340) y **mantenimiento** (después).
- **Aprender con sentido, no de memoria:**
  - Cada bloque es una escena y sus 20 palabras. Dura 2-3 días: oyes la misma escena varios días y cada vez entiendes más.
  - **El repaso suena como frase**, no como palabra suelta: "Suena una frase, ¿la entiendes?". Al revelar ves la palabra y su frase con traducción.
  - Todos los días dices algo en voz alta (un reto entre semana, cinco el fin de semana).
- **Hoy** dice qué tipo de día es, en qué bloque vas y si vas al día. **Progreso** dice cuántas llevas y cuántos días quedan.
- **Ajustes**: eliges los dos días de 30 minutos (por defecto sábado y domingo).
- El progreso guardado del plan viejo se adapta solo (no había ninguno).
- `tools/test-repaso.mjs`: 51 pruebas (cajas, calendario y los cuatro modos), todas bien.
- `sw.js` en v4.

## Probado el 24/10/2026
- **Sábado (30 min)**: Hoy dice "Sábado · sesión de 30 minutos", bloque 1, 14 nuevas, "Vas al día (0 de 340)". La sesión pasa por los 6 pasos y acaba con "Llevas 14 de 340".
- **Día de diario (10 min)**: 4 pasos (escena, nuevas, repaso, dilo tú), 7 nuevas, 20 repasos con frase. Acaba con "Llevas 27 de 340".
- Elegir los días largos en Ajustes: como mucho dos, se guarda.
- Sin errores en la consola.

## Lo que tiene que hacer Javi
1. **Publicarla**: `PUBLICAR.md`, paso a paso (si ya la publicó: `git push` y cerrar y abrir la app en el móvil).
2. **La voz china** en el iPhone: Ajustes › Accesibilidad › Contenido leído › Voces › Chino (Taiwán).
3. Poner el recordatorio: en la app, Ajustes › Añadir al Calendario.
4. Hoy (sábado) toca la primera sesión de 30 minutos.

## Notas para mí (Claude)
- No tocar `vocab.json`.
- **Cada vez que cambie la app, subir `VERSION` en `sw.js`** y añadir los archivos nuevos a la lista.
- El micrófono necesita https: en el iPhone solo funciona con la app publicada.
- Diciembre: ampliar `plan.BLOQUES` de 17 a 28 y poner fechas nuevas en `plan.js`; las escenas 18-28 ya existen y están validadas.
- Identidad de git solo en este repositorio: Javi / javiercarpri.work@gmail.com.
