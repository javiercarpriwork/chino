// Repaso espaciado por cajas: nueva → 1 día → 3 → 7 → 14 → 30.
// "Lo sé" sube una caja. "Otra vez" vuelve a la caja de 1 día.
// Este archivo no toca el navegador: así se puede probar con node.

export const CAJAS = [1, 3, 7, 14, 30];

export function sumarDias(iso, dias) {
  const [a, m, d] = iso.split("-").map(Number);
  const fecha = new Date(a, m - 1, d);
  fecha.setDate(fecha.getDate() + dias);
  const z = (n) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${z(fecha.getMonth() + 1)}-${z(fecha.getDate())}`;
}

// Una palabra que se acaba de aprender entra en la caja 1: vuelve mañana.
export function estrenar(estado, id, hoy) {
  estado.tarjetas[id] = { caja: 1, proximo: sumarDias(hoy, CAJAS[0]), vistas: 1, fallos: 0, desde: hoy };
  return estado.tarjetas[id];
}

export function responder(estado, id, loSe, hoy) {
  const t = estado.tarjetas[id] || { caja: 1, vistas: 0, fallos: 0, desde: hoy };
  t.vistas += 1;
  if (loSe) t.caja = Math.min(t.caja + 1, CAJAS.length);
  else { t.caja = 1; t.fallos += 1; }
  t.proximo = sumarDias(hoy, CAJAS[t.caja - 1]);
  estado.tarjetas[id] = t;
  return t;
}

// Las más atrasadas primero.
export function pendientes(estado, hoy) {
  return Object.entries(estado.tarjetas)
    .filter(([, t]) => t.proximo <= hoy)
    .sort((a, b) => (a[1].proximo < b[1].proximo ? -1 : a[1].proximo > b[1].proximo ? 1 : 0))
    .map(([id]) => id);
}

export const dominadas = (estado) => Object.values(estado.tarjetas).filter((t) => t.caja >= 4).length;
export const aprendiendo = (estado) => Object.values(estado.tarjetas).filter((t) => t.caja < 4).length;

export function estadoDe(estado, id) {
  const t = estado.tarjetas[id];
  if (!t) return "nueva";
  return t.caja >= 4 ? "dominada" : "aprendiendo";
}
