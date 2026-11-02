// El calendario del plan: del 2 de noviembre al 24 de diciembre de 2026 (hasta Navidad).
// Antes iba del 24-oct al 30-nov con 340 palabras; el 2-11-2026 Javi lo amplió a las 550
// (las 28 escenas) con el fin de semana de 45 minutos dentro de su sesión de chino de 2 h.
//
// Dos tipos de día:
//   - largo (sábado y domingo, o los dos que elijas): 45 minutos, 21 palabras.
//   - corto (el resto): 10 minutos, 7 palabras.
//
// El contenido va en bloques: cada bloque es una escena y las 20 palabras y
// moldes de esa escena. Un bloque dura dos o tres días, así que oyes la misma
// escena varios días seguidos y cada vez entiendes más.
//
// Este archivo no toca el navegador: se puede probar con node.

export const INICIO = "2026-11-02";
export const FIN = "2026-12-24";

export const BLOQUES = 28;               // las 28 escenas
export const ITEMS_POR_BLOQUE = 20;      // 18 palabras + 2 moldes (bloques 1-25)
// Tamaño real de cada bloque según vocab.json: 20 en los días 1-25; 18, 18 y 14 en los 26-28.
export const TAMANOS = [...Array(25).fill(20), 18, 18, 14];
export const TOTAL_ITEMS = TAMANOS.slice(0, BLOQUES).reduce((a, b) => a + b, 0); // 550

export const NUEVAS = { largo: 21, corto: 7 };
export const MINUTOS = { largo: 45, corto: 10 };
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

// Las 550 palabras y moldes del plan, en el orden de siempre (por frecuencia).
export function itemsDelPlan(datos, bloques = BLOQUES) {
  const ids = [];
  for (let b = 1; b <= bloques; b++) ids.push(...datos.nuevasDe(b));
  return ids;
}

// En qué bloque (= qué escena) cae la palabra número `indice`.
export function bloqueDe(indice) {
  let resto = Math.max(0, indice);
  for (let b = 1; b <= BLOQUES; b++) {
    if (resto < TAMANOS[b - 1]) return b;
    resto -= TAMANOS[b - 1];
  }
  return BLOQUES;
}

// Días que faltan para el final del plan (0 si ya pasó).
export function diasHasta(iso, final = FIN) {
  const uno = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.round((aFecha(final) - aFecha(iso)) / uno));
}
