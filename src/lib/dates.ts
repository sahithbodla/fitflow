/**
 * Timezone-aware date helpers.
 *
 * The business operates in one timezone (BusinessSettings.timezone) but the
 * server may run anywhere and MongoDB stores UTC instants. "Today", "due" and
 * "expiring in 7 days" must all be evaluated against the *business* day, not
 * the server day, or a gym in Asia/Kolkata sees follow-ups flip over at 5:30am.
 *
 * Implemented with Intl rather than a date library to keep the dependency
 * surface small. All functions return real UTC `Date` instants.
 */

export const DEFAULT_TIMEZONE = "Asia/Kolkata";

/** Milliseconds to add to a UTC instant to get the wall-clock time in `timeZone`. */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts: Record<string, string> = {};
  for (const part of formatter.formatToParts(instant)) {
    if (part.type !== "literal") parts[part.type] = part.value;
  }

  const wallClockAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );

  return wallClockAsUtc - instant.getTime();
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

function safeZone(timeZone: string | undefined): string {
  if (!timeZone || !isValidTimeZone(timeZone)) return DEFAULT_TIMEZONE;
  return timeZone;
}

/** The calendar date in `timeZone` at `instant`, as {year, month (1-12), day}. */
export function zonedParts(
  instant: Date,
  timeZone: string,
): { year: number; month: number; day: number } {
  const zone = safeZone(timeZone);
  const shifted = new Date(instant.getTime() + zoneOffsetMs(instant, zone));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/**
 * The UTC instant of midnight at the start of the given calendar day in
 * `timeZone`. The offset is resolved twice so days that begin inside a DST
 * transition still land on the correct instant.
 */
export function zonedDayStart(
  year: number,
  month: number,
  day: number,
  timeZone: string,
): Date {
  const zone = safeZone(timeZone);
  const naive = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const firstGuess = new Date(naive - zoneOffsetMs(new Date(naive), zone));
  return new Date(naive - zoneOffsetMs(firstGuess, zone));
}

/** Start of today, in the business timezone. */
export function startOfToday(timeZone: string, now: Date = new Date()): Date {
  const { year, month, day } = zonedParts(now, timeZone);
  return zonedDayStart(year, month, day, timeZone);
}

/** Start of the day `days` after today, in the business timezone. */
export function startOfDayFromToday(
  timeZone: string,
  days: number,
  now: Date = new Date(),
): Date {
  const { year, month, day } = zonedParts(now, timeZone);
  return zonedDayStart(year, month, day + days, timeZone);
}

/** Start of the current calendar month, in the business timezone. */
export function startOfMonth(timeZone: string, now: Date = new Date()): Date {
  const { year, month } = zonedParts(now, timeZone);
  return zonedDayStart(year, month, 1, timeZone);
}

/** Start of next calendar month, in the business timezone. */
export function startOfNextMonth(timeZone: string, now: Date = new Date()): Date {
  const { year, month } = zonedParts(now, timeZone);
  return month === 12
    ? zonedDayStart(year + 1, 1, 1, timeZone)
    : zonedDayStart(year, month + 1, 1, timeZone);
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/**
 * Formats an instant as a date in the business timezone, e.g. "2 Sep 2026".
 *
 * Month names come from a fixed table rather than `Intl` month: "short",
 * because ICU renders September as "Sept" in some locales and Node builds —
 * which reads inconsistently beside "Jan"/"Feb" and could differ between a
 * developer machine and the deployed server.
 */
export function formatDate(
  value: Date | string | null | undefined,
  timeZone: string,
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  const { year, month, day } = zonedParts(date, timeZone);
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

/** Formats a date with the weekday, e.g. "Wed, 2 Sep 2026". */
export function formatDateWithWeekday(
  value: Date | string | null | undefined,
  timeZone: string,
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  const weekday = new Intl.DateTimeFormat("en-GB", {
    timeZone: safeZone(timeZone),
    weekday: "short",
  }).format(date);
  return `${weekday}, ${formatDate(date, timeZone)}`;
}

/** Formats an amount using the business currency, e.g. "₹1,500". */
export function formatCurrency(
  amount: number,
  currency: string,
  locale = "en-IN",
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${amount.toLocaleString()}`;
  }
}

/** Whole days from today until `value`, in the business timezone. Negative = past. */
export function daysUntil(
  value: Date | string,
  timeZone: string,
  now: Date = new Date(),
): number {
  const date = typeof value === "string" ? new Date(value) : value;
  const target = zonedParts(date, timeZone);
  const targetStart = zonedDayStart(
    target.year,
    target.month,
    target.day,
    timeZone,
  );
  const todayStart = startOfToday(timeZone, now);
  return Math.round(
    (targetStart.getTime() - todayStart.getTime()) / 86_400_000,
  );
}

/** "Today", "Tomorrow", "3 days ago", "In 5 days". */
export function relativeDayLabel(
  value: Date | string,
  timeZone: string,
  now: Date = new Date(),
): string {
  const diff = daysUntil(value, timeZone, now);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return `In ${diff} days`;
}
