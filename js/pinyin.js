// Tonos del pinyin: sacar el tono de una sílaba y pintarla con su color.

const MARCAS = {
  1: "āēīōūǖĀĒĪŌŪǕ",
  2: "áéíóúǘÁÉÍÓÚǗ",
  3: "ǎěǐǒǔǚǍĚǏǑǓǙ",
  4: "àèìòùǜÀÈÌÒÙǛ",
};

// 0 = neutro
export function tonoDe(silaba) {
  for (const [tono, marcas] of Object.entries(MARCAS)) {
    for (const c of String(silaba)) if (marcas.includes(c)) return Number(tono);
  }
  return 0;
}

export function esUnaSilaba(pinyin) {
  return !/[\s·]/.test(String(pinyin).trim());
}

const escapar = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Devuelve el pinyin con un <span> por sílaba, coloreado por tono.
export function colorear(pinyin) {
  return String(pinyin)
    .split(/(\s+)/)
    .map((trozo) => (trozo.trim() ? `<span class="t${tonoDe(trozo)}">${escapar(trozo)}</span>` : trozo))
    .join("");
}

export { escapar };
