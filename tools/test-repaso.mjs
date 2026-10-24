// Comprueba las cajas de repaso, el calendario del 24 de octubre al 30 de
// noviembre y el reparto del tiempo en los cuatro modos de la sesión
// (corto de 10 min, largo de 30, la prueba final y el mantenimiento).
// Se ejecuta con:  node tools/test-repaso.mjs

import { CAJAS, sumarDias, estrenar, responder, pendientes, dominadas } from "../js/repaso.js";
import { planificar, modoDe, PASOS, COSTE, PRESUPUESTOS, totalDe } from "../js/sesion.js";
import * as plan from "../js/plan.js";

let fallos = 0;
const comprueba = (nombre, real, esperado) => {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log(`✗ ${nombre}\n   esperaba: ${JSON.stringify(esperado)}\n   salió:    ${JSON.stringify(real)}`); }
  else console.log(`✓ ${nombre}`);
};

const HOY = "2026-10-19";
const SABADO = "2026-10-24";   // el primer día del plan
const LUNES = "2026-10-26";
const nuevoEstado = () => ({ vistas: 0, tarjetas: {}, tonos: {}, ajustes: { diasLargos: [6, 0] } });

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

const itemsFalsos = new Map();
for (let b = 1; b <= plan.BLOQUES; b++) {
  for (let i = 0; i < plan.ITEMS_POR_BLOQUE; i++) {
    const id = `b${b}-${i}`;
    itemsFalsos.set(id, { id, tipo: "palabra", dia: b, hanzi: "字", pinyin: "zi", es: `sentido ${b}-${i}`, tts: "字" });
  }
}
const bloques = Array.from({ length: plan.BLOQUES }, (_, k) => escenaFalsa(k + 1));
const datosFalsos = {
  nuevasDe: (b) => Array.from({ length: plan.ITEMS_POR_BLOQUE }, (_, i) => `b${b}-${i}`),
  escenaPorDia: new Map(bloques.map((s) => [s.day, s])),
  escenas: { scenes: bloques },
  item: (id) => itemsFalsos.get(id),
};

// --- el calendario: del 24 de octubre al 30 de noviembre
{
  const r = plan.resumenDelPlan();
  comprueba("38 días de plan", r.dias, 38);
  comprueba("12 largos (sáb y dom) y 26 cortos", [r.largos, r.cortos], [12, 26]);
  comprueba("620 minutos en total", r.minutos, 620);
  comprueba("caben las 340 palabras del plan", r.hueco >= plan.TOTAL_ITEMS, true);
  comprueba("son 17 bloques de 20", plan.TOTAL_ITEMS, 340);
}

comprueba("el sábado es día largo", plan.tipoDeDia(SABADO), "largo");
comprueba("el lunes es día corto", plan.tipoDeDia(LUNES), "corto");
comprueba("puedo elegir otros dos días", [plan.tipoDeDia(LUNES, [1, 4]), plan.tipoDeDia(SABADO, [1, 4])], ["largo", "corto"]);
comprueba("el primer día deberías llevar 14", plan.idealHasta(plan.INICIO), 14);
comprueba("al final del plan, las 340", plan.idealHasta(plan.FIN), 340);
comprueba("la lista del plan tiene 340 palabras", plan.itemsDelPlan(datosFalsos).length, 340);
comprueba("y van en orden, bloque a bloque", plan.itemsDelPlan(datosFalsos)[20], "b2-0");
comprueba("el bloque sale del número de palabra", [plan.bloqueDe(0), plan.bloqueDe(19), plan.bloqueDe(20), plan.bloqueDe(339)], [1, 1, 2, 17]);

// --- los cuatro modos
comprueba("entre semana, 10 minutos", totalDe("corto"), 10 * 60);
comprueba("el fin de semana, 30 minutos", totalDe("largo"), 30 * 60);
comprueba("cuatro pasos entre semana", PASOS.corto.map((x) => x.clave), ["escena", "nuevas", "repaso", "dilo"]);
comprueba("seis el fin de semana", PASOS.largo.map((x) => x.clave), ["oido", "escena", "nuevas", "repaso", "dilo", "real"]);

{
  const e = nuevoEstado();
  comprueba("el sábado toca sesión larga", modoDe(e, SABADO), "largo");
  comprueba("el lunes, corta", modoDe(e, LUNES), "corto");
  e.vistas = plan.TOTAL_ITEMS;
  comprueba("al acabar las 340 llega la prueba", modoDe(e, LUNES), "prueba");
  e.pruebaHecha = true;
  comprueba("y después, mantenimiento", modoDe(e, LUNES), "mantenimiento");
}

// --- el reparto del tiempo
{
  const e = nuevoEstado();
  const p = planificar(e, datosFalsos, SABADO);
  comprueba("día largo: 14 nuevas y 30 minutos", [p.nuevas.length, p.total], [14, 1800]);
  comprueba("empieza por el bloque 1 y su escena", [p.bloque, p.escena.day], [1, 1]);
  comprueba("cinco retos el fin de semana", p.retos.length, 5);
  comprueba("y tres preguntas de la escena", p.preguntas, 3);
}

{
  const e = nuevoEstado();
  const p = planificar(e, datosFalsos, LUNES);
  comprueba("día corto: 7 nuevas y 10 minutos", [p.nuevas.length, p.total], [7, 600]);
  comprueba("un reto y una pregunta entre semana", [p.retos.length, p.preguntas], [1, 1]);
  comprueba("20 repasos caben en sus 4 minutos", Math.floor(p.tiempos.repaso / COSTE.repaso), 20);
}

{
  // sigues por donde ibas, no por la fecha
  const e = nuevoEstado();
  e.vistas = 25;
  const p = planificar(e, datosFalsos, LUNES);
  comprueba("sigue donde lo dejaste", p.nuevas[0], "b2-5");
  comprueba("y la escena es la de ese bloque", [p.bloque, p.escena.day], [2, 2]);
}

{
  // muchos repasos atrasados: entran menos palabras nuevas, nunca más tiempo
  const e = nuevoEstado();
  for (let i = 0; i < 100; i++) e.tarjetas["x" + i] = { caja: 1, proximo: "2026-10-01" };
  const p = planificar(e, datosFalsos, LUNES);
  comprueba("el repaso se come las nuevas", p.nuevas.length < 7, true);
  comprueba("entran más repasos de los que caben", p.repasos.length > 20, true);
  comprueba("pero la sesión sigue siendo de 10 minutos", p.total, 600);
}

{
  // el final: la prueba de escucha y luego mantenimiento
  const e = nuevoEstado();
  e.vistas = plan.TOTAL_ITEMS;
  for (let i = 0; i < 100; i++) e.tarjetas[`b1-${i % 20}`] = { caja: 2, proximo: "2026-10-01" };
  const p = planificar(e, datosFalsos, LUNES);
  comprueba("la prueba: nada nuevo y 25 preguntas", [p.nuevas.length, p.escucha.length], [0, 25]);
  comprueba("cada pregunta, cuatro opciones distintas", [p.escucha[0].opciones.length, new Set(p.escucha[0].opciones).size], [4, 4]);
  comprueba("la correcta es su significado", p.escucha[0].opciones[p.escucha[0].correcta], p.escucha[0].es);

  e.pruebaHecha = true;
  const m = planificar(e, datosFalsos, LUNES);
  comprueba("mantenimiento: 10 minutos y dos pasos", [m.total, PASOS[m.modo].map((x) => x.clave)], [600, ["escena", "repaso"]]);
  comprueba("ni nuevas ni retos", [m.nuevas.length, m.retos.length], [0, 0]);
}

console.log(fallos ? `\n${fallos} prueba(s) mal.\n` : "\n✓ Todas las pruebas bien.\n");
process.exit(fallos ? 1 : 0);
