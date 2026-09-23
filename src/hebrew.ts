import { HebrewCalendar, HDate, flags } from "@hebcal/core";

const DAY = 86400000;

const KEEP =
  flags.CHAG | flags.MINOR_HOLIDAY | flags.ROSH_CHODESH | flags.MODERN_HOLIDAY | flags.EREV;
// strip nikud/cantillation — hebcal renders vocalized text, too busy for small cells
const NIKUD = /[֑-ׇ]/g;
const monthFmt = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", { month: "long" });

export function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function holidaysForRange(start: Date, end: Date): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const events = HebrewCalendar.calendar({ start, end, il: true, sedrot: false, omer: false });
  for (const ev of events) {
    if (!(ev.getFlags() & KEEP)) continue;
    const key = dayKey(ev.getDate().greg().getTime());
    const name = ev.render("he").replace(NIKUD, "");
    const arr = map.get(key) ?? [];
    if (!arr.includes(name)) arr.push(name);
    map.set(key, arr);
  }
  return map;
}

/** e.g. "י״ב", or "א׳ תשרי" on the 1st of a Hebrew month */
export function hebrewDayLabel(date: Date): string {
  const hd = new HDate(date);
  if (hd.getDate() === 1) return "א׳ " + monthFmt.format(date);
  return hd.renderGematriya(true).split(" ")[0];
}

/** e.g. "כ״ה אלול" — Intl form keeps two-word months (אדר ב׳) intact */
const dayMonthFmt = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
  day: "numeric",
  month: "long",
});
export function hebrewDateShort(ts: number): string {
  return dayMonthFmt.format(new Date(ts));
}

/** e.g. "תשרי תשפ״ו" — pairs with the Gregorian month label */
const monthYearFmt = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
  month: "long",
  year: "numeric",
});
export function hebrewMonthYear(date: Date): string {
  return monthYearFmt.format(date);
}

/** holiday names for a single Gregorian day, [] when none */
export function dayHolidays(date: Date): string[] {
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
  return holidaysForRange(date, end).get(dayKey(date.getTime())) ?? [];
}

/** first weekday after the current/next chag run ends (incl. chol hamoed);
 *  lands on Sunday when it would fall on Shabbat. null if no chag within 60d */
export function afterNextChag(from: Date): Date | null {
  const end = new Date(from);
  end.setDate(end.getDate() + 60);
  const events = HebrewCalendar.calendar({ start: from, end, il: true, sedrot: false, omer: false });
  const chag = new Set<number>(); // day-start timestamps
  for (const ev of events) {
    if (ev.getFlags() & (flags.CHAG | flags.CHOL_HAMOED)) {
      const g = ev.getDate().greg();
      chag.add(new Date(g.getFullYear(), g.getMonth(), g.getDate()).getTime());
    }
  }
  const today0 = new Date(from).setHours(0, 0, 0, 0);
  const first = [...chag].filter((t) => t >= today0).sort((a, b) => a - b)[0];
  if (first === undefined) return null;
  let d = first;
  while (chag.has(d)) d += DAY;
  const out = new Date(d);
  if (out.getDay() === 6) out.setDate(out.getDate() + 1);
  return out;
}
