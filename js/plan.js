// El calendario del plan: del 24 de octubre al 30 de noviembre de 2026.
//
// Dos tipos de día:
//   - largo (sábado y domingo, o los dos que elijas): 30 minutos, 14 palabras.
//   - corto (el resto): 10 minutos, 7 palabras.
//
// El contenido va en bloques: cada bloque es una escena y las 20 palabras y
// moldes de esa escena. Un bloque dura dos o tres días, así que oyes la misma
// escena varios días seguidos y cada vez entiendes más.
//
// Este archivo no toca el navegador: se puede probar con node.

export const INICIO = "2026-10-24";
export const FIN = "2026-11-30";

export const BLOQUES = 17;               // las 17 primeras escenas
export const ITEMS_POR_BLOQUE = 20;      // 18 palabras + 2 moldes
export const TOTAL_ITEMS = BLOQUES * ITEMS_POR_BLOQUE; // 340

export const NUEVAS = { largo: 14, corto: 7 };
export const MINUTOS = { largo: 30, corto: 10 };
export const DIAS_LARGOS = [6, 0];       // 6 = sábado, 0 = domingo

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function aFecha(iso) {
  const [a, m, d] = String(iso).split("-").map(Number);
  return new Date(a, m - 1, d);
}

export function aIso(fecha) {
  const z = (n) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${z(fecha.getMonth() + 1)}-${z(fecha.getDate())}`;
}

export const diaSemana = (iso) => aFecha(iso).getDay();
export const nombreDia = (iso) => DIAS[diaSemana(iso)];

export function tipoDeDia(iso, diasLargos = DIAS_LARGOS) {
  return (diasLargos || DIAS_LARGOS).includes(diaSemana(iso)) ? "largo" : "corto";
}

// Todas las fechas del plan, con su tipo.
export function fechasDelPlan(diasLargos = DIAS_LARGOS) {
  const fechas = [];
  const fin = aFecha(FIN);
  for (let d = aFecha(INICIO); d <= fin; d.setDate(d.getDate() + 1)) {
    const iso = aIso(d);
    fechas.push({ fecha: iso, tipo: tipoDeDia(iso, diasLargos) });
  }
  return fechas;
}

export function resumenDelPlan(diasLargos = DIAS_LARGOS) {
  const fechas = fechasDelPlan(diasLargos);
  const largos = fechas.filter((f) => f.tipo === "largo").length;
  const cortos = fechas.length - largos;
  return {
    dias: fechas.length,
    largos,
    cortos,
    minutos: largos * MINUTOS.largo + cortos * MINUTOS.corto,
    hueco: largos * NUEVAS.largo + cortos * NUEVAS.corto, // cuántas palabras caben
  };
}

// Cuántas palabras deberías llevar vistas al acabar la sesión de esa fecha.
export function idealHasta(iso, diasLargos = DIAS_LARGOS) {
  let total = 0;
  for (const f of fechasDelPlan(diasLargos)) {
    if (f.fecha > iso) break;
    total += NUEVAS[f.tipo];
  }
  return Math.min(total, TOTAL_ITEMS);
}

// Las 340 palabras y moldes del plan, en el orden de siempre (por frecuencia).
export function itemsDelPlan(datos, bloques = BLOQUES) {
  const ids = [];
  for (let b = 1; b <= bloques; b++) ids.push(...datos.nuevasDe(b));
  return ids;
}

// En qué bloque (= qué escena) cae la palabra número `indice`.
export function bloqueDe(indice) {
  return Math.min(BLOQUES, Math.floor(Math.max(0, indice) / ITEMS_POR_BLOQUE) + 1);
}

// Días que faltan para el final del plan (0 si ya pasó).
export function diasHasta(iso, final = FIN) {
  const uno = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.round((aFecha(final) - aFecha(iso)) / uno));
}
