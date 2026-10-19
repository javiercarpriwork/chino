// El progreso vive en el propio iPhone (localStorage), en una sola clave.
// Nada sale de aquí: la copia de seguridad la haces tú con Exportar.

const CLAVE = "chino.progreso.v1";

// Fecha de hoy en formato 2026-10-19, con la hora del teléfono.
export const hoyISO = (d = new Date()) => {
  const z = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

export const estadoInicial = () => ({
  version: 1,
  diaPlan: 1,
  pendientesNuevas: [],
  tarjetas: {},
  tonos: {},
  diasHechos: [],
  totalSegundos: 0,
  ultimaSesion: null,
  ajustes: { lenta: 0.55, mostrarHanzi: true, hora: "08:00", voz: "", reconocer: true },
});

export function cargar() {
  try {
    const texto = localStorage.getItem(CLAVE);
    if (!texto) return estadoInicial();
    const guardado = JSON.parse(texto);
    return { ...estadoInicial(), ...guardado, ajustes: { ...estadoInicial().ajustes, ...(guardado.ajustes || {}) } };
  } catch {
    return estadoInicial();
  }
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
