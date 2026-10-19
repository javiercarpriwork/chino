// Comprueba que las cajas de repaso y el reparto de los 25 minutos hacen
// lo que tienen que hacer. Se ejecuta con:  node tools/test-repaso.mjs

import { CAJAS, sumarDias, estrenar, responder, pendientes, dominadas } from "../js/repaso.js";
import { planificar, PRESUPUESTO, COSTE, TOTAL } from "../js/sesion.js";

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

// --- el reparto de los 25 minutos
const datosFalsos = {
  nuevasDe: (dia) => Array.from({ length: 20 }, (_, i) => `d${dia}-${i}`),
  escenaPorDia: new Map([[1, { day: 1, title: "x", challenges: [1, 2, 3, 4, 5], dialogue: [] }]]),
  escenas: { scenes: [{ day: 1, title: "x", challenges: [], dialogue: [] }] },
};

comprueba("los seis pasos suman 25 minutos", TOTAL, 25 * 60);

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
  const total = p.tiempos.oido + p.tiempos.escena + p.tiempos.nuevas + p.tiempos.repaso + p.tiempos.dilo + p.tiempos.real;
  comprueba("la sesión nunca pasa de 25 minutos", total <= TOTAL, true);
}

{
  // lo que quedó pendiente ayer entra primero hoy
  const e = nuevoEstado();
  e.pendientesNuevas = ["p1", "p2", "p3"];
  const p = planificar(e, datosFalsos, HOY);
  comprueba("primero lo que quedó pendiente", p.nuevas, ["p1", "p2", "p3"]);
}

{
  // días 29 y 30: nada nuevo
  const e = nuevoEstado();
  e.diaPlan = 29;
  const p = planificar(e, datosFalsos, HOY);
  comprueba("el día 29 no entran palabras nuevas", [p.esPrueba, p.nuevas.length], [true, 0]);
}

console.log(fallos ? `\n${fallos} prueba(s) mal.\n` : "\n✓ Todas las pruebas bien.\n");
process.exit(fallos ? 1 : 0);
