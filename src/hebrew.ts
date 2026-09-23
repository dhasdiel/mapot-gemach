import { HebrewCalendar, HDate, flags } from "@hebcal/core";

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

/** e.g. "כ״ה אלול" */
export function hebrewDateShort(ts: number): string {
  return new HDate(new Date(ts)).renderGematriya(true).split(" ").slice(0, 2).join(" ");
}
