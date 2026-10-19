// Recordatorio diario: crea un archivo de calendario (.ics) con un evento
// que se repite todos los días a la hora elegida, con su aviso.
// En el iPhone se abre con el Calendario y se añade de un toque.

function dosCifras(n) { return String(n).padStart(2, "0"); }

function marcaUTC(d = new Date()) {
  return (
    d.getUTCFullYear() + dosCifras(d.getUTCMonth() + 1) + dosCifras(d.getUTCDate()) +
    "T" + dosCifras(d.getUTCHours()) + dosCifras(d.getUTCMinutes()) + dosCifras(d.getUTCSeconds()) + "Z"
  );
}

// La hora va "flotante" (sin zona): si viajas, suena a esa hora local.
export function textoIcs(hora = "08:00", minutos = 25) {
  const [h, m] = hora.split(":").map(Number);
  const manana = new Date();
  manana.setDate(manana.getDate() + (new Date().getHours() >= h ? 1 : 0));
  const dia = manana.getFullYear() + dosCifras(manana.getMonth() + 1) + dosCifras(manana.getDate());
  const inicio = `${dia}T${dosCifras(h)}${dosCifras(m)}00`;
  const fin = new Date(2000, 0, 1, h, m + minutos);
  const finTexto = `${dia}T${dosCifras(fin.getHours())}${dosCifras(fin.getMinutes())}00`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Chino//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:chino-${Date.now()}@local`,
    `DTSTAMP:${marcaUTC()}`,
    `DTSTART:${inicio}`,
    `DTEND:${finTexto}`,
    "RRULE:FREQ=DAILY",
    "SUMMARY:Chino, 25 minutos",
    "DESCRIPTION:La sesión de hoy: oído, la escena, palabras nuevas, repaso, dilo tú y hazlo de verdad.",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Chino, 25 minutos",
    "TRIGGER:-PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function descargarRecordatorio(hora) {
  const url = URL.createObjectURL(new Blob([textoIcs(hora)], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "chino-todos-los-dias.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
