// Genera el icono de la app en PNG, sin instalar nada.
// Se ejecuta con:  node tools/iconos.mjs
// Dibuja los tres anillos (Escuchar, Hablar, Repasar) sobre fondo oscuro.

import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

// --- PNG a mano (cabecera, datos comprimidos y fin)
const TABLA = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = TABLA[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function trozo(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([largo, cuerpo, crc]);
}
function png(tam, pixeles) {
  const anchoFila = tam * 4 + 1;
  const filas = Buffer.alloc(anchoFila * tam);
  for (let y = 0; y < tam; y++) {
    filas[y * anchoFila] = 0; // sin filtro
    pixeles.copy(filas, y * anchoFila + 1, y * tam * 4, (y + 1) * tam * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tam, 0);
  ihdr.writeUInt32BE(tam, 4);
  ihdr[8] = 8;  // bits por canal
  ihdr[9] = 6;  // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    trozo("IHDR", ihdr),
    trozo("IDAT", deflateSync(filas, { level: 9 })),
    trozo("IEND", Buffer.alloc(0)),
  ]);
}

// --- el dibujo
const FONDO = [18, 18, 20];
const ANILLOS = [
  { radio: 0.345, color: [10, 132, 255], desde: -90, grados: 300 },  // Escuchar
  { radio: 0.235, color: [48, 209, 88], desde: -90, grados: 265 },   // Hablar
  { radio: 0.125, color: [255, 159, 10], desde: -90, grados: 220 },  // Repasar
];

const mezcla = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

function dibujar(tam) {
  const px = Buffer.alloc(tam * tam * 4);
  const c = tam / 2;
  const grosor = tam * 0.072;
  for (let y = 0; y < tam; y++) {
    for (let x = 0; x < tam; x++) {
      let color = FONDO;
      const dx = x + 0.5 - c, dy = y + 0.5 - c;
      const dist = Math.hypot(dx, dy);
      let angulo = (Math.atan2(dy, dx) * 180) / Math.PI; // -180..180, 0 = derecha
      for (const a of ANILLOS) {
        const r = a.radio * tam;
        const fuera = Math.abs(dist - r) - grosor / 2;
        if (fuera > 0.8) continue;
        let rel = angulo - a.desde;
        while (rel < 0) rel += 360;
        if (rel > a.grados) continue;
        const suave = Math.max(0, Math.min(1, 0.8 - fuera));
        color = mezcla(color, a.color, suave);
      }
      const i = (y * tam + x) * 4;
      px[i] = color[0]; px[i + 1] = color[1]; px[i + 2] = color[2]; px[i + 3] = 255;
    }
  }
  return png(tam, px);
}

mkdirSync(join(raiz, "iconos"), { recursive: true });
for (const tam of [180, 192, 512]) {
  const archivo = join(raiz, "iconos", `icono-${tam}.png`);
  writeFileSync(archivo, dibujar(tam));
  console.log("hecho:", archivo);
}
