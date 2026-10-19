// Guarda la app entera la primera vez para que funcione sin internet.
// Si cambias algo de la app, sube el número de VERSION y se actualiza sola.

const VERSION = "chino-v1";

const ARCHIVOS = [
  "./",
  "./index.html",
  "./estilos.css",
  "./manifest.webmanifest",
  "./vocab.json",
  "./scenes.json",
  "./js/pantallas.js",
  "./js/datos.js",
  "./js/almacen.js",
  "./js/voz.js",
  "./js/repaso.js",
  "./js/sesion.js",
  "./js/pinyin.js",
  "./js/recordatorio.js",
  "./iconos/icono-180.png",
  "./iconos/icono-192.png",
  "./iconos/icono-512.png",
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (ev) => {
  const pet = ev.request;
  if (pet.method !== "GET") return;

  // Al abrir la app sin internet, siempre la página principal.
  if (pet.mode === "navigate") {
    ev.respondWith(
      fetch(pet).catch(() => caches.match("./index.html").then((r) => r || caches.match("./"))),
    );
    return;
  }

  ev.respondWith(
    caches.match(pet).then((guardado) => {
      if (guardado) return guardado;
      return fetch(pet).then((resp) => {
        if (resp.ok && new URL(pet.url).origin === location.origin) {
          const copia = resp.clone();
          caches.open(VERSION).then((c) => c.put(pet, copia));
        }
        return resp;
      }).catch(() => guardado);
    }),
  );
});
