// Extra opcional: si el navegador sabe reconocer voz en chino, te dice qué ha
// entendido, con su pinyin. Si no puede, no pasa nada: todo funciona igual.

const Motor = window.SpeechRecognition || window.webkitSpeechRecognition;

export const soportado = () => Boolean(Motor);

let diccionario = null;

// El pinyin se saca de vocab.json y de las palabras de las escenas: sin librerías.
export function prepararDiccionario(datos) {
  diccionario = new Map();
  for (const it of datos.items.values()) {
    for (const forma of String(it.hanzi).split("/").map((s) => s.trim())) {
      if (forma) diccionario.set(forma, it.pinyin.split("/")[0].trim());
    }
  }
  for (const s of datos.escenas.scenes) for (const p of s.sceneWords || []) diccionario.set(p.hanzi, p.pinyin);
  for (const c of datos.cortesia) diccionario.set(c.hanzi, c.pinyin);
  return diccionario;
}

// Va cogiendo el trozo más largo que conozca, de izquierda a derecha.
export function aPinyin(texto) {
  if (!diccionario) return "";
  const limpio = String(texto).replace(/[\s，。！？、,.!?]/g, "");
  const fuera = [];
  let i = 0;
  while (i < limpio.length) {
    let encontrado = "";
    for (let largo = Math.min(4, limpio.length - i); largo > 0; largo--) {
      const trozo = limpio.slice(i, i + largo);
      if (diccionario.has(trozo)) { encontrado = diccionario.get(trozo); i += largo; break; }
    }
    if (!encontrado) { fuera.push(limpio[i]); i += 1; }
    else fuera.push(encontrado);
  }
  return fuera.join(" ");
}

const soloChino = (t) => String(t).replace(/[^㐀-鿿]/g, "");

// ¿Se parece a lo que tenía que decir?
export function compara(oido, objetivo) {
  const a = soloChino(oido);
  const b = soloChino(objetivo);
  if (!a) return { nivel: "nada", texto: "No he oído nada." };
  if (a === b) return { nivel: "bien", texto: "¡Eso es!" };
  if (b.includes(a) || a.includes(b)) return { nivel: "casi", texto: "Casi: te falta o te sobra algo." };
  const comunes = [...new Set(a)].filter((c) => b.includes(c)).length;
  if (comunes >= Math.ceil(b.length / 2)) return { nivel: "casi", texto: "Por ahí va, pero no del todo." };
  return { nivel: "mal", texto: "No es eso." };
}

// Escucha una vez y devuelve lo que ha entendido.
export function escuchar({ segundos = 6 } = {}) {
  return new Promise((resolve) => {
    if (!Motor) return resolve({ error: "sin-soporte" });
    let rec;
    try { rec = new Motor(); } catch { return resolve({ error: "sin-soporte" }); }
    rec.lang = "zh-TW";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    let listo = false;
    const acabar = (r) => { if (listo) return; listo = true; try { rec.stop(); } catch {} resolve(r); };

    rec.addEventListener("result", (e) => {
      const r = e.results[0] && e.results[0][0];
      acabar({ texto: r ? r.transcript : "", confianza: r ? r.confidence : 0 });
    });
    rec.addEventListener("error", (e) => acabar({ error: e.error || "error" }));
    rec.addEventListener("end", () => acabar({ texto: "" }));

    try { rec.start(); } catch { return acabar({ error: "no-arranca" }); }
    setTimeout(() => acabar({ texto: "" }), segundos * 1000);
  });
}
