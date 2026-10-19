// Servidor local para probar la app en el ordenador y en el iPhone.
//
// Se ejecuta con:   node tools/servidor.mjs
// Luego se abre:    http://localhost:5173
//
// También dice la dirección para abrirlo en el iPhone estando en el mismo wifi.

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize, extname } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUERTO = 5173;
const INICIO = "/index.html";

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const servidor = createServer(async (pet, res) => {
  let ruta = decodeURIComponent(new URL(pet.url, "http://x").pathname);
  if (ruta === "/") ruta = INICIO;

  // nada de salirse de la carpeta del proyecto
  const archivo = join(raiz, normalize(ruta).replace(/^(\.\.[/\\])+/, ""));
  if (!archivo.startsWith(raiz)) {
    res.writeHead(403).end("No");
    return;
  }

  try {
    const datos = await readFile(archivo);
    res.writeHead(200, {
      "content-type": TIPOS[extname(archivo).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(datos);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("No encuentro " + ruta);
  }
});

servidor.listen(PUERTO, () => {
  const ips = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === "IPv4" && !i.internal)
    .map((i) => i.address);

  console.log("\n  La app ya está funcionando.\n");
  console.log(`  En este ordenador:  http://localhost:${PUERTO}`);
  for (const ip of ips) console.log(`  En el iPhone (mismo wifi):  http://${ip}:${PUERTO}`);
  console.log("\n  Para pararlo: pulsa Ctrl + C en esta ventana.\n");
});
