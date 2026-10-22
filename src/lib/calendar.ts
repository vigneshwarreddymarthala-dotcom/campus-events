// "Add to calendar" helpers: a Google Calendar link and a downloadable .ics file
// (works with Apple Calendar, Outlook and others). Times are written as local
// "floating" times so the event lands at the right hour in the student's calendar.

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  venue?: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  time?: string; // "07:30" or "09:00 AM"
};

function parseTime(t?: string): [number, number] {
  const m = (t ?? "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return [9, 0];
  let h = parseInt(m[1], 10);
  const ap = m[3]?.toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return [Math.min(h, 23), Math.min(parseInt(m[2], 10), 59)];
}

export function eventTimes(e: CalendarEvent): { start: Date; end: Date } {
  const [y, mo, d] = e.date.split("-").map(Number);
  const [h, mi] = parseTime(e.time);
  const start = new Date(y, mo - 1, d, h, mi, 0);
  let end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // default length: 2 hours
  if (e.endDate && e.endDate !== e.date) {
    const [ey, emo, ed] = e.endDate.split("-").map(Number);
    end = new Date(ey, emo - 1, ed, 18, 0, 0);
  }
  return { start, end };
}

const pad = (n: number) => String(n).padStart(2, "0");
const fmtLocal = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const fmtUtc = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

const plain = (html?: string) =>
  (html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export function googleCalendarUrl(e: CalendarEvent, pageUrl?: string): string {
  const { start, end } = eventTimes(e);
  const details = [plain(e.description), pageUrl].filter(Boolean).join("\n\n");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${fmtLocal(start)}/${fmtLocal(end)}`,
    details,
    location: e.venue ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcs(e: CalendarEvent, pageUrl?: string): string {
  const { start, end } = eventTimes(e);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Spirits//Campus Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@spirits`,
    `DTSTAMP:${fmtUtc(new Date())}`,
    `DTSTART:${fmtLocal(start)}`,
    `DTEND:${fmtLocal(end)}`,
    `SUMMARY:${esc(e.title)}`,
    `DESCRIPTION:${esc([plain(e.description), pageUrl].filter(Boolean).join("\n\n"))}`,
    `LOCATION:${esc(e.venue ?? "")}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(e.title)} starts in 1 hour`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export function downloadIcs(e: CalendarEvent, pageUrl?: string) {
  const blob = new Blob([buildIcs(e, pageUrl)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${e.title.replace(/[^\w]+/g, "-").slice(0, 40) || "event"}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
