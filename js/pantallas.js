// Las pantallas y la sesión diaria.
// Fase 2: funciona entero menos el micrófono (llega en la fase 3).

import { cargarDatos } from "./datos.js";
import * as almacen from "./almacen.js";
import * as voz from "./voz.js";
import * as repaso from "./repaso.js";
import { planificar, PASOS, silabasParaTonos } from "./sesion.js";
import { colorear, escapar, tonoDe, esUnaSilaba } from "./pinyin.js";
import { descargarRecordatorio } from "./recordatorio.js";
import * as grabadora from "./grabadora.js";
import * as reconocer from "./reconocer.js";

let datos, estado;
let ses = null;
let reloj = null;

const vista = () => document.getElementById("vista");
const pestanas = () => document.getElementById("pestanas");
const fechaHoy = () => almacen.hoyISO();
const opcionesVoz = () => ({ velocidadLenta: estado.ajustes.lenta });
const $ = (sel) => vista().querySelector(sel);
const $$ = (sel) => [...vista().querySelectorAll(sel)];

export async function arrancar() {
  estado = almacen.cargar();
  voz.preparar(estado.ajustes.voz);
  datos = await cargarDatos();
  reconocer.prepararDiccionario(datos);
  for (const b of pestanas().querySelectorAll("[data-ir]")) b.onclick = () => ir(b.dataset.ir);
  ir("hoy");
}

const PANTALLAS = {};

function ir(nombre) {
  if (ses) terminarReloj();
  ses = null;
  document.body.classList.remove("sesion");
  pestanas().hidden = false;
  for (const b of pestanas().querySelectorAll("[data-ir]")) {
    b.setAttribute("aria-current", String(b.dataset.ir === nombre));
  }
  (PANTALLAS[nombre] || PANTALLAS.hoy)();
  window.scrollTo(0, 0);
}

function montar(html) { vista().innerHTML = html; }

// ------------------------------------------------------------------ Hoy
function anillo(valor, objetivo, color, etiqueta, tam = 100) {
  const pct = objetivo > 0 ? Math.min(1, valor / objetivo) : 0;
  const grosor = tam * 0.12;
  const c0 = tam / 2;
  const r = c0 - grosor / 2 - 2;
  const c = 2 * Math.PI * r;
  return `<div class="anillo">
    <svg width="${tam}" height="${tam}" viewBox="0 0 ${tam} ${tam}" aria-hidden="true">
      <circle cx="${c0}" cy="${c0}" r="${r}" fill="none" stroke="var(--linea)" stroke-width="${grosor}"/>
      <circle cx="${c0}" cy="${c0}" r="${r}" fill="none" stroke="${color}" stroke-width="${grosor}" stroke-linecap="round"
              stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - pct)).toFixed(1)}"
              transform="rotate(-90 ${c0} ${c0})" style="transition:stroke-dashoffset .6s ease"/>
      <text x="${c0}" y="${c0 + tam * 0.07}" text-anchor="middle" font-size="${Math.round(tam * 0.26)}"
            font-weight="600" fill="var(--texto)">${valor}</text>
    </svg>
    <span>${etiqueta}</span>
  </div>`;
}

// Los pasos de hoy dependen del modo: los seis de siempre, los seis con la
// prueba de escucha en lugar de las palabras nuevas, o los dos de mantenimiento.
const pasos = () => PASOS[ses.plan.modo] || PASOS.normal;

function objetivosDe(p) {
  const lineas = p.escena ? p.escena.dialogue.length : 0;
  const mias = p.escena ? p.escena.dialogue.filter((l) => l.speaker === "B").length : 0;
  // En mantenimiento solo hablas en los repasos que van al revés: uno de cada tres.
  if (p.modo === "mantenimiento") {
    return {
      escuchar: Math.max(1, lineas),
      hablar: Math.max(1, Math.floor(p.repasos.length / 3)),
      repasar: Math.max(1, p.repasos.length),
    };
  }
  return {
    escuchar: Math.max(1, p.nuevas.length + p.escucha.length + lineas),
    hablar: Math.max(1, p.retos.length + mias),
    repasar: Math.max(1, p.repasos.length),
  };
}

function subtituloDeHoy(p) {
  if (p.modo === "prueba") return `Día ${p.dia} de 30 · prueba final de escucha`;
  if (p.modo === "mantenimiento") return "Mantenimiento · 10 minutos al día";
  return `Día ${p.dia} de 30`;
}

PANTALLAS.hoy = function () {
  const p = planificar(estado, datos, fechaHoy());
  const obj = objetivosDe(p);
  const u = estado.ultimaSesion && estado.ultimaSesion.fecha === fechaHoy() ? estado.ultimaSesion : null;
  const hecho = u ? u.contadores : { escuchar: 0, hablar: 0, repasar: 0 };
  const objHoy = u ? u.objetivos : obj;
  const diag = voz.diagnostico();

  montar(`
    <h1>Hoy</h1>
    <p class="suave">${escapar(subtituloDeHoy(p))}</p>

    <div class="anillos">
      ${anillo(hecho.escuchar, objHoy.escuchar, "var(--azul)", "Escuchar")}
      ${anillo(hecho.hablar, objHoy.hablar, "var(--verde)", "Hablar")}
      ${anillo(hecho.repasar, objHoy.repasar, "var(--naranja)", "Repasar")}
    </div>

    <div class="tarjeta centro">
      <div style="font-size:21px;font-weight:600">${escapar(p.escena ? p.escena.title : "Repaso")}</div>
      <div class="mini" style="margin-top:4px">${p.modo === "normal" ? escapar(p.escena ? p.escena.lugar || "" : "") : "Una escena ya vista, al azar"}</div>
    </div>

    <div class="tarjeta">
      ${p.modo === "normal" ? `<div class="fila"><span>Palabras nuevas de hoy</span><b>${p.nuevas.length}</b></div>` : ""}
      ${p.modo === "prueba" ? `<div class="fila"><span>Preguntas de escucha</span><b>${p.escucha.length}</b></div>` : ""}
      <div class="fila"><span>Repasos que tocan</span><b>${p.repasos.length}${p.atrasados > p.repasos.length ? ` de ${p.atrasados}` : ""}</b></div>
      <div class="fila"><span>Duración</span><b>${Math.round(p.total / 60)} min</b></div>
      ${p.restantes.length ? `<div class="fila"><span class="mini">Hoy no caben todas: ${p.restantes.length} pasan a mañana</span></div>` : ""}
    </div>

    ${diag.nivel !== "bien" ? `<div class="tarjeta ${diag.nivel === "mal" ? "mal-aviso" : "aviso"}"><b>Voz</b><div class="mini">${escapar(diag.texto)}</div></div>` : ""}

    ${u ? `<p class="centro mini">Ya has hecho la sesión de hoy. Puedes repetirla.</p>` : ""}
    <button class="grande" id="empezar">${u ? "Repetir la sesión" : "Empezar"}</button>
  `);

  $("#empezar").onclick = () => empezarSesion();
};

// ------------------------------------------------------------------ Escenas
PANTALLAS.escenas = function () {
  montar(`<h1>Escenas</h1><p class="suave">Todas desbloqueadas, para volver a escucharlas.</p>
    <div class="tarjeta">${datos.escenas.scenes.map((s) => `
      <button class="fila" data-escena="${s.day}" style="width:100%;color:var(--texto);text-align:left">
        <span><b>Día ${s.day}</b> · ${escapar(s.title)}</span><span class="suave">›</span>
      </button>`).join("")}</div>`);
  $$("[data-escena]").forEach((b) => (b.onclick = () => verEscena(Number(b.dataset.escena))));
};

function verEscena(dia) {
  const s = datos.escenaPorDia.get(dia);
  montar(`
    <button id="volver">‹ Escenas</button>
    <h1>${escapar(s.title)}</h1>
    <p class="suave">${escapar(s.lugar || "")}</p>
    ${s.sceneWords.length ? `<div class="tarjeta"><div class="mini">Palabras de la escena</div>
      ${s.sceneWords.map((p) => `<div class="fila"><span>${escapar(p.hanzi)} · <b>${escapar(p.pinyin)}</b></span><span class="suave">${escapar(p.es)}</span></div>`).join("")}</div>` : ""}
    <button class="grande" id="todo">▶ Escuchar la escena</button>
    <div class="tarjeta" style="margin-top:14px">
      ${s.dialogue.map((l, i) => `
        <div class="fila" style="display:block">
          <div class="mini">${escapar(l.who)}</div>
          ${estado.ajustes.mostrarHanzi ? `<div class="han">${escapar(l.hanzi)}</div>` : ""}
          <div class="pin peq">${colorear(l.pinyin)}</div>
          <div class="es suave">${escapar(l.es)}</div>
          <button data-linea="${i}">▶</button><button data-linea="${i}" data-lenta="1">🐢</button>
        </div>`).join("")}
    </div>`);
  $("#volver").onclick = () => ir("escenas");
  $("#todo").onclick = () => voz.decirSeguido(s.dialogue.map((l) => l.hanzi), opcionesVoz());
  $$("[data-linea]").forEach((b) => (b.onclick = () =>
    voz.decir(s.dialogue[Number(b.dataset.linea)].hanzi, { lenta: b.dataset.lenta === "1", ...opcionesVoz() })));
}

// ------------------------------------------------------------------ Palabras
PANTALLAS.palabras = function (filtro = "") {
  const todas = [...datos.items.values()];
  const f = filtro.trim().toLowerCase();
  const lista = (f
    ? todas.filter((i) => i.es.toLowerCase().includes(f) || i.pinyin.toLowerCase().includes(f) || i.hanzi.includes(filtro))
    : todas
  ).slice(0, 80);

  montar(`
    <h1>Palabras</h1>
    <input type="search" id="buscar" placeholder="Buscar en español o pinyin" value="${escapar(filtro)}">
    <p class="mini" style="margin:10px 4px">${todas.length} palabras y moldes · ${repaso.dominadas(estado)} dominadas</p>
    <div class="tarjeta">
      ${lista.map((i) => {
        const e = repaso.estadoDe(estado, i.id);
        const punto = { nueva: "var(--linea)", aprendiendo: "var(--naranja)", dominada: "var(--verde)" }[e];
        return `<div class="fila">
          <span>
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${punto};margin-right:8px"></span>
            <b>${escapar(i.pinyin)}</b> <span class="suave">${escapar(i.es)}</span>
            ${estado.ajustes.mostrarHanzi ? `<div class="han" style="margin-left:16px">${escapar(i.hanzi)}</div>` : ""}
          </span>
          <button data-oir="${i.id}">▶</button>
        </div>`;
      }).join("")}
      ${lista.length === 0 ? '<p class="mini">No encuentro nada.</p>' : ""}
    </div>`);

  const caja = $("#buscar");
  caja.oninput = () => { const v = caja.value; PANTALLAS.palabras(v); const c = $("#buscar"); c.focus(); c.setSelectionRange(v.length, v.length); };
  $$("[data-oir]").forEach((b) => (b.onclick = () => voz.decir(datos.item(b.dataset.oir).tts, opcionesVoz())));
};

// ------------------------------------------------------------------ Progreso
PANTALLAS.progreso = function () {
  const dom = repaso.dominadas(estado);
  const apr = repaso.aprendiendo(estado);
  const horas = Math.floor(estado.totalSegundos / 3600);
  const mins = Math.round((estado.totalSegundos % 3600) / 60);
  montar(`
    <h1>Progreso</h1>
    <div class="tarjeta">
      <div class="fila"><span>Día del plan</span><b>${estado.diaPlan > 30 ? "mantenimiento" : `${estado.diaPlan} de 30`}</b></div>
      <div class="fila"><span>Días estudiados</span><b>${estado.diasHechos.length}</b></div>
      <div class="fila"><span>Dominadas</span><b>${dom} de ${datos.totalItems}</b></div>
      <div class="fila"><span>Aprendiendo</span><b>${apr}</b></div>
      <div class="fila"><span>Tiempo total</span><b>${horas ? horas + " h " : ""}${mins} min</b></div>
    </div>
    <h2>Últimos días</h2>
    <div class="tarjeta">
      ${estado.diasHechos.slice(-14).reverse().map((d) => `<div class="fila"><span>${d}</span><span class="suave">✓</span></div>`).join("") || '<p class="mini">Todavía no has hecho ninguna sesión.</p>'}
    </div>`);
};

// ------------------------------------------------------------------ Ajustes
PANTALLAS.ajustes = function () {
  const diag = voz.diagnostico();
  const voces = voz.listaVoces();
  montar(`
    <h1>Ajustes</h1>
    <div class="tarjeta ${diag.nivel === "bien" ? "bien-aviso" : diag.nivel === "mal" ? "mal-aviso" : "aviso"}">
      <b>Voz</b><div class="mini">${escapar(diag.texto)}</div>
      ${voces.length > 1 ? `<select id="voz" style="margin-top:10px">${voces.map((v) => `<option value="${escapar(v.name)}" ${voz.vozActual() && v.name === voz.vozActual().name ? "selected" : ""}>${escapar(v.name)} (${escapar(v.lang)})</option>`).join("")}</select>` : ""}
      <button id="probar" style="margin-top:6px">▶ Probar la voz</button>
    </div>

    <div class="tarjeta">
      <div class="fila"><span>Velocidad lenta</span><span><input type="range" id="lenta" min="30" max="90" value="${Math.round(estado.ajustes.lenta * 100)}"> <b id="lentaTxt">${estado.ajustes.lenta.toFixed(2)}</b></span></div>
      <div class="fila"><span>Mostrar caracteres</span><button id="hanzi">${estado.ajustes.mostrarHanzi ? "Sí" : "No"}</button></div>
      <div class="fila"><span>Micrófono</span><span class="suave">${grabadora.soportado() ? (micro.pedido ? "activado" : "se pide al usarlo") : "no disponible aquí"}</span></div>
      <div class="fila"><span>Decirme qué ha entendido</span>${reconocer.soportado()
        ? `<button id="reco">${estado.ajustes.reconocer ? "Sí" : "No"}</button>`
        : '<span class="suave">no disponible aquí</span>'}</div>
      <div class="fila"><span>Hora del recordatorio</span><input type="time" id="hora" value="${estado.ajustes.hora}" style="width:auto"></div>
      <div class="fila"><span>Avisarme todos los días</span><button id="recordatorio">Añadir al Calendario</button></div>
      <div class="mini" style="padding-bottom:8px">Se descarga un archivo del calendario. En el iPhone, tócalo y dale a "Añadir". Si no se abre, abre la app en Safari y vuelve a tocar el botón.</div>
    </div>

    <h2>Copia de seguridad</h2>
    <div class="tarjeta">
      <div class="fila"><span>Exportar mi progreso</span><button id="exportar">Exportar</button></div>
      <div class="fila"><span>Importar una copia</span><button id="importar">Importar</button></div>
      <input type="file" id="archivo" accept="application/json,.json" hidden>
    </div>

    <div class="tarjeta">
      <div class="fila"><span>Empezar de cero</span><button id="reiniciar" style="color:var(--rojo)">Reiniciar</button></div>
    </div>
    <p class="mini centro">Tu progreso solo vive en este aparato. Exporta de vez en cuando.</p>
  `);

  $("#probar").onclick = () => voz.decir("你好，我們開始吧。", opcionesVoz());
  const sel = $("#voz");
  if (sel) sel.onchange = () => { estado.ajustes.voz = sel.value; voz.elegirVoz(sel.value); almacen.guardar(estado); };
  const r = $("#lenta");
  r.oninput = () => { estado.ajustes.lenta = Number(r.value) / 100; $("#lentaTxt").textContent = estado.ajustes.lenta.toFixed(2); };
  r.onchange = () => { almacen.guardar(estado); voz.decir("慢一點", { lenta: true, ...opcionesVoz() }); };
  $("#hanzi").onclick = () => { estado.ajustes.mostrarHanzi = !estado.ajustes.mostrarHanzi; almacen.guardar(estado); PANTALLAS.ajustes(); };
  const reco = $("#reco");
  if (reco) reco.onclick = () => { estado.ajustes.reconocer = !estado.ajustes.reconocer; almacen.guardar(estado); PANTALLAS.ajustes(); };
  $("#hora").onchange = (e) => { estado.ajustes.hora = e.target.value; almacen.guardar(estado); };
  $("#recordatorio").onclick = () => descargarRecordatorio(estado.ajustes.hora);
  $("#exportar").onclick = () => almacen.exportar(estado);
  $("#importar").onclick = () => $("#archivo").click();
  $("#archivo").onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try { estado = await almacen.importar(f); alert("Copia importada."); ir("hoy"); }
    catch (err) { alert("No he podido leer esa copia: " + err.message); }
  };
  $("#reiniciar").onclick = () => {
    if (!confirm("¿Seguro? Se borra todo el progreso de este aparato.")) return;
    almacen.reiniciar();
    estado = almacen.cargar();
    ir("hoy");
  };
};

// ------------------------------------------------- grábate y compárate
let micro = { pedido: false, grabando: false, url: null, oido: null };

function limpiarMicro() { micro.url = null; micro.oido = null; micro.grabando = false; }

function htmlMicro() {
  if (!grabadora.soportado()) {
    return `<p class="mini centro" style="margin-top:12px">Este navegador no deja grabar. Dilo en voz alta de todos modos.</p>`;
  }
  if (!micro.pedido) {
    return `<div class="tarjeta" style="margin-top:12px">
      <div class="mini">Para grabarte y compararte hace falta el micrófono. La grabación no se guarda ni sale de este aparato.</div>
      <button id="pedirMic">Activar el micrófono</button>
    </div>`;
  }
  const oido = micro.oido;
  return `
    <div class="doble" style="margin-top:12px">
      <button class="grande gris" id="grabar">${micro.grabando ? "⏹ Parar" : "🎤 Grabarme"}</button>
      <button class="grande gris" id="comparar"${micro.url ? "" : " disabled"}>▶ Modelo y yo</button>
    </div>
    ${reconocer.soportado() && estado.ajustes.reconocer && !micro.grabando
      ? '<button id="entendido" style="margin-top:4px">¿Me has entendido?</button>' : ""}
    ${oido ? `<div class="tarjeta ${oido.nivel === "bien" ? "bien-aviso" : oido.nivel === "mal" || oido.nivel === "nada" ? "mal-aviso" : "aviso"}" style="margin-top:8px">
        <div class="mini">He oído</div>
        ${oido.pinyin ? `<div class="pin peq">${colorear(oido.pinyin)}</div>` : ""}
        ${oido.texto && estado.ajustes.mostrarHanzi ? `<div class="han">${escapar(oido.texto)}</div>` : ""}
        <div class="mini">${escapar(oido.juicio)}</div>
      </div>` : ""}`;
}

async function modeloYYo(textoModelo) {
  await voz.decir(textoModelo, opcionesVoz());
  await new Promise((r) => setTimeout(r, 250));
  await grabadora.reproducir(micro.url);
}

function wirearMicro(textoModelo, repintar) {
  const pedir = $("#pedirMic");
  if (pedir) pedir.onclick = async () => {
    micro.pedido = await grabadora.pedirPermiso();
    if (!micro.pedido) alert("Sin permiso del micrófono no puedo grabarte. Puedes dárselo en los ajustes del navegador; el resto de la app funciona igual.");
    repintar();
  };

  const bg = $("#grabar");
  if (bg) bg.onclick = async () => {
    if (micro.grabando) {
      micro.url = await grabadora.parar();
      micro.grabando = false;
      repintar();
      await modeloYYo(textoModelo);
    } else {
      micro.oido = null;
      voz.callar();
      micro.grabando = await grabadora.empezar();
      repintar();
    }
  };

  const bc = $("#comparar");
  if (bc) bc.onclick = () => modeloYYo(textoModelo);

  const be = $("#entendido");
  if (be) be.onclick = async () => {
    be.textContent = "Escuchando… di la frase";
    voz.callar();
    const r = await reconocer.escuchar();
    if (r.error === "not-allowed" || r.error === "service-not-allowed") {
      micro.oido = { texto: "", pinyin: "", juicio: "El navegador no me deja reconocer la voz aquí.", nivel: "mal" };
    } else if (r.error || !r.texto) {
      micro.oido = { texto: "", pinyin: "", juicio: "No he entendido nada. Prueba otra vez, más cerca.", nivel: "nada" };
    } else {
      const juicio = reconocer.compara(r.texto, textoModelo);
      micro.oido = { texto: r.texto, pinyin: reconocer.aPinyin(r.texto), juicio: juicio.texto, nivel: juicio.nivel };
    }
    repintar();
  };
}

// ================================================================== SESIÓN
function empezarSesion() {
  const plan = planificar(estado, datos, fechaHoy());
  ses = {
    plan,
    paso: 0,
    inicio: Date.now(),
    inicioPaso: Date.now(),
    contadores: { escuchar: 0, hablar: 0, repasar: 0 },
    objetivos: objetivosDe(plan),
    oido: { items: silabasParaTonos(estado, datos, tonoDe, esUnaSilaba), i: 0, bien: 0 },
    escena: { fase: "audio", i: 0, aciertos: 0 },
    nuevas: { i: 0 },
    escucha: { i: 0, bien: 0 },
    rep: { cola: plan.repasos.slice(), i: 0, revelado: false, hechos: 0 },
    dilo: { i: 0, visto: false },
    real: { i: 0, esperando: false },
  };
  document.body.classList.add("sesion");
  pestanas().hidden = true;
  voz.decir("", opcionesVoz()); // desbloquea la voz con el toque del usuario
  arrancarReloj();
  pintarPaso();
}

function arrancarReloj() {
  terminarReloj();
  reloj = setInterval(() => {
    const barra = document.getElementById("barraTiempo");
    if (!barra || !ses) return;
    const pasado = (Date.now() - ses.inicio) / 1000;
    barra.style.width = Math.min(100, (pasado / ses.plan.total) * 100) + "%";
    const quedan = document.getElementById("quedan");
    if (quedan) {
      const m = Math.max(0, Math.ceil((ses.plan.total - pasado) / 60));
      quedan.textContent = m > 0 ? `quedan ${m} min` : "se acabó el tiempo";
    }
  }, 1000);
}
function terminarReloj() { if (reloj) clearInterval(reloj); reloj = null; voz.callar(); }

function cabecera() {
  const lista = pasos();
  const p = lista[ses.paso];
  return `<div class="cabecera">
      <div class="barra"><i id="barraTiempo" style="width:0%"></i></div>
      <div class="datos">
        <span><b>${ses.paso + 1}/${lista.length} · ${p.titulo}</b> · ${p.nota}</span>
        <span id="quedan"></span>
      </div>
    </div>`;
}

function pie(html) {
  return `<div class="pie"><div>${html}</div></div>`;
}

function siguientePaso() {
  voz.callar();
  ses.paso += 1;
  ses.inicioPaso = Date.now();
  if (ses.paso >= pasos().length) return acabarSesion();
  pintarPaso();
}

const PINTORES = {
  oido: () => pasoOido(),
  escena: () => pasoEscena(),
  nuevas: () => pasoNuevas(),
  escucha: () => pasoEscucha(),
  repaso: () => pasoRepaso(),
  dilo: () => pasoDilo(),
  real: () => pasoReal(),
};

function pintarPaso() {
  PINTORES[pasos()[ses.paso].clave]();
  window.scrollTo(0, 0);
}

// ---------------------------------------------------------- 1. Oído
function pasoOido() {
  const o = ses.oido;
  if (!o.items.length || o.i >= o.items.length) {
    montar(`${cabecera()}
      <div class="tarjeta centro"><p>${o.items.length ? `Tonos: ${o.bien} de ${o.i} bien.` : "Hoy todavía no hay sílabas que repasar: empezamos por la escena."}</p></div>
      ${pie('<button class="grande" id="seguir">Siguiente paso</button>')}`);
    $("#seguir").onclick = siguientePaso;
    return;
  }
  const actual = o.items[o.i];
  const it = datos.item(actual.id);
  montar(`${cabecera()}
    <div class="tarjeta centro">
      <p class="suave">Escucha y elige el tono</p>
      <button class="grande gris" id="oir" style="margin:10px 0">▶ Oír otra vez</button>
      <div class="tonos">
        ${[1, 2, 3, 4].map((t) => `<button data-tono="${t}">${["ˉ", "ˊ", "ˇ", "ˋ"][t - 1]}</button>`).join("")}
      </div>
      <p class="mini" style="margin-top:12px">${o.i + 1} de ${o.items.length}</p>
    </div>
    ${pie('<button class="grande gris" id="saltar">Pasar de los tonos</button>')}`);

  voz.decir(it.tts, opcionesVoz());
  $("#oir").onclick = () => voz.decir(it.tts, opcionesVoz());
  $("#saltar").onclick = siguientePaso;
  $$("[data-tono]").forEach((b) => (b.onclick = () => {
    const elegido = Number(b.dataset.tono);
    const bien = elegido === actual.tono;
    b.classList.add(bien ? "bien" : "mal");
    if (!bien) $$(`[data-tono="${actual.tono}"]`)[0].classList.add("bien");
    if (bien) o.bien += 1;
    const t = (estado.tonos[actual.id] = estado.tonos[actual.id] || { aciertos: 0, fallos: 0 });
    bien ? (t.aciertos += 1) : (t.fallos += 1);
    ses.contadores.escuchar += 1;
    setTimeout(() => { o.i += 1; pasoOido(); }, bien ? 500 : 1400);
  }));
}

// ---------------------------------------------------------- 2. La escena
function pasoEscena() {
  const e = ses.escena;
  const s = ses.plan.escena;
  if (!s) return siguientePaso();

  if (e.fase === "audio") {
    montar(`${cabecera()}
      <div class="tarjeta centro">
        <p class="suave">Escucha sin texto. Luego te pregunto.</p>
        <div style="font-size:21px;font-weight:600;margin:10px 0">${escapar(s.title)}</div>
        <button class="grande gris" id="otra">▶ Escuchar otra vez</button>
      </div>
      ${pie('<button class="grande" id="seguir">Ya la he oído</button>')}`);
    const sonar = () => { ses.contadores.escuchar += s.dialogue.length; voz.decirSeguido(s.dialogue.map((l) => l.hanzi), opcionesVoz()); };
    sonar();
    $("#otra").onclick = sonar;
    $("#seguir").onclick = () => { voz.callar(); e.fase = "preguntas"; pasoEscena(); };
    return;
  }

  if (e.fase === "preguntas") {
    const q = s.questions[e.i];
    montar(`${cabecera()}
      <div class="tarjeta">
        <p class="mini">Pregunta ${e.i + 1} de ${s.questions.length}</p>
        <p style="font-size:19px;font-weight:600">${escapar(q.q)}</p>
        ${q.options.map((o, j) => `<button class="opcion" data-op="${j}">${escapar(o)}</button>`).join("")}
      </div>
      ${pie('<button class="grande gris" id="oir">▶ Oír la escena otra vez</button>')}`);
    $("#oir").onclick = () => voz.decirSeguido(s.dialogue.map((l) => l.hanzi), opcionesVoz());
    $$("[data-op]").forEach((b) => (b.onclick = () => {
      const j = Number(b.dataset.op);
      const bien = j === q.answer;
      b.classList.add(bien ? "bien" : "mal");
      if (!bien) $$(`[data-op="${q.answer}"]`)[0].classList.add("bien");
      if (bien) e.aciertos += 1;
      $$("[data-op]").forEach((x) => (x.onclick = null));
      setTimeout(() => {
        e.i += 1;
        if (e.i >= s.questions.length) e.fase = "texto";
        pasoEscena();
      }, bien ? 600 : 1500);
    }));
    return;
  }

  // fase texto
  montar(`${cabecera()}
    <div class="tarjeta centro"><p>Has acertado <b>${e.aciertos} de ${s.questions.length}</b>.</p></div>
    <div class="tarjeta">
      ${s.dialogue.map((l, i) => `
        <div class="fila" style="display:block">
          <div class="mini">${escapar(l.who)}</div>
          ${estado.ajustes.mostrarHanzi ? `<div class="han">${escapar(l.hanzi)}</div>` : ""}
          <div class="pin peq">${colorear(l.pinyin)}</div>
          <div class="es suave">${escapar(l.es)}</div>
          <button data-linea="${i}">▶</button><button data-linea="${i}" data-lenta="1">🐢</button>
        </div>`).join("")}
    </div>
    ${pie('<button class="grande" id="seguir">Siguiente paso</button>')}`);
  $$("[data-linea]").forEach((b) => (b.onclick = () => {
    ses.contadores.escuchar += 1;
    voz.decir(s.dialogue[Number(b.dataset.linea)].hanzi, { lenta: b.dataset.lenta === "1", ...opcionesVoz() });
  }));
  $("#seguir").onclick = siguientePaso;
}

// ---------------------------------------------------------- 3. Nuevas
function pasoNuevas() {
  const n = ses.nuevas;
  const lista = ses.plan.nuevas;
  if (!lista.length || n.i >= lista.length) {
    montar(`${cabecera()}
      <div class="tarjeta centro"><p>${lista.length ? `${lista.length} palabras nuevas vistas.` : "Hoy no entran palabras nuevas: toca repasar."}</p></div>
      ${pie('<button class="grande" id="seguir">Siguiente paso</button>')}`);
    $("#seguir").onclick = siguientePaso;
    return;
  }

  const it = datos.item(lista[n.i]);
  const ej = datos.ejemplo(it.id);
  montar(`${cabecera()}
    <div class="tarjeta centro">
      <p class="mini">${n.i + 1} de ${lista.length}${it.tipo === "molde" ? " · molde" : ""}</p>
      <div class="pin">${colorear(it.pinyin)}</div>
      ${estado.ajustes.mostrarHanzi ? `<div class="han" style="margin-top:4px">${escapar(it.hanzi)}</div>` : ""}
      <p class="es" style="margin-top:10px">${escapar(it.es)}</p>
      <div class="doble" style="margin-top:12px">
        <button class="grande gris" id="normal">▶ Normal</button>
        <button class="grande gris" id="lento">🐢 Lenta</button>
      </div>
      <p class="mini" style="margin-top:14px">Escúchalo, dilo tú y compárate.</p>
      ${htmlMicro()}
    </div>
    ${ej ? `<div class="tarjeta">
      <div class="mini">En la escena de hoy</div>
      ${estado.ajustes.mostrarHanzi ? `<div class="han">${escapar(ej.hanzi)}</div>` : ""}
      <div class="pin peq">${colorear(ej.pinyin)}</div>
      <div class="es suave">${escapar(ej.es)}</div>
      <button id="frase">▶ Oír la frase</button>
    </div>` : ""}
    ${pie('<button class="grande" id="seguir">Siguiente</button>')}`);

  wirearMicro(it.tts, pasoNuevas);

  const sonar = async () => {
    ses.contadores.escuchar += 1;
    await voz.decir(it.tts, opcionesVoz());
    await new Promise((r) => setTimeout(r, 300));
    await voz.decir(it.tts, { lenta: true, ...opcionesVoz() });
  };
  sonar();
  $("#normal").onclick = () => voz.decir(it.tts, opcionesVoz());
  $("#lento").onclick = () => voz.decir(it.tts, { lenta: true, ...opcionesVoz() });
  if (ej) $("#frase").onclick = () => voz.decir(ej.hanzi, opcionesVoz());
  $("#seguir").onclick = () => {
    repaso.estrenar(estado, it.id, fechaHoy());
    almacen.guardar(estado); // por si cierras la app a mitad
    ses.contadores.hablar += 1;
    n.i += 1;
    limpiarMicro();
    pasoNuevas();
  };
}

// ------------------------------- 3 bis. Prueba de escucha (días 29 y 30)
function pasoEscucha() {
  const p = ses.escucha;
  const preguntas = ses.plan.escucha;

  if (!preguntas.length || p.i >= preguntas.length) {
    montar(`${cabecera()}
      <div class="tarjeta centro"><p>${preguntas.length
        ? `Prueba de escucha: <b>${p.bien} de ${p.i}</b> bien.`
        : "Todavía no hay bastante aprendido para la prueba de escucha."}</p></div>
      ${pie('<button class="grande" id="seguir">Siguiente paso</button>')}`);
    $("#seguir").onclick = siguientePaso;
    return;
  }

  const q = preguntas[p.i];
  montar(`${cabecera()}
    <div class="tarjeta">
      <p class="mini">Pregunta ${p.i + 1} de ${preguntas.length} · ${q.tipo === "frase" ? "una frase" : "una palabra"}</p>
      <p class="suave centro">Suena y eliges qué significa.</p>
      <button class="grande gris" id="oir" style="margin:10px 0">▶ Oír otra vez</button>
      ${q.opciones.map((o, j) => `<button class="opcion" data-op="${j}">${escapar(o)}</button>`).join("")}
      <p class="mini">Aciertos: ${p.bien} de ${p.i}</p>
    </div>
    ${pie('<button class="grande gris" id="saltar">Dejar la prueba</button>')}`);

  const sonar = () => voz.decir(q.tts, opcionesVoz());
  sonar();
  $("#oir").onclick = sonar;
  $("#saltar").onclick = siguientePaso;
  $$("[data-op]").forEach((b) => (b.onclick = () => {
    const bien = Number(b.dataset.op) === q.correcta;
    b.classList.add(bien ? "bien" : "mal");
    if (!bien) $$(`[data-op="${q.correcta}"]`)[0].classList.add("bien");
    if (bien) p.bien += 1;
    ses.contadores.escuchar += 1;
    $$("[data-op]").forEach((x) => (x.onclick = null));
    setTimeout(() => { p.i += 1; pasoEscucha(); }, bien ? 700 : 1600);
  }));
}

// ---------------------------------------------------------- 4. Repaso
function pasoRepaso() {
  const r = ses.rep;
  if (!r.cola.length || r.i >= r.cola.length) {
    montar(`${cabecera()}
      <div class="tarjeta centro"><p>${r.hechos ? `${r.hechos} repasos hechos.` : "Hoy no hay nada que repasar todavía: mañana empiezan."}</p></div>
      ${pie('<button class="grande" id="seguir">Siguiente paso</button>')}`);
    $("#seguir").onclick = siguientePaso;
    return;
  }

  const id = r.cola[r.i];
  const it = datos.item(id);
  if (!it) { r.i += 1; return pasoRepaso(); }
  const alReves = r.i > 0 && (r.i + 1) % 3 === 0; // una de cada tres, al revés

  if (!r.revelado) {
    montar(`${cabecera()}
      <div class="tarjeta centro" style="padding:28px 16px">
        ${alReves
          ? `<p class="suave">Dilo tú en chino</p><p class="es" style="font-size:22px;font-weight:600">${escapar(it.es)}</p>`
          : `<p class="suave">¿Qué significa?</p><button class="grande gris" id="oir" style="margin-top:10px">▶ Oír otra vez</button>`}
      </div>
      ${pie(`<button class="grande" id="ver">${alReves ? "Ver y oír" : "Ver la respuesta"}</button>`)}`);
    if (!alReves) {
      voz.decir(it.tts, opcionesVoz());
      $("#oir").onclick = () => voz.decir(it.tts, opcionesVoz());
    }
    $("#ver").onclick = () => { r.revelado = true; if (alReves) voz.decir(it.tts, opcionesVoz()); pasoRepaso(); };
    return;
  }

  montar(`${cabecera()}
    <div class="tarjeta centro" style="padding:24px 16px">
      <div class="pin">${colorear(it.pinyin)}</div>
      ${estado.ajustes.mostrarHanzi ? `<div class="han" style="margin-top:4px">${escapar(it.hanzi)}</div>` : ""}
      <p class="es" style="margin-top:10px">${escapar(it.es)}</p>
      <button id="oir" style="margin-top:8px">▶ Oírlo</button>
    </div>
    ${pie(`<div class="doble">
      <button class="grande gris" id="otra">Otra vez</button>
      <button class="grande" id="lose">Lo sé</button>
    </div>`)}`);
  $("#oir").onclick = () => voz.decir(it.tts, opcionesVoz());
  const responder = (loSe) => {
    repaso.responder(estado, id, loSe, fechaHoy());
    almacen.guardar(estado);
    ses.contadores.repasar += 1;
    if (alReves) ses.contadores.hablar += 1;
    r.hechos += 1;
    r.revelado = false;
    if (!loSe) r.cola.push(id); // vuelve al final de la sesión de hoy
    r.i += 1;
    pasoRepaso();
  };
  $("#otra").onclick = () => responder(false);
  $("#lose").onclick = () => responder(true);
}

// ---------------------------------------------------------- 5. Dilo tú
function pasoDilo() {
  const d = ses.dilo;
  const retos = ses.plan.retos;
  if (!retos.length || d.i >= retos.length) {
    montar(`${cabecera()}
      <div class="tarjeta centro"><p>${retos.length ? "Retos terminados." : "Hoy no hay retos."}</p></div>
      ${pie('<button class="grande" id="seguir">Siguiente paso</button>')}`);
    $("#seguir").onclick = siguientePaso;
    return;
  }
  const c = retos[d.i];
  montar(`${cabecera()}
    <div class="tarjeta centro" style="padding:26px 16px">
      <p class="mini">Reto ${d.i + 1} de ${retos.length}</p>
      <p class="es" style="font-size:22px;font-weight:600;margin:10px 0">${escapar(c.es)}</p>
      <p class="suave">Dilo en voz alta en chino.</p>
      ${htmlMicro()}
      <div id="modelo" class="${d.visto ? "" : "oculto"}" style="margin-top:16px">
        ${estado.ajustes.mostrarHanzi ? `<div class="han">${escapar(c.hanzi)}</div>` : ""}
        <div class="pin peq">${colorear(c.pinyin)}</div>
        <button id="oir">▶ Oír el modelo</button>
      </div>
    </div>
    ${pie(d.visto
      ? '<button class="grande" id="seguir">Siguiente reto</button>'
      : '<button class="grande" id="ver">Ya lo he dicho · ver el modelo</button>')}`);

  wirearMicro(c.hanzi, pasoDilo);
  if (d.visto) {
    $("#oir").onclick = () => voz.decir(c.hanzi, opcionesVoz());
    $("#seguir").onclick = () => { d.i += 1; d.visto = false; ses.contadores.hablar += 1; limpiarMicro(); pasoDilo(); };
  } else {
    $("#ver").onclick = () => { d.visto = true; pasoDilo(); voz.decir(c.hanzi, opcionesVoz()); };
  }
}

// ---------------------------------------------------------- 6. Hazlo de verdad
function pasoReal() {
  const s = ses.plan.escena;
  const r = ses.real;
  if (!s || r.i >= s.dialogue.length) {
    return acabarSesion();
  }
  const l = s.dialogue[r.i];
  const miTurno = l.speaker === "B";

  montar(`${cabecera()}
    <div class="tarjeta centro" style="padding:26px 16px">
      <p class="mini">${escapar(s.title)} · línea ${r.i + 1} de ${s.dialogue.length}</p>
      ${miTurno
        ? `<p class="suave" style="margin-top:10px">Te toca a ti (${escapar(l.who)})</p>
           <p class="es" style="font-size:20px;font-weight:600">${escapar(l.es)}</p>
           ${htmlMicro()}
           <div id="modelo" class="${r.esperando ? "" : "oculto"}" style="margin-top:14px">
             ${estado.ajustes.mostrarHanzi ? `<div class="han">${escapar(l.hanzi)}</div>` : ""}
             <div class="pin peq">${colorear(l.pinyin)}</div>
           </div>`
        : `<p class="suave" style="margin-top:10px">${escapar(l.who)} dice:</p>
           <button class="grande gris" id="oir" style="margin-top:10px">▶ Oír otra vez</button>`}
    </div>
    ${pie(miTurno
      ? (r.esperando
          ? '<button class="grande" id="seguir">Siguiente línea</button>'
          : '<button class="grande" id="ver">Ya lo he dicho · ver cómo era</button>')
      : '<button class="grande" id="seguir">Siguiente línea</button>')}`);

  if (!miTurno) {
    ses.contadores.escuchar += 1;
    voz.decir(l.hanzi, opcionesVoz());
    $("#oir").onclick = () => voz.decir(l.hanzi, opcionesVoz());
    $("#seguir").onclick = () => { r.i += 1; pasoReal(); };
  } else if (r.esperando) {
    wirearMicro(l.hanzi, pasoReal);
    $("#seguir").onclick = () => { r.i += 1; r.esperando = false; ses.contadores.hablar += 1; limpiarMicro(); pasoReal(); };
  } else {
    wirearMicro(l.hanzi, pasoReal);
    $("#ver").onclick = () => { r.esperando = true; pasoReal(); voz.decir(l.hanzi, opcionesVoz()); };
  }
}

// ---------------------------------------------------------- fin
function acabarSesion() {
  terminarReloj();
  limpiarMicro();
  grabadora.soltar(); // suelta el micrófono al acabar
  const segundos = Math.round((Date.now() - ses.inicio) / 1000);
  const hechas = ses.plan.nuevas.slice(0, ses.nuevas.i);
  const noHechas = ses.plan.nuevas.slice(ses.nuevas.i);

  // Lo que no ha entrado hoy entra mañana; el día avanza solo si se acabó la lista.
  // Los días 29 y 30 avanzan siempre; desde el 31 el contador se queda quieto.
  estado.pendientesNuevas = [...noHechas, ...ses.plan.restantes];
  if (ses.plan.modo === "prueba") estado.diaPlan = Math.min(estado.diaPlan + 1, 31);
  else if (ses.plan.modo === "normal" && !estado.pendientesNuevas.length) estado.diaPlan = Math.min(estado.diaPlan + 1, 31);

  if (!estado.diasHechos.includes(fechaHoy())) estado.diasHechos.push(fechaHoy());
  estado.totalSegundos += segundos;
  estado.ultimaSesion = {
    fecha: fechaHoy(),
    contadores: ses.contadores,
    objetivos: ses.objetivos,
    nuevas: hechas.length,
    repasos: ses.rep.hechos,
    escucha: { bien: ses.escucha.bien, de: ses.escucha.i },
    segundos,
  };
  const guardado = almacen.guardar(estado);

  const min = Math.max(1, Math.round(segundos / 60));
  montar(`
    <h1>¡Hecho!</h1>
    <div class="anillos">
      ${anillo(ses.contadores.escuchar, ses.objetivos.escuchar, "var(--azul)", "Escuchar")}
      ${anillo(ses.contadores.hablar, ses.objetivos.hablar, "var(--verde)", "Hablar")}
      ${anillo(ses.contadores.repasar, ses.objetivos.repasar, "var(--naranja)", "Repasar")}
    </div>
    <div class="tarjeta">
      ${ses.plan.modo === "normal" ? `<div class="fila"><span>Palabras nuevas</span><b>${hechas.length}</b></div>` : ""}
      ${ses.plan.modo === "prueba" ? `<div class="fila"><span>Prueba de escucha</span><b>${ses.escucha.bien} de ${ses.escucha.i}</b></div>` : ""}
      <div class="fila"><span>Repasos</span><b>${ses.rep.hechos}</b></div>
      ${ses.plan.modo === "mantenimiento" ? "" : `<div class="fila"><span>Tonos acertados</span><b>${ses.oido.bien} de ${ses.oido.i}</b></div>`}
      <div class="fila"><span>Tiempo</span><b>${min} min</b></div>
      ${estado.pendientesNuevas.length ? `<div class="fila"><span class="mini">${estado.pendientesNuevas.length} palabras pasan a mañana</span></div>` : ""}
    </div>
    ${!guardado ? '<div class="tarjeta mal-aviso mini">No he podido guardar el progreso en este navegador (¿navegación privada?).</div>' : ""}
    <button class="grande fin" id="volver">Volver a Hoy</button>
  `);
  ses = null;
  document.body.classList.remove("sesion");
  $("#volver").onclick = () => ir("hoy");
}
