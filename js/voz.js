// La voz del aparato en chino de Taiwán (zh-TW), normal y lenta.

let voces = [];
let elegida = null;
let preferida = "";

export const hayVoz = () => Boolean(elegida);
export const vozActual = () => elegida;
export const listaVoces = () => voces.filter((v) => /^zh/i.test(v.lang));

function buscar() {
  voces = window.speechSynthesis ? speechSynthesis.getVoices() : [];
  if (!voces.length) return false;
  const guardada = voces.find((v) => v.name === preferida);
  const tw = voces.filter((v) => /zh[-_]TW|zh[-_]Hant|Chinese \(Taiwan\)/i.test(v.lang + " " + v.name));
  const otras = voces.filter((v) => /^zh/i.test(v.lang));
  elegida = guardada || tw[0] || otras[0] || null;
  return true;
}

export function preparar(nombrePreferido = "") {
  preferida = nombrePreferido;
  if (!window.speechSynthesis) return;
  buscar();
  speechSynthesis.addEventListener("voiceschanged", buscar);
}

export function elegirVoz(nombre) {
  preferida = nombre;
  buscar();
}

// Estado de la voz, para avisar en Ajustes.
export function diagnostico() {
  if (!window.speechSynthesis) return { nivel: "mal", texto: "Este navegador no sabe hablar. Usa Safari o Chrome." };
  if (!voces.length) return { nivel: "aviso", texto: "Todavía no encuentro las voces. Toca cualquier botón de audio." };
  if (!elegida) {
    return {
      nivel: "mal",
      texto: "No hay ninguna voz china en este aparato. En el iPhone: Ajustes › Accesibilidad › Contenido leído › Voces › Chino (Taiwán). En Windows: Configuración › Hora e idioma › Idioma y región › añadir 中文 (繁體，台灣).",
    };
  }
  if (!/TW|Hant|Taiwan/i.test(elegida.lang + elegida.name)) {
    return { nivel: "aviso", texto: `Solo hay voz china de ${elegida.lang} (${elegida.name}), no de Taiwán. Suena distinto, pero se entiende.` };
  }
  return { nivel: "bien", texto: `Voz de Taiwán: ${elegida.name}.` };
}

export function callar() {
  try { speechSynthesis.cancel(); } catch {}
}

// Dice un texto. Devuelve una promesa que acaba cuando termina de hablar.
export function decir(texto, { lenta = false, velocidadLenta = 0.55 } = {}) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis || !texto) return resolve();
    callar();
    const u = new SpeechSynthesisUtterance(String(texto));
    if (elegida) { u.voice = elegida; u.lang = elegida.lang; } else { u.lang = "zh-TW"; }
    u.rate = lenta ? velocidadLenta : 1;
    u.addEventListener("end", () => resolve());
    u.addEventListener("error", () => resolve());
    speechSynthesis.speak(u);
    if (!elegida) buscar(); // en iOS la lista llega tras el primer toque
  });
}

// Dice varias cosas seguidas, con una pausa entre ellas.
export async function decirSeguido(textos, { pausa = 350, lenta = false, velocidadLenta = 0.55 } = {}) {
  for (const t of textos) {
    await decir(t, { lenta, velocidadLenta });
    await new Promise((r) => setTimeout(r, pausa));
  }
}
