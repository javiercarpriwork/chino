// Comprueba, carácter a carácter, que el chino de scenes.json solo usa
// vocabulario que Javi ya conoce ese día.
//
// Se ejecuta con:   node tools/validar.mjs
// Devuelve 0 si todo está bien y 1 si hay algún error.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const vocab = JSON.parse(readFileSync(join(raiz, "vocab.json"), "utf8"));
const escenas = JSON.parse(readFileSync(join(raiz, "scenes.json"), "utf8"));

const ES_HANZI = /[㐀-鿿]/;
const PUNTUACION = new Set([..."，。！？、：；…「」『』（）·　 ", ..."0123456789"]);

const errores = [];
const avisos = [];

// ---------------------------------------------------------------- vocabulario
// Una palabra puede venir como "這 / 這裡" (dos formas de lo mismo).
const formas = (w) => [...String(w.hanzi).split("/").map((s) => s.trim()), ...(w.alt || [])];

const caracteresDe = (texto) => [...String(texto)].filter((c) => ES_HANZI.test(c));

// Caracteres que Javi conoce el día d:
//  - las palabras de vocab.json de ese día o anteriores
//  - los ejemplos de las expresiones de ese día o anteriores (la app se los
//    muestra ese día, así que cuentan como vistos)
//  - las palabras de cortesía, que se aprenden el día 1
//  - las palabras de la escena declaradas ese día o antes
function permitidosHasta(d) {
  const set = new Set();
  const meter = (t) => caracteresDe(t).forEach((c) => set.add(c));
  for (const w of vocab.words) if (w.day <= d) formas(w).forEach(meter);
  for (const e of vocab.expressions) if (e.day <= d) { meter(e.example); meter(e.pattern); }
  for (const c of escenas.meta.courtesy || []) meter(c.hanzi);
  for (const s of escenas.scenes) if (s.day <= d) for (const p of s.sceneWords || []) meter(p.hanzi);
  return set;
}

// Palabras y expresiones nuevas de un día concreto.
const nuevasDe = (d) => [
  ...vocab.words.filter((w) => w.day === d).map((w) => ({ ref: w.id, hanzi: w.hanzi, pinyin: w.pinyin })),
  ...vocab.expressions.filter((e) => e.day === d).map((e) => ({ ref: e.id, hanzi: e.pattern, pinyin: e.pinyin })),
];

// ---------------------------------------------------------------- revisión
function revisarTexto(texto, permitidos, donde, dia) {
  const fuera = new Set();
  for (const c of String(texto)) {
    if (PUNTUACION.has(c)) continue;
    if (ES_HANZI.test(c)) { if (!permitidos.has(c)) fuera.add(c); continue; }
    fuera.add(c); // letras latinas, símbolos raros: fuera
  }
  if (fuera.size) {
    errores.push(`día ${dia} · ${donde}: ${[...fuera].join(" ")}  →  «${texto}»`);
  }
}

const informe = [];

for (const s of [...escenas.scenes].sort((a, b) => a.day - b.day)) {
  const d = s.day;
  const permitidos = permitidosHasta(d);
  const nuevas = nuevasDe(d);

  // --- forma de la escena
  if ((s.sceneWords || []).length > 3) {
    errores.push(`día ${d}: ${s.sceneWords.length} palabras de la escena (el máximo es 3)`);
  }
  if (s.dialogue.length < 6 || s.dialogue.length > 10) {
    errores.push(`día ${d}: el diálogo tiene ${s.dialogue.length} líneas (tienen que ser entre 6 y 10)`);
  }
  if (s.questions.length !== 3) errores.push(`día ${d}: ${s.questions.length} preguntas (tienen que ser 3)`);
  if (s.challenges.length !== 5) errores.push(`día ${d}: ${s.challenges.length} retos (tienen que ser 5)`);
  for (const [i, q] of s.questions.entries()) {
    if (q.options.length !== 3) errores.push(`día ${d}, pregunta ${i + 1}: ${q.options.length} opciones (tienen que ser 3)`);
    if (!(q.answer >= 0 && q.answer < q.options.length)) errores.push(`día ${d}, pregunta ${i + 1}: la respuesta correcta apunta a una opción que no existe`);
  }

  // --- una palabra de la escena que ya está en vocab.json es solo un aviso
  for (const p of s.sceneWords || []) {
    const yaEsta = vocab.words.find((w) => formas(w).includes(p.hanzi));
    if (yaEsta) {
      avisos.push(`día ${d}: «${p.hanzi}» ya está en vocab.json (día ${yaEsta.day}, ${yaEsta.id}): se adelanta a propósito`);
    }
  }

  // --- todo el chino, carácter a carácter
  for (const [i, l] of s.dialogue.entries()) revisarTexto(l.hanzi, permitidos, `diálogo línea ${i + 1}`, d);
  for (const [i, c] of s.challenges.entries()) revisarTexto(c.hanzi, permitidos, `reto ${i + 1}`, d);
  for (const e of s.examples) revisarTexto(e.hanzi, permitidos, `ejemplo de ${e.ref}`, d);
  for (const p of s.sceneWords || []) revisarTexto(p.hanzi, permitidos, `palabra de la escena «${p.hanzi}»`, d);

  // --- cada palabra nueva del día necesita su frase de ejemplo
  const conEjemplo = new Set(s.examples.map((e) => e.ref));
  const sinEjemplo = nuevas.filter((n) => !conEjemplo.has(n.ref));
  if (sinEjemplo.length) {
    errores.push(`día ${d}: faltan frases de ejemplo para ${sinEjemplo.map((n) => `${n.ref} ${n.hanzi}`).join(", ")}`);
  }
  const sobran = s.examples.filter((e) => !nuevas.some((n) => n.ref === e.ref));
  if (sobran.length) {
    errores.push(`día ${d}: hay ejemplos de palabras que no son de este día: ${sobran.map((e) => e.ref).join(", ")}`);
  }

  // --- cuántas palabras del día salen en el diálogo
  const textoDialogo = s.dialogue.map((l) => l.hanzi).join("");
  const dentro = [];
  const fuera = [];
  for (const n of nuevas) {
    const usada = n.ref.startsWith("w")
      ? formas(vocab.words.find((w) => w.id === n.ref)).some((f) => f && textoDialogo.includes(f))
      : caracteresDe(vocab.expressions.find((e) => e.id === n.ref).pattern).every((c) => textoDialogo.includes(c));
    (usada ? dentro : fuera).push(n.hanzi);
  }
  informe.push({ dia: d, titulo: s.title, lineas: s.dialogue.length, usadas: dentro.length, total: nuevas.length, sinUsar: fuera, palabrasEscena: (s.sceneWords || []).map((p) => p.hanzi) });
}

// ------------------------------------------------- informe para leer de un vistazo
console.log("\n=========== INFORME DE LAS ESCENAS ===========\n");
console.log("Día  Situación                          Líneas  Palabras del día en la escena");
for (const r of informe) {
  console.log(
    String(r.dia).padStart(3) +
    "  " + r.titulo.padEnd(34).slice(0, 34) +
    String(r.lineas).padStart(5) +
    "   " + `${r.usadas}/${r.total}`.padEnd(7) +
    (r.sinUsar.length ? `sin usar: ${r.sinUsar.join(" ")}` : "todas")
  );
  if (r.palabrasEscena.length) console.log(`     palabras de la escena: ${r.palabrasEscena.join(" ")}`);
}

if (avisos.length) {
  console.log("\n--- Avisos (no son errores) ---");
  for (const a of avisos) console.log("• " + a);
}

// Las expresiones de vocab.json a veces usan caracteres de días posteriores.
// No se toca vocab.json: solo se informa.
const adelantadas = [];
for (const e of vocab.expressions) {
  const permitidos = permitidosHasta(e.day - 1);
  const fuera = [...new Set(caracteresDe(e.example).filter((c) => !permitidos.has(c)))];
  if (fuera.length) adelantadas.push(`${e.id} (día ${e.day}) ${e.example} → ${fuera.join(" ")}`);
}
if (adelantadas.length) {
  console.log(`\n--- Para que lo sepas: ${adelantadas.length} de ${vocab.expressions.length} ejemplos de vocab.json usan algún carácter de días posteriores ---`);
  console.log("    (no se toca vocab.json; esos caracteres cuentan como vistos ese día)");
}

if (errores.length) {
  console.log("\n--- ERRORES ---");
  for (const e of errores) console.log("✗ " + e);
  console.log(`\n${errores.length} error(es). Hay que arreglarlos.\n`);
  process.exit(1);
}

console.log(`\n✓ Todo correcto: ${informe.length} escena(s), sin una sola palabra fuera de lo aprendido.\n`);
