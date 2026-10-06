/**
 * Local-calendar date helpers. Dates are stored as "YYYY-MM-DD" strings in the
 * user's local time zone so a workout planned for "today" stays on the same
 * calendar day regardless of when it is opened. Weeks start on Monday.
 */

export type ISODate = string;

/** 0 = Monday … 6 = Sunday */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const WEEKDAY_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

const pad = (n: number) => String(n).padStart(2, "0");

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISODate(s: ISODate): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0); // noon avoids DST edge cases
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now);
}

export function addDays(s: ISODate, days: number): ISODate {
  const d = fromISODate(s);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function weekdayOf(s: ISODate): Weekday {
  const js = fromISODate(s).getDay(); // 0 = Sunday
  return ((js + 6) % 7) as Weekday;
}

export function startOfWeek(s: ISODate): ISODate {
  return addDays(s, -weekdayOf(s));
}

export function weekDates(s: ISODate): ISODate[] {
  const start = startOfWeek(s);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Whole calendar days from a to b (b - a). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((fromISODate(b).getTime() - fromISODate(a).getTime()) / 86_400_000);
}

export function formatLongDate(s: ISODate): string {
  return fromISODate(s).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatShortDate(s: ISODate): string {
  return fromISODate(s).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function relativeDayLabel(s: ISODate, today: ISODate): string {
  const diff = daysBetween(today, s);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return WEEKDAY_LONG[weekdayOf(s)];
}

export function partOfDay(now: Date): "morning" | "afternoon" | "evening" {
  const h = now.getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
