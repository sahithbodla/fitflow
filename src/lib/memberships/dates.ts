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

/**
 * Preset membership lengths offered in the form.
 *
 * "custom" means the coach sets the expiry date by hand; every other option
 * derives it from the start date.
 */
export const DURATION_PRESETS = [
  { value: "1", label: "1 month", months: 1 },
  { value: "3", label: "3 months", months: 3 },
  { value: "6", label: "6 months", months: 6 },
  { value: "12", label: "12 months", months: 12 },
] as const;

export const CUSTOM_DURATION = "custom";

export type DurationValue =
  | (typeof DURATION_PRESETS)[number]["value"]
  | typeof CUSTOM_DURATION;

function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * The last day covered by a membership of `months` starting on `startDate`.
 *
 * A membership is inclusive of both ends, so one month from 3 Sep runs to
 * 2 Oct — the day before the same date next month.
 *
 * When the start day does not exist in the target month the date is clamped to
 * that month's last day, and the day is NOT subtracted: one month from 31 Jan
 * ends on 28 Feb, not 27 Feb, which is what a member would expect.
 *
 * Pure `yyyy-mm-dd` string arithmetic, so it never touches timezones.
 */
export function expiryFromDuration(
  startDate: string,
  months: number,
): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(startDate);
  if (!match) return startDate;

  const startYear = Number(match[1]);
  const startMonth = Number(match[2]);
  const startDay = Number(match[3]);

  const totalMonths = startMonth - 1 + months;
  const targetYear = startYear + Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;

  const lastDay = daysInMonth(targetYear, targetMonth);
  const clamped = startDay > lastDay;
  const day = clamped ? lastDay : startDay;

  const target = new Date(Date.UTC(targetYear, targetMonth - 1, day));
  if (!clamped) target.setUTCDate(target.getUTCDate() - 1);

  return target.toISOString().slice(0, 10);
}

/**
 * Works out which preset an existing start/expiry pair corresponds to, so
 * editing a membership reopens with the right option selected.
 */
export function durationForRange(
  startDate: string,
  expiryDate: string,
): DurationValue {
  for (const preset of DURATION_PRESETS) {
    if (expiryFromDuration(startDate, preset.months) === expiryDate) {
      return preset.value;
    }
  }
  return CUSTOM_DURATION;
}
