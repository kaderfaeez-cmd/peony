import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getISOWeek,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { DayKey, Repeat } from "@/types";

export const DAY_FORMAT = "yyyy-MM-dd";

export const toKey = (date: Date): DayKey => format(date, DAY_FORMAT);

export const fromKey = (key: DayKey): Date => parseISO(key);

export const todayKey = (): DayKey => toKey(new Date());

export const monthKey = (date: Date): string => format(date, "yyyy-MM");

export const weekKey = (date: Date): string =>
  `${format(date, "yyyy")}-W${String(getISOWeek(date)).padStart(2, "0")}`;

export function weekStart(date: Date, mondayFirst: boolean): Date {
  return startOfWeek(date, { weekStartsOn: mondayFirst ? 1 : 0 });
}

export function weekDays(date: Date, mondayFirst: boolean): Date[] {
  const start = weekStart(date, mondayFirst);
  return eachDayOfInterval({ start, end: addDays(start, 6) });
}

/** Six-row calendar grid so the month view never changes height mid-year. */
export function monthGrid(date: Date, mondayFirst: boolean): Date[] {
  const weekStartsOn = mondayFirst ? 1 : 0;
  const start = startOfWeek(startOfMonth(date), { weekStartsOn });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn });
  const days = eachDayOfInterval({ start, end });
  while (days.length < 42) days.push(addDays(days[days.length - 1], 1));
  return days.slice(0, 42);
}

export function nextOccurrence(key: DayKey, repeat: Repeat): DayKey | null {
  const date = fromKey(key);
  switch (repeat) {
    case "daily":
      return toKey(addDays(date, 1));
    case "weekdays": {
      let next = addDays(date, 1);
      while (next.getDay() === 0 || next.getDay() === 6) next = addDays(next, 1);
      return toKey(next);
    }
    case "weekly":
      return toKey(addWeeks(date, 1));
    case "monthly":
      return toKey(addMonths(date, 1));
    case "yearly":
      return toKey(addYears(date, 1));
    default:
      return null;
  }
}

/** "Today", "Tomorrow", "Sat 8 Aug" — never a raw ISO string in the UI. */
export function friendlyDay(key: DayKey, now = new Date()): string {
  const date = fromKey(key);
  if (isSameDay(date, now)) return "Today";
  if (isSameDay(date, addDays(now, 1))) return "Tomorrow";
  if (isSameDay(date, addDays(now, -1))) return "Yesterday";
  return format(date, "EEE d MMM");
}

export function friendlyTime(time: string | null): string | null {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours)) return null;
  const period = hours < 12 ? "am" : "pm";
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  return minutes ? `${hour}:${String(minutes).padStart(2, "0")}${period}` : `${hour}${period}`;
}

export const partOfDay = (date = new Date()) =>
  date.getHours() < 12 ? "morning" : date.getHours() < 17 ? "afternoon" : "evening";

export { addDays, addMonths, format, isSameDay, startOfMonth };
