// La sesión diaria y sus cuatro modos:
//   - corto (entre semana): 10 minutos. Escena, 7 palabras nuevas, repaso y un reto.
//   - largo (los dos días que elijas): 30 minutos. Los seis pasos completos.
//   - prueba: cuando ya has visto las 340, la prueba final de escucha.
//   - mantenimiento: después de la prueba, 10 minutos de escena y repaso.
// Si hay muchos repasos atrasados, el repaso se come tiempo de las palabras
// nuevas y ese día entran menos; lo que falte entra al día siguiente.
// Este archivo no toca el navegador: se puede probar con node.

import { pendientes } from "./repaso.js";
import * as plan from "./plan.js";

export const PRESUPUESTOS = {
  corto:         { escena: 110, nuevas: 210, repaso: 240, dilo: 40 },                        // 600 s = 10 min
  largo:         { oido: 120, escena: 300, nuevas: 420, repaso: 480, dilo: 240, real: 240 }, // 1800 s = 30 min
  prueba:        { escena: 300, escucha: 600, repaso: 600, dilo: 300 },                      // 1800 s
  mantenimiento: { escena: 180, repaso: 420 },                                               // 600 s
};

// Lo que cuesta cada cosa, en segundos. El repaso va con su frase, por eso
// cuesta más que oír la palabra suelta.
export const COSTE = { repaso: 12, nueva: 30, reto: 35, escucha: 24 };

const PASO = {
  oido: { clave: "oido", titulo: "Oído", nota: "¿Qué tono has oído?" },
  escena: { clave: "escena", titulo: "La escena", nota: "Escucha y responde" },
  nuevas: { clave: "nuevas", titulo: "Nuevas", nota: "Las palabras de hoy" },
  escucha: { clave: "escucha", titulo: "Prueba de escucha", nota: "¿Qué significa lo que suena?" },
  repaso: { clave: "repaso", titulo: "Repaso", nota: "Una frase, ¿la entiendes?" },
  dilo: { clave: "dilo", titulo: "Dilo tú", nota: "Tú lo dices" },
  real: { clave: "real", titulo: "Hazlo de verdad", nota: "Tú eres uno de los personajes" },
};

export const PASOS = {
  corto: [PASO.escena, PASO.nuevas, PASO.repaso, PASO.dilo],
  largo: [PASO.oido, PASO.escena, PASO.nuevas, PASO.repaso, PASO.dilo, PASO.real],
  prueba: [PASO.escena, PASO.escucha, PASO.repaso, PASO.dilo],
  mantenimiento: [PASO.escena, PASO.repaso],
};

export const totalDe = (modo) =>
  Object.values(PRESUPUESTOS[modo] || PRESUPUESTOS.corto).reduce((a, b) => a + b, 0);

export function modoDe(estado, hoy) {
  if ((estado.vistas || 0) >= plan.TOTAL_ITEMS) return estado.pruebaHecha ? "mantenimiento" : "prueba";
  return plan.tipoDeDia(hoy, estado.ajustes && estado.ajustes.diasLargos);
}

export function planificar(estado, datos, hoy) {
  const modo = modoDe(estado, hoy);
  const tiempos = { ...PRESUPUESTOS[modo] };
  const conNuevas = modo === "corto" || modo === "largo";
  const vistas = estado.vistas || 0;
  const atrasados = pendientes(estado, hoy);

  // Cuántos repasos caben en su hueco. Si hay muchos atrasados, el repaso le
  // quita tiempo a las palabras nuevas (nunca a la prueba ni a la escena).
  const cabenRepaso = Math.floor(tiempos.repaso / COSTE.repaso);
  let repasos = atrasados.slice(0, cabenRepaso);
  if (conNuevas && atrasados.length > cabenRepaso) {
    const extra = Math.min(
      atrasados.length - cabenRepaso,
      Math.floor(tiempos.nuevas / COSTE.repaso),
    );
    tiempos.repaso += extra * COSTE.repaso;
    tiempos.nuevas -= extra * COSTE.repaso;
    repasos = atrasados.slice(0, cabenRepaso + extra);
  }

  // Las palabras nuevas salen de la lista del plan, siempre en orden.
  const items = plan.itemsDelPlan(datos);
  const caben = conNuevas ? Math.floor(tiempos.nuevas / COSTE.nueva) : 0;
  const nuevas = items.slice(vistas, vistas + caben);
  const quedan = Math.max(0, plan.TOTAL_ITEMS - vistas - nuevas.length);

  // El bloque de hoy: la escena a la que pertenecen las palabras de hoy.
  const bloque = plan.bloqueDe(nuevas.length ? vistas : Math.max(0, vistas - 1));
  let escena = datos.escenaPorDia.get(bloque) || null;
  if (!conNuevas) {
    const vistasEscenas = datos.escenas.scenes.filter((s) => s.day <= plan.BLOQUES);
    if (vistasEscenas.length) escena = vistasEscenas[Math.floor(Math.random() * vistasEscenas.length)];
  }

  const cabenRetos = Math.max(1, Math.floor((tiempos.dilo || 0) / COSTE.reto));
  const retos = escena && modo !== "mantenimiento" ? escena.challenges.slice(0, cabenRetos) : [];

  const escucha = modo === "prueba"
    ? preguntasEscucha(estado, datos, Math.floor(tiempos.escucha / COSTE.escucha))
    : [];

  return {
    modo,
    bloque,
    escena,
    nuevas,
    repasos,
    escucha,
    retos,
    vistas,
    quedan,
    atrasados: atrasados.length,
    preguntas: modo === "corto" ? 1 : 3,   // entre semana, una sola pregunta
    tiempos,
    total: Object.values(tiempos).reduce((a, b) => a + b, 0),
  };
}

// Baraja una copia de la lista.
function barajar(lista) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Le pone tres señuelos del mismo tipo a la respuesta buena y los mezcla.
function conOpciones(bien, bolsa) {
  const opciones = [bien.es];
  for (const otro of barajar(bolsa)) {
    if (opciones.length >= 4) break;
    if (otro.clave !== bien.clave && !opciones.includes(otro.es)) opciones.push(otro.es);
  }
  if (opciones.length < 4) return null; // sin tres señuelos no hay pregunta
  const mezcladas = barajar(opciones);
  return { ...bien, opciones: mezcladas, correcta: mezcladas.indexOf(bien.es) };
}

// La prueba final de escucha: suena algo ya aprendido (una palabra o una frase
// de una escena) y hay que elegir su significado entre cuatro. Mezcla palabras
// y frases, y las frases salen de escenas distintas: como mucho dos de cada una.
export function preguntasEscucha(estado, datos, cuantas = 20) {
  if (cuantas <= 0) return [];

  const palabras = [];
  for (const id of Object.keys(estado.tarjetas)) {
    const it = datos.item(id);
    if (it && it.es) palabras.push({ clave: "p" + id, tts: it.tts, es: it.es, tipo: "palabra", de: "" });
  }

  const hasta = plan.bloqueDe(estado.vistas || 0);
  const frases = [];
  for (const s of datos.escenas.scenes) {
    if (s.day > hasta) continue;
    s.dialogue.forEach((l, i) => {
      frases.push({ clave: `f${s.day}-${i}`, tts: l.hanzi, es: l.es, tipo: "frase", de: s.title });
    });
  }

  // Una de cada tres preguntas es una frase, y como mucho dos de la misma escena.
  const elegidas = [];
  const cuantasFrases = Math.min(Math.round(cuantas / 3), frases.length);
  const porEscena = new Map();
  for (const f of barajar(frases)) {
    if (elegidas.length >= cuantasFrases) break;
    const ya = porEscena.get(f.de) || 0;
    if (ya >= 2) continue;
    porEscena.set(f.de, ya + 1);
    elegidas.push(f);
  }
  for (const p of barajar(palabras)) {
    if (elegidas.length >= cuantas) break;
    elegidas.push(p);
  }

  const preguntas = [];
  for (const bien of barajar(elegidas)) {
    const pregunta = conOpciones(bien, bien.tipo === "frase" ? frases : palabras);
    if (pregunta) preguntas.push(pregunta);
  }
  return preguntas;
}

// Sílabas sueltas ya aprendidas, para el paso del oído.
// Prioriza las confusiones 1.º–4.º y 2.º–3.º y las que más se fallan.
export function silabasParaTonos(estado, datos, tonoDe, esUnaSilaba, cuantas = 8) {
  const candidatas = [];
  for (const id of Object.keys(estado.tarjetas)) {
    const it = datos.item(id);
    if (!it || !esUnaSilaba(it.pinyin)) continue;
    const tono = tonoDe(it.pinyin);
    if (tono === 0) continue;
    const fallos = (estado.tonos[id] || {}).fallos || 0;
    const dificil = tono === 1 || tono === 4 || tono === 2 || tono === 3;
    candidatas.push({ id, tono, peso: 1 + fallos * 3 + (dificil ? 1 : 0) });
  }
  if (!candidatas.length) return [];

  const elegidas = [];
  const bolsa = candidatas.flatMap((c) => Array(Math.min(c.peso, 6)).fill(c));
  while (elegidas.length < Math.min(cuantas, candidatas.length) && bolsa.length) {
    const i = Math.floor(Math.random() * bolsa.length);
    const c = bolsa[i];
    if (!elegidas.some((e) => e.id === c.id)) elegidas.push(c);
    bolsa.splice(i, 1);
  }
  return elegidas;
}
