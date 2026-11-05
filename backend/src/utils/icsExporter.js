/**
 * Generador de archivos de calendario estándar iCalendar (.ics) RFC 5545
 */

function formatICSDate(dateStr) {
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeICSText(text) {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export const generateICS = (schedules = []) => {
  const items = Array.isArray(schedules) ? schedules : [schedules];
  const now = formatICSDate(new Date().toISOString());

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NexoEventos//Plataforma de Eventos y Calendario//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-TIMEZONE:America/Costa_Rica'
  ];

  for (const item of items) {
    ics.push('BEGIN:VEVENT');
    ics.push(`UID:agenda-${item.id_agenda || Date.now()}@nexoeventos.com`);
    ics.push(`DTSTAMP:${now}`);
    ics.push(`DTSTART:${formatICSDate(item.fecha_inicio)}`);
    ics.push(`DTEND:${formatICSDate(item.fecha_fin)}`);
    ics.push(`SUMMARY:${escapeICSText(item.titulo)}`);
    if (item.descripcion) {
      ics.push(`DESCRIPTION:${escapeICSText(item.descripcion)}`);
    }
    if (item.ubicacion) {
      ics.push(`LOCATION:${escapeICSText(item.ubicacion)}`);
    }
    if (item.nombre_categoria) {
      ics.push(`CATEGORIES:${escapeICSText(item.nombre_categoria)}`);
    }
    ics.push('STATUS:CONFIRMED');
    ics.push('END:VEVENT');
  }

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
};

