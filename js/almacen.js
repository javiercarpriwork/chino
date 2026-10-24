// El progreso vive en el propio iPhone (localStorage), en una sola clave.
// Nada sale de aquí: la copia de seguridad la haces tú con Exportar.

const CLAVE = "chino.progreso.v1";

// Fecha de hoy en formato 2026-10-19, con la hora del teléfono.
export const hoyISO = (d = new Date()) => {
  const z = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

export const estadoInicial = () => ({
  version: 2,
  vistas: 0,            // cuántas palabras y moldes del plan has visto ya
  diaEstudio: 0,        // cuántas sesiones has hecho
  pruebaHecha: false,
  tarjetas: {},
  tonos: {},
  diasHechos: [],
  totalSegundos: 0,
  ultimaSesion: null,
  ajustes: {
    lenta: 0.55, mostrarHanzi: true, hora: "08:00", voz: "", reconocer: true,
    diasLargos: [6, 0],  // sábado y domingo: los días de 30 minutos
  },
});

export function cargar() {
  try {
    const texto = localStorage.getItem(CLAVE);
    if (!texto) return estadoInicial();
    const guardado = JSON.parse(texto);
    return alDia({ ...estadoInicial(), ...guardado, ajustes: { ...estadoInicial().ajustes, ...(guardado.ajustes || {}) } });
  } catch {
    return estadoInicial();
  }
}

// El plan cambió el 24 de octubre de 2026 (de 30 días de 25 min a 38 días de
// 10 y 30 min). Las palabras aprendidas se conservan; el calendario se rehace.
function alDia(estado) {
  if (estado.version === 2) return estado;
  const vistas = Object.keys(estado.tarjetas || {}).length;
  delete estado.diaPlan;
  delete estado.pendientesNuevas;
  return { ...estado, version: 2, vistas, diaEstudio: (estado.diasHechos || []).length, pruebaHecha: false };
}

export function guardar(estado) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado));
    return true;
  } catch {
    return false; // en navegación privada puede fallar: la sesión sigue funcionando
  }
}

export function reiniciar() {
  try { localStorage.removeItem(CLAVE); } catch {}
}

export function exportar(estado) {
  const texto = JSON.stringify({ ...estado, exportado: new Date().toISOString() }, null, 2);
  const url = URL.createObjectURL(new Blob([texto], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `chino-copia-${hoyISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importar(archivo) {
  const texto = await archivo.text();
  const datos = JSON.parse(texto);
  if (typeof datos !== "object" || !datos || !("tarjetas" in datos)) {
    throw new Error("Ese archivo no es una copia de la app.");
  }
  const limpio = { ...estadoInicial(), ...datos, ajustes: { ...estadoInicial().ajustes, ...(datos.ajustes || {}) } };
  guardar(limpio);
  return limpio;
}
