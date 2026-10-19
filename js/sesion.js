// La sesión diaria: 25 minutos fijos repartidos en seis pasos.
// Si hay muchos repasos atrasados, el repaso se come tiempo de las palabras
// nuevas y ese día entran menos; lo que falte entra al día siguiente.
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

export const COSTE = { repaso: 8, nueva: 24, reto: 35 };

export const PASOS = [
  { clave: "oido", titulo: "Oído", nota: "¿Qué tono has oído?" },
  { clave: "escena", titulo: "La escena", nota: "Escucha y responde" },
  { clave: "nuevas", titulo: "Nuevas", nota: "Las palabras de hoy" },
  { clave: "repaso", titulo: "Repaso", nota: "Solo el sonido" },
  { clave: "dilo", titulo: "Dilo tú", nota: "Tú lo dices" },
  { clave: "real", titulo: "Hazlo de verdad", nota: "Tú eres uno de los personajes" },
];

export function planificar(estado, datos, hoy) {
  const dia = estado.diaPlan;
  const esPrueba = dia >= 29;

  const atrasados = pendientes(estado, hoy);

  // Cuántos repasos caben en sus 6 minutos
  const cabenRepaso = Math.floor(PRESUPUESTO.repaso / COSTE.repaso);
  let repasos = atrasados.slice(0, cabenRepaso);
  let robadoANuevas = 0;

  if (atrasados.length > cabenRepaso) {
    const extra = Math.min(
      atrasados.length - cabenRepaso,
      Math.floor(PRESUPUESTO.nuevas / COSTE.repaso),
    );
    robadoANuevas = extra * COSTE.repaso;
    repasos = atrasados.slice(0, cabenRepaso + extra);
  }

  // Lo que queda para las palabras nuevas
  const tiempoNuevas = esPrueba ? 0 : Math.max(0, PRESUPUESTO.nuevas - robadoANuevas);
  const candidatas = estado.pendientesNuevas.length
    ? estado.pendientesNuevas.slice()
    : (dia <= 28 ? datos.nuevasDe(dia) : []);
  const caben = Math.floor(tiempoNuevas / COSTE.nueva);
  const nuevas = esPrueba ? [] : candidatas.slice(0, caben);
  const restantes = esPrueba ? candidatas : candidatas.slice(caben);

  // La escena del día (en los días 29 y 30, una ya vista al azar)
  let escena = datos.escenaPorDia.get(Math.min(dia, 28)) || null;
  if (esPrueba) {
    const vistas = datos.escenas.scenes.filter((s) => s.day <= 28);
    escena = vistas[Math.floor(Math.random() * vistas.length)];
  }

  return {
    dia,
    esPrueba,
    escena,
    nuevas,
    restantes,
    repasos,
    atrasados: atrasados.length,
    retos: escena ? escena.challenges : [],
    tiempos: {
      ...PRESUPUESTO,
      nuevas: tiempoNuevas,
      repaso: PRESUPUESTO.repaso + robadoANuevas,
    },
  };
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
