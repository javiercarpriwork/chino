// La sesión diaria y sus tres modos:
//   - normal (días 1 a 28): los seis pasos y 25 minutos fijos.
//   - prueba (días 29 y 30): nada nuevo; en el hueco de las palabras nuevas
//     entra la prueba final de escucha, con escenas mezcladas.
//   - mantenimiento (desde el día 31): 10 minutos, una escena al azar y repasos.
// Si hay muchos repasos atrasados, en los días normales el repaso se come
// tiempo de las palabras nuevas y ese día entran menos; lo que falte entra al
// día siguiente.
// Este archivo tampoco toca el navegador: se puede probar con node.

import { pendientes } from "./repaso.js";

export const PRESUPUESTO = {
  oido: 60,      // 1 min
  escena: 180,   // 3 min
  nuevas: 480,   // 8 min
  repaso: 360,   // 6 min
  dilo: 300,     // 5 min
  real: 120,     // 2 min
};
export const TOTAL = Object.values(PRESUPUESTO).reduce((a, b) => a + b, 0); // 1500 s = 25 min

// Días 29 y 30: la prueba de escucha ocupa el hueco de las palabras nuevas.
export const PRESUPUESTO_PRUEBA = {
  oido: 60,
  escena: 180,
  escucha: 480,  // 8 min
  repaso: 360,
  dilo: 300,
  real: 120,
};

// Desde el día 31: 10 minutos, una escena al azar y repasos.
export const PRESUPUESTO_MANTENIMIENTO = {
  escena: 180,   // 3 min
  repaso: 420,   // 7 min
};

export const COSTE = { repaso: 8, nueva: 24, reto: 35, escucha: 24 };

const PASO = {
  oido: { clave: "oido", titulo: "Oído", nota: "¿Qué tono has oído?" },
  escena: { clave: "escena", titulo: "La escena", nota: "Escucha y responde" },
  nuevas: { clave: "nuevas", titulo: "Nuevas", nota: "Las palabras de hoy" },
  escucha: { clave: "escucha", titulo: "Prueba de escucha", nota: "¿Qué significa lo que suena?" },
  repaso: { clave: "repaso", titulo: "Repaso", nota: "Solo el sonido" },
  dilo: { clave: "dilo", titulo: "Dilo tú", nota: "Tú lo dices" },
  real: { clave: "real", titulo: "Hazlo de verdad", nota: "Tú eres uno de los personajes" },
};

// Los pasos de cada modo, en orden.
export const PASOS = {
  normal: [PASO.oido, PASO.escena, PASO.nuevas, PASO.repaso, PASO.dilo, PASO.real],
  prueba: [PASO.oido, PASO.escena, PASO.escucha, PASO.repaso, PASO.dilo, PASO.real],
  mantenimiento: [PASO.escena, PASO.repaso],
};

export function modoDe(dia) {
  if (dia >= 31) return "mantenimiento";
  if (dia >= 29) return "prueba";
  return "normal";
}

const presupuestoDe = (modo) => ({
  normal: PRESUPUESTO,
  prueba: PRESUPUESTO_PRUEBA,
  mantenimiento: PRESUPUESTO_MANTENIMIENTO,
}[modo]);

export function planificar(estado, datos, hoy) {
  const dia = estado.diaPlan;
  const modo = modoDe(dia);
  const tiempos = { ...presupuestoDe(modo) };
  const atrasados = pendientes(estado, hoy);

  // Cuántos repasos caben en su hueco. En los días normales, si hay muchos
  // atrasados el repaso le quita tiempo a las palabras nuevas. En la prueba no:
  // los días 29 y 30 la prueba de escucha es lo importante y no se toca.
  const cabenRepaso = Math.floor(tiempos.repaso / COSTE.repaso);
  let repasos = atrasados.slice(0, cabenRepaso);
  if (modo === "normal" && atrasados.length > cabenRepaso) {
    const extra = Math.min(
      atrasados.length - cabenRepaso,
      Math.floor(tiempos.nuevas / COSTE.repaso),
    );
    tiempos.repaso += extra * COSTE.repaso;
    tiempos.nuevas -= extra * COSTE.repaso;
    repasos = atrasados.slice(0, cabenRepaso + extra);
  }

  // Las palabras nuevas, solo en los días normales. Lo que quedó pendiente ayer
  // entra primero; desde el día 29 ya no entra nada nuevo.
  const candidatas = estado.pendientesNuevas.length
    ? estado.pendientesNuevas.slice()
    : (dia <= 28 ? datos.nuevasDe(dia) : []);
  const caben = modo === "normal" ? Math.floor(tiempos.nuevas / COSTE.nueva) : 0;
  const nuevas = candidatas.slice(0, caben);
  const restantes = candidatas.slice(caben);

  // La escena del día; en la prueba y en mantenimiento, una ya vista al azar.
  let escena = datos.escenaPorDia.get(Math.min(dia, 28)) || null;
  if (modo !== "normal") {
    const vistas = datos.escenas.scenes.filter((s) => s.day <= 28);
    if (vistas.length) escena = vistas[Math.floor(Math.random() * vistas.length)];
  }

  const escucha = modo === "prueba"
    ? preguntasEscucha(estado, datos, Math.floor(tiempos.escucha / COSTE.escucha))
    : [];

  return {
    dia,
    modo,
    escena,
    nuevas,
    restantes,
    repasos,
    escucha,
    atrasados: atrasados.length,
    retos: escena && modo !== "mantenimiento" ? escena.challenges : [],
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

// La prueba final de escucha de los días 29 y 30: suena algo ya aprendido
// (una palabra o una frase de una escena) y hay que elegir su significado entre
// cuatro. Mezcla palabras y frases, y las frases salen de escenas distintas:
// como mucho dos de cada una.
export function preguntasEscucha(estado, datos, cuantas = 20) {
  if (cuantas <= 0) return [];

  const palabras = [];
  for (const id of Object.keys(estado.tarjetas)) {
    const it = datos.item(id);
    if (it && it.es) palabras.push({ clave: "p" + id, tts: it.tts, es: it.es, tipo: "palabra", de: "" });
  }

  const hasta = Math.min(28, estado.diaPlan);
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
