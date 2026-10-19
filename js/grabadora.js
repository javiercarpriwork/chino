// "Grábate y compárate": te grabas y la app pone tu voz justo después del modelo.
// La grabación no se guarda en ningún sitio: vive mientras estás en esa palabra.

let flujo = null;
let grabadora = null;
let trozos = [];
let ultimaUrl = null;

export const soportado = () =>
  Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

export const grabando = () => Boolean(grabadora && grabadora.state === "recording");

// Pide el micrófono una sola vez. Devuelve true si lo da.
export async function pedirPermiso() {
  if (flujo) return true;
  if (!soportado()) return false;
  try {
    flujo = await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch {
    return false;
  }
}

function mejorTipo() {
  const tipos = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg"];
  for (const t of tipos) {
    try { if (MediaRecorder.isTypeSupported(t)) return t; } catch {}
  }
  return "";
}

export async function empezar() {
  if (!(await pedirPermiso())) return false;
  trozos = [];
  const tipo = mejorTipo();
  grabadora = new MediaRecorder(flujo, tipo ? { mimeType: tipo } : undefined);
  grabadora.addEventListener("dataavailable", (e) => { if (e.data && e.data.size) trozos.push(e.data); });
  grabadora.start();
  return true;
}

// Para de grabar y devuelve la dirección del audio (o null si no hay nada).
export function parar() {
  return new Promise((resolve) => {
    if (!grabadora || grabadora.state === "inactive") return resolve(null);
    grabadora.addEventListener("stop", () => {
      const blob = new Blob(trozos, { type: grabadora.mimeType || "audio/mp4" });
      if (ultimaUrl) URL.revokeObjectURL(ultimaUrl);
      ultimaUrl = blob.size ? URL.createObjectURL(blob) : null;
      resolve(ultimaUrl);
    }, { once: true });
    try { grabadora.stop(); } catch { resolve(null); }
  });
}

export function reproducir(url) {
  return new Promise((resolve) => {
    if (!url) return resolve();
    const audio = new Audio(url);
    audio.addEventListener("ended", resolve, { once: true });
    audio.addEventListener("error", resolve, { once: true });
    audio.play().catch(() => resolve());
  });
}

// Suelta el micrófono (se apaga el puntito naranja del iPhone).
export function soltar() {
  try { if (flujo) flujo.getTracks().forEach((t) => t.stop()); } catch {}
  flujo = null;
  grabadora = null;
  if (ultimaUrl) { URL.revokeObjectURL(ultimaUrl); ultimaUrl = null; }
}
