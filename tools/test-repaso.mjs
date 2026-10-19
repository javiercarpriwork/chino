// Comprueba que las cajas de repaso y el reparto del tiempo hacen lo que
// tienen que hacer, en los tres modos de la sesión (normal, la prueba de los
// días 29 y 30, y el mantenimiento desde el 31).
// Se ejecuta con:  node tools/test-repaso.mjs

import { CAJAS, sumarDias, estrenar, responder, pendientes, dominadas } from "../js/repaso.js";
import {
  planificar, modoDe, PASOS, COSTE, TOTAL,
  PRESUPUESTO, PRESUPUESTO_PRUEBA, PRESUPUESTO_MANTENIMIENTO,
} from "../js/sesion.js";

let fallos = 0;
const comprueba = (nombre, real, esperado) => {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log(`✗ ${nombre}\n   esperaba: ${JSON.stringify(esperado)}\n   salió:    ${JSON.stringify(real)}`); }
  else console.log(`✓ ${nombre}`);
};

const HOY = "2026-10-19";
const nuevoEstado = () => ({ diaPlan: 1, pendientesNuevas: [], tarjetas: {}, tonos: {} });

// --- fechas
comprueba("un día después", sumarDias("2026-10-19", 1), "2026-10-20");
comprueba("cambio de mes", sumarDias("2026-10-31", 1), "2026-11-01");
comprueba("cambio de año", sumarDias("2026-12-31", 30), "2027-01-30");

// --- las cajas
{
  const e = nuevoEstado();
  estrenar(e, "w001", HOY);
  comprueba("palabra nueva: caja 1, vuelve mañana", e.tarjetas.w001.proximo, sumarDias(HOY, 1));

  responder(e, "w001", true, HOY);
  comprueba("lo sé: sube a la caja 2 (3 días)", [e.tarjetas.w001.caja, e.tarjetas.w001.proximo], [2, sumarDias(HOY, 3)]);

  responder(e, "w001", true, HOY);
  responder(e, "w001", true, HOY);
  comprueba("tres aciertos: caja 4 (14 días)", [e.tarjetas.w001.caja, e.tarjetas.w001.proximo], [4, sumarDias(HOY, 14)]);
  comprueba("ya cuenta como dominada", dominadas(e), 1);

  responder(e, "w001", true, HOY);
  responder(e, "w001", true, HOY);
  comprueba("no pasa de la última caja (30 días)", [e.tarjetas.w001.caja, e.tarjetas.w001.proximo], [CAJAS.length, sumarDias(HOY, 30)]);

  responder(e, "w001", false, HOY);
  comprueba("otra vez: vuelve a la caja 1", [e.tarjetas.w001.caja, e.tarjetas.w001.proximo], [1, sumarDias(HOY, 1)]);
  comprueba("y deja de estar dominada", dominadas(e), 0);
}

// --- qué toca repasar
{
  const e = nuevoEstado();
  e.tarjetas = {
    a: { caja: 1, proximo: "2026-10-10" },   // muy atrasada
    b: { caja: 2, proximo: "2026-10-19" },   // justo hoy
    c: { caja: 3, proximo: "2026-10-25" },   // todavía no
    d: { caja: 1, proximo: "2026-10-15" },
  };
  comprueba("primero las más atrasadas", pendientes(e, HOY), ["a", "d", "b"]);
  comprueba("si no estudio un día, no se pierde nada", pendientes(e, "2026-11-30").length, 4);
}

// --- datos de mentira para probar el reparto del tiempo
const escenaFalsa = (day) => ({
  day,
  title: "escena " + day,
  challenges: [1, 2, 3, 4, 5],
  questions: [],
  dialogue: Array.from({ length: 6 }, (_, i) => ({
    speaker: i % 2 ? "B" : "A",
    who: "A",
    hanzi: `句${day}${i}`,
    pinyin: "ju",
    es: `frase ${day}-${i}`,
  })),
});
const itemsFalsos = new Map(Array.from({ length: 200 }, (_, i) => [
  "w" + i,
  { id: "w" + i, tipo: "palabra", dia: 1, hanzi: "字" + i, pinyin: "zi", es: "significado " + i, tts: "字" + i },
]));
const datosFalsos = {
  nuevasDe: (dia) => Array.from({ length: 20 }, (_, i) => `d${dia}-${i}`),
  escenaPorDia: new Map([1, 2, 3].map((d) => [d, escenaFalsa(d)])),
  escenas: { scenes: [escenaFalsa(1), escenaFalsa(2), escenaFalsa(3)] },
  item: (id) => itemsFalsos.get(id),
};

// --- los tres modos de la sesión
comprueba("los días 1 a 28 son normales", [modoDe(1), modoDe(28)], ["normal", "normal"]);
comprueba("los días 29 y 30 son la prueba final", [modoDe(29), modoDe(30)], ["prueba", "prueba"]);
comprueba("desde el día 31 es mantenimiento", [modoDe(31), modoDe(45)], ["mantenimiento", "mantenimiento"]);
comprueba("los seis pasos de siempre", PASOS.normal.map((x) => x.clave), ["oido", "escena", "nuevas", "repaso", "dilo", "real"]);
comprueba("la prueba cambia las nuevas por la escucha", PASOS.prueba.map((x) => x.clave), ["oido", "escena", "escucha", "repaso", "dilo", "real"]);
comprueba("los seis pasos suman 25 minutos", TOTAL, 25 * 60);
comprueba("la prueba también suma 25 minutos", Object.values(PRESUPUESTO_PRUEBA).reduce((a, b) => a + b, 0), 25 * 60);

// --- el reparto de los 25 minutos en un día normal
{
  const e = nuevoEstado();
  const p = planificar(e, datosFalsos, HOY);
  comprueba("día 1 sin repasos: entran las 20 nuevas", [p.nuevas.length, p.repasos.length, p.restantes.length], [20, 0, 0]);
}

{
  // 100 repasos atrasados: el repaso se come el tiempo de las nuevas
  const e = nuevoEstado();
  for (let i = 0; i < 100; i++) e.tarjetas["x" + i] = { caja: 1, proximo: "2026-10-01" };
  const p = planificar(e, datosFalsos, HOY);
  const cabenRepaso = PRESUPUESTO.repaso / COSTE.repaso;
  comprueba("entran más repasos de los que caben en 6 min", p.repasos.length > cabenRepaso, true);
  comprueba("y ese día entran muchas menos nuevas", p.nuevas.length < 5, true);
  comprueba("lo que no cabe pasa a mañana", p.nuevas.length + p.restantes.length, 20);
  comprueba("la sesión nunca pasa de 25 minutos", p.total <= TOTAL, true);
}

{
  // lo que quedó pendiente ayer entra primero hoy
  const e = nuevoEstado();
  e.pendientesNuevas = ["p1", "p2", "p3"];
  const p = planificar(e, datosFalsos, HOY);
  comprueba("primero lo que quedó pendiente", p.nuevas, ["p1", "p2", "p3"]);
}

// --- días 29 y 30: nada nuevo y prueba final de escucha
{
  const e = nuevoEstado();
  e.diaPlan = 29;
  for (let i = 0; i < 200; i++) e.tarjetas["w" + i] = { caja: 2, proximo: "2026-10-01" };
  const p = planificar(e, datosFalsos, HOY);

  comprueba("el día 29 no entran palabras nuevas", [p.modo, p.nuevas.length], ["prueba", 0]);
  comprueba("la prueba de escucha ocupa el hueco de las nuevas", p.escucha.length, PRESUPUESTO_PRUEBA.escucha / COSTE.escucha);
  comprueba("y el día sigue durando 25 minutos", p.total, TOTAL);
  comprueba("los repasos atrasados no se comen la prueba", p.repasos.length, PRESUPUESTO_PRUEBA.repaso / COSTE.repaso);
  comprueba("la escena es una ya vista", p.escena.day <= 28, true);

  const q = p.escucha[0];
  comprueba("cada pregunta tiene cuatro opciones distintas", [q.opciones.length, new Set(q.opciones).size], [4, 4]);
  comprueba("la opción correcta es su significado", q.opciones[q.correcta], q.es);
  comprueba("todas las preguntas suenan y tienen respuesta", p.escucha.every((x) => x.tts && x.correcta >= 0), true);
  comprueba("mezcla palabras y frases", [...new Set(p.escucha.map((x) => x.tipo))].sort(), ["frase", "palabra"]);
  comprueba("y las frases vienen de escenas mezcladas", new Set(p.escucha.filter((x) => x.tipo === "frase").map((x) => x.de)).size > 1, true);
}

{
  // sin nada aprendido todavía no hay prueba que hacer, y no se rompe nada
  const e = nuevoEstado();
  e.diaPlan = 30;
  const p = planificar(e, datosFalsos, HOY);
  comprueba("sin palabras aprendidas no hay preguntas de palabras", p.escucha.every((x) => x.tipo === "frase"), true);
}

// --- desde el día 31: modo mantenimiento
{
  const e = nuevoEstado();
  e.diaPlan = 31;
  for (let i = 0; i < 200; i++) e.tarjetas["w" + i] = { caja: 3, proximo: "2026-10-01" };
  const p = planificar(e, datosFalsos, HOY);

  comprueba("mantenimiento: 10 minutos", [p.modo, p.total], ["mantenimiento", 10 * 60]);
  comprueba("solo dos pasos: la escena y el repaso", PASOS[p.modo].map((x) => x.clave), ["escena", "repaso"]);
  comprueba("ni palabras nuevas, ni prueba, ni retos", [p.nuevas.length, p.escucha.length, p.retos.length], [0, 0, 0]);
  comprueba("los repasos llenan sus 7 minutos", p.repasos.length, Math.floor(PRESUPUESTO_MANTENIMIENTO.repaso / COSTE.repaso));
  comprueba("con una escena al azar ya vista", p.escena.day <= 28, true);
}

console.log(fallos ? `\n${fallos} prueba(s) mal.\n` : "\n✓ Todas las pruebas bien.\n");
process.exit(fallos ? 1 : 0);
