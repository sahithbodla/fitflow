import { zonedParts } from "@/lib/dates";

/** Formats an instant as the `yyyy-mm-dd` a date input expects. */
export function toDateInputValue(
  value: string | Date | null | undefined,
  timeZone: string,
): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const { year, month, day } = zonedParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Today as `yyyy-mm-dd` in the business timezone. */
export function todayInputValue(timeZone: string): string {
  return toDateInputValue(new Date(), timeZone);
}

/** Adds days to a `yyyy-mm-dd` string. */
export function addDaysToInputValue(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
