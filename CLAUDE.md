# Proyecto: app web para aprender chino de Taiwán

Este archivo es el plan completo de la app. Léelo al empezar cada sesión, junto con `PROGRESO.md`.

## Sobre mí y cómo hablarme
- Soy Javi, español, vivo en Taipei y empiezo el chino de cero.
- Háblame en español, claro y sencillo, sin jerga técnica.
- **Uso Windows. No tengo Mac.** Nada de Xcode ni SwiftUI: la app es una página web.
- Cuando tenga que hacer algo yo (en el ordenador o en el iPhone), dame los pasos exactos, uno a uno.

## Objetivo
Conversar en mi día a día en Taipei y enterarme de lo que me dicen.
- **Del 24 de octubre al 30 de noviembre de 2026**: 38 días.
- **10 minutos entre semana y 30 minutos dos días** (por defecto sábado y domingo; se cambia en Ajustes). En total, 620 minutos.
- En ese tiempo entran **340 palabras y moldes**: las 306 más usadas de `vocab.json` más sus 34 moldes, que son los de las 17 primeras escenas. Las 210 restantes quedan para diciembre.
- No quiero memorizar listas: quiero entender. Por eso **cada palabra vive dentro de una frase de su escena**, el repaso suena como frase y no como palabra suelta, y todos los días hay que decir algo en voz alta.
- La prioridad es el SONIDO: entender de oído y saber decirlo. Los caracteres van pequeños, solo como apoyo.

### Por qué 340 y no 550
620 minutos dan para ver cada palabra una vez (unos 30 s: oírla, entenderla, verla en su frase y decirla) y repasarla las veces que hace falta para que se quede (unos 5 repasos de 12 s). Eso son unos 90 s por palabra: 340 palabras llenan el plan entero. Con las 550 saldrían 2 repasos por palabra, que es verlas pasar. Javi eligió 340 bien aprendidas.

## Qué tipo de app es
Una app web que se instala en el iPhone desde Safari con "Añadir a pantalla de inicio" (una PWA):
- se abre a pantalla completa, sin barras del navegador, con su propio icono;
- funciona sin internet;
- sin servidor propio, sin cuentas, sin anuncios, sin analítica, sin librerías externas.

## Tecnología (lo más simple posible)
HTML + CSS y JavaScript "a pelo". Sin frameworks, sin compilación, sin `npm install`. Publicar es copiar los archivos.

Archivos, todos en la raíz de la carpeta para poder publicar de un tirón:

```
index.html              la app entera (una sola página, cinco pantallas)
estilos.css             el diseño
manifest.webmanifest    nombre, icono y pantalla completa al instalarla
sw.js                   guarda todo para que funcione sin internet
iconos/                 icono-180.png, icono-192.png, icono-512.png
js/datos.js             carga vocab.json y scenes.json
js/almacen.js           progreso en el iPhone + exportar e importar copia
js/voz.js               la voz zh-TW (normal y lenta)
js/grabadora.js         micrófono: grábate y compárate
js/reconocer.js         reconocimiento de voz (extra, opcional) y pinyin
js/repaso.js            las cajas de repaso 1, 3, 7, 14 y 30 días
js/sesion.js            los seis pasos y el presupuesto de 25 minutos
js/pantallas.js         Hoy, Escenas, Palabras, Progreso, Ajustes
js/recordatorio.js      crea el evento diario para el Calendario
vocab.json              las 500 palabras y las 50 expresiones (NO se toca)
scenes.json             las 28 escenas con todo su contenido
tools/validar.mjs       comprueba que las frases solo usan palabras permitidas
tools/servidor.mjs      servidor local para probar en el ordenador
tools/iconos.mjs        genera los PNG del icono
```

- **Progreso:** se guarda en el propio iPhone con `localStorage`, en una sola clave (`chino.progreso.v1`). En Ajustes hay **Exportar copia** (descarga un archivo `.json`) e **Importar copia** (elegir ese archivo). Esa es la copia de seguridad.
- **Voz:** `speechSynthesis` del navegador con una voz `zh-TW`. Velocidad normal (`rate` 1) y lenta (`rate` 0.55). Si no hay ninguna voz china, la app muestra un cartel claro en español con qué hacer (Ajustes del iPhone → Accesibilidad → Contenido leído → Voces → Chino (Taiwán)) y sigue siendo usable sin voz.
- **Pronunciación, método principal: "grábate y compárate".** Con `getUserMedia` y `MediaRecorder`: un botón reproduce el modelo, me grabo, y la app pone mi voz justo después del modelo. La grabación no se guarda: es solo para ese momento.
- **Reconocimiento de voz (extra, opcional):** `webkitSpeechRecognition` con `lang = "zh-TW"`, si el navegador lo tiene. Me dice qué ha entendido, con su pinyin. En el iPhone puede no existir, fallar con la app instalada o necesitar internet: por eso **todo funciona igual sin él** y nunca bloquea nada.
- **Pinyin de lo que reconoce:** sin librerías. Diccionario propio construido con `vocab.json` y las palabras de la escena, emparejando de más largo a más corto.
- **Recordatorio diario:** un botón genera un archivo de calendario (`.ics`) con un evento que se repite todos los días a la hora que yo elija, con su aviso. Lo abro en el iPhone y se añade al Calendario. (Los avisos web en el iPhone son poco fiables; el calendario sí lo es.)
- **Sin internet:** `sw.js` guarda todos los archivos la primera vez que se abre la app.

## Datos

### `vocab.json` — NO se toca
- `words`: 500 entradas `{id, rank, day, hanzi (tradicional), simplified, pinyin, es, alt, tts}`. 18 palabras al día los días 1–25; 18, 18 y 14 los días 26, 27 y 28.
- `expressions`: 50 entradas `{id, rank, day, group, pattern, example, pinyin, es, tts}`. 2 al día, días 1–25.
- `tts` es el texto que debe pronunciar la voz.
- Si veo un error, avisar a Javi y proponer el cambio; no editarlo por mi cuenta.

### `scenes.json` — lo generamos nosotros
Una entrada por día del plan (1–28), con:
- `title`: la situación en español ("En el mercado nocturno").
- `sceneWords`: como máximo **3** palabras de la escena que no están en `vocab.json` (por ejemplo 捷運, 悠遊卡, 大杯), con hanzi, pinyin y español. En la app aparecen marcadas aparte.
- `dialogue`: de 6 a 10 líneas naturales, como habla la gente en Taiwán, cada una con `speaker`, `hanzi`, `pinyin` y `es`. Usa el máximo posible de palabras de ese día, más las de días anteriores.
- `questions`: 3 preguntas de comprensión en español, con 3 opciones cada una y la correcta marcada.
- `challenges`: 5 retos de "dilo tú": una frase en español que yo tengo que decir en chino con los moldes que ya conozco, con su respuesta modelo (hanzi y pinyin).
- `examples`: una frase de ejemplo para cada palabra y expresión nueva de ese día. Siempre que se pueda, sacada de la escena; si una palabra no encaja en la escena, una frase sencilla.

### Comprobación obligatoria
`tools/validar.mjs` revisa **carácter a carácter** que todo el chino del día D use solo:
- palabras de `vocab.json` con `day <= D`,
- expresiones con `day <= D`,
- las `sceneWords` declaradas de los días `<= D`,
- puntuación y números permitidos.

Saca un informe por días: cuántas palabras nuevas del día aparecen en la escena, qué caracteres se salen y en qué línea están. Se arregla lo que falle y se vuelve a pasar hasta que salga limpio. Se ejecuta con `node tools/validar.mjs`.

## Las 28 situaciones (de más a menos útil)
1. Presentarme: saludar, mi nombre, de dónde soy
2. Pedir en una cafetería
3. Comprar en el 7-Eleven
4. El metro y recargar la EasyCard
5. Pedir en un restaurante pequeño
6. Pagar, pedir la cuenta y los precios
7. Preguntar cómo llegar a un sitio
8. Coger un taxi
9. El mercado nocturno
10. No entiendo: "más despacio", "¿cómo se dice?"
11. Quedar con amigos: hora y sitio
12. Hablar del tiempo
13. Mi trabajo y mis estudios
14. Mi familia
15. Una clase en la universidad
16. Comprar ropa: talla, probar, color
17. La farmacia
18. El médico
19. El supermercado y la comida para casa
20. El autobús y la bici pública
21. Un problema en casa: internet y el casero
22. La peluquería
23. Cenar fuera con amigos
24. El móvil nuevo y los planes de la tarde
25. Alquilar una habitación
26. Un cumpleaños y las comidas del día
27. Quedar el fin de semana
28. Un día entero en Taipei (repaso hablado)

Los días 23 a 27 cambiaron de situación al escribir las escenas: las palabras de esos días (餐廳, 生日, 房間, 週末…) pedían otra cosa, y una escena sale mucho mejor cuando la situación encaja con las palabras de ese día.

**En el plan hasta el 30 de noviembre entran las 17 primeras** (del 1 al 17: de presentarme a la farmacia). Las 11 restantes van con las palabras de diciembre.

## El motor de aprendizaje
- **El contenido va en bloques.** Un bloque = una escena + sus 20 palabras y moldes. Cada bloque dura dos o tres días, así que oigo la misma escena varios días seguidos y cada vez entiendo más. Son 17 bloques.
- **El tipo de sesión lo manda el día de la semana** (hoy es sábado → 30 minutos), pero **el contenido lo mando yo**: si un día no abro la app no pierdo nada, al volver sigo por la palabra donde lo dejé. En Hoy se ve si voy al día o por detrás del calendario.
- **Repaso espaciado por cajas:** nueva → 1 día → 3 → 7 → 14 → 30. "Lo sé" sube una caja; "Otra vez" vuelve a la caja de 1 día y la tarjeta reaparece al final de la sesión de hoy.
- **Presupuesto fijo: 10 o 30 minutos.** Cuentas aproximadas: cada repaso 12 s (va con su frase), cada palabra nueva 30 s, cada reto de "dilo tú" 35 s. Entran 7 palabras nuevas los días cortos y 14 los largos. Si hay muchos repasos atrasados, el repaso se come parte del tiempo de las palabras nuevas y ese día entran menos. **La sesión nunca se alarga.**
- **Palabras con dos lecturas** (得, 地, 和, 還…): la voz puede leer el carácter suelto con la lectura equivocada, así que en esas se reproduce también la frase de ejemplo.
- **Al terminar las 340**: prueba final de escucha (suena algo aprendido y elijo su significado entre cuatro, con escenas mezcladas). Después, mantenimiento de 10 minutos: una escena al azar y repasos.

## La sesión diaria
Con una barra de progreso arriba. Lo calcula `planificar()` en `js/sesion.js`; el calendario está en `js/plan.js`.

### Entre semana: 10 minutos
1. **La escena (2 min).** La escena del bloque, entera y **sin texto**, y una pregunta de comprensión. El texto está en la pestaña Escenas.
2. **Nuevas (3,5 min).** 7 palabras. Cada una con audio normal y lento, su significado y la frase de la escena donde vive. Me grabo y me comparo.
3. **Repaso (4 min).** Unas 20 tarjetas. **Suena la frase, no la palabra suelta**: entiendo o no, toco, y se revela la palabra con su frase. "Otra vez" o "Lo sé". Una de cada tres va al revés: veo el español y la digo yo.
4. **Dilo tú (40 s).** Un reto: leo la frase en español, la digo, me grabo y oigo el modelo.

### Los dos días largos: 30 minutos
1. **Oído (2 min).** Suena una sílaba ya aprendida y elijo su tono. Insiste en 1.º–4.º y 2.º–3.º y en lo que más fallo.
2. **La escena (5 min).** Entera sin texto, las 3 preguntas, y después el texto con pinyin y traducción, línea a línea.
3. **Nuevas (7 min).** 14 palabras, igual que entre semana.
4. **Repaso (8 min).** Unas 40 tarjetas, con frase.
5. **Dilo tú (4 min).** Los 5 retos de la escena, grabándome.
6. **Hazlo de verdad (4 min).** La escena haciendo de uno de los personajes: la app dice su parte y yo la mía.

Nunca me bloquea: si el reconocimiento de voz no me entiende, sigo igual.

## Pantallas
Barra de cinco pestañas abajo, estilo iPhone.
- **Hoy:** tres anillos como en la app Actividad (Escuchar, Hablar, Repasar), el día y la escena ("Día 7 de 30: En el mercado nocturno") y un único botón grande: "Empezar".
- **Escenas:** todas las escenas desbloqueadas desde el principio, para volver a escucharlas cuando quiera (audio, pinyin y traducción).
- **Palabras:** las 500 palabras y las 50 expresiones, con buscador en español o pinyin, botón de audio y su estado (nueva, aprendiendo, dominada).
- **Progreso:** los días hechos, palabras dominadas sobre 550, tiempo total y si voy adelantado o con retraso.
- **Ajustes:** hora del recordatorio y botón para crear el evento del Calendario, velocidad de la voz, elegir voz china, mostrar u ocultar caracteres, exportar e importar copia, reiniciar progreso.

## Diseño
Que parezca hecha por Apple.
- Tipografía del sistema (`-apple-system`), títulos grandes, listas agrupadas con esquinas redondeadas, mucho aire.
- Modo claro y oscuro automáticos, animaciones suaves, vibración sutil al acertar y al terminar. Nada chillón.
- Una sola acción principal por pantalla.
- Toda la app en español.
- Los caracteres chinos van pequeños: lo importante es el sonido y el pinyin. Pinyin con un color por tono: 1º rojo, 2º naranja, 3º verde, 4º azul, neutro gris.
- Antes de pedir el micrófono, explicar en español para qué es.

## Decisiones acordadas con Javi (19 de octubre de 2026)
- **Contenido por muestra:** primero los días 1, 2 y 3 completos con su informe de comprobación. Solo después de que Javi los apruebe se escriben los 25 días restantes.
- **Personaje genérico:** las escenas las protagoniza un estudiante extranjero sin datos personales de Javi, por si algún día le pasa la app a otra persona. En los días de familia, trabajo y universidad se habla en general, sin inventar su vida.
- **Nada de nombres propios en chino** salvo que de verdad hagan falta: los caracteres de un nombre también tienen que pasar la comprobación. Los personajes se marcan por su papel (`A` y `B`, con una etiqueta en español: "dependienta", "estudiante"). Si un nombre es imprescindible, cuenta como una de las 3 palabras de la escena.
- **Publicación: GitHub Pages.** En la fase 5 hay que guiar a Javi para crear la cuenta de GitHub, subir la carpeta con git y activar Pages, con los comandos exactos.

## Fases
Al terminar cada fase: comprobar que funciona, decirle a Javi en pasos sencillos cómo probarla en el ordenador y en el iPhone, y apuntar en `PROGRESO.md` qué está hecho.
1. **Escenas y comprobación:** `scenes.json` con los 28 días, `tools/validar.mjs` y el informe limpio.
2. **Sesión diaria y repaso:** los seis pasos, las cajas de repaso, el presupuesto de 25 minutos y el guardado en el iPhone (todavía sin micrófono).
3. **Micro y grabación:** "grábate y compárate" y, si se puede, el reconocimiento de voz con pinyin.
4. **Pantallas, diseño y app instalable:** las cinco pantallas, los anillos, el diseño Apple, el icono, el modo sin internet, el recordatorio del Calendario y exportar/importar.
5. **Publicarla y ponerla en el iPhone:** paso a paso y gratis.

## Reglas de trabajo
- Al acabar cada fase, apuntar en `PROGRESO.md` qué está hecho, qué falta y lo que tenga que hacer Javi. Leerlo al empezar cada sesión.
- Si algo no está claro, preguntar antes de empezar.
- Para probar en el ordenador: `node tools/servidor.mjs` y abrir `http://localhost:5173`.
