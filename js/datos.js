// Carga vocab.json y scenes.json y los deja listos para usar.

const ruta = (archivo) => new URL("../" + archivo, import.meta.url);

export async function cargarDatos() {
  const [vocab, escenas] = await Promise.all([
    fetch(ruta("vocab.json")).then((r) => r.json()),
    fetch(ruta("scenes.json")).then((r) => r.json()),
  ]);

  // Un "item" es una palabra o un molde: todo lo que se aprende y se repasa.
  const items = new Map();
  for (const w of vocab.words) {
    items.set(w.id, {
      id: w.id, tipo: "palabra", dia: w.day,
      hanzi: w.hanzi, pinyin: w.pinyin, es: w.es, tts: w.tts || w.hanzi,
    });
  }
  for (const e of vocab.expressions) {
    items.set(e.id, {
      id: e.id, tipo: "molde", dia: e.day,
      hanzi: e.pattern, pinyin: e.pinyin, es: e.es, tts: e.tts || e.example,
      ejemploFijo: e.example,
    });
  }

  const escenaPorDia = new Map(escenas.scenes.map((s) => [s.day, s]));

  const ejemplos = new Map();
  for (const s of escenas.scenes) for (const ej of s.examples) ejemplos.set(ej.ref, ej);

  const porDia = new Map();
  for (const it of items.values()) {
    if (!porDia.has(it.dia)) porDia.set(it.dia, []);
    porDia.get(it.dia).push(it.id);
  }

  return {
    vocab,
    escenas,
    items,
    escenaPorDia,
    ejemplos,
    cortesia: escenas.meta.courtesy || [],
    nuevasDe: (dia) => (porDia.get(dia) || []).slice(),
    item: (id) => items.get(id),
    ejemplo: (id) => ejemplos.get(id),
    totalItems: items.size,
  };
}
