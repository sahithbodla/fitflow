import { daysUntil } from "@/lib/dates";
import { EXPIRING_SOON_DAYS } from "@/lib/memberships/constants";
import type { CoachingStatus } from "@/lib/people/constants";

export type EffectiveCoachingStatus =
  | "active"
  | "expiring_soon"
  | "expired"
  | "paused"
  | "ended";

/**
 * What an online coaching engagement actually is today — mirrors
 * `effectiveStatus()` for memberships, using `endDate` the same way a
 * membership uses `expiryDate`.
 *
 * `endDate` is optional on a coaching engagement (many are open-ended), so
 * one with no end date is simply "active" and never expires on its own —
 * only `status` can end it.
 */
export function effectiveCoachingStatus(
  client: { status: CoachingStatus; endDate: string | Date | null },
  timeZone: string,
  now: Date = new Date(),
): EffectiveCoachingStatus {
  if (client.status === "paused") return "paused";
  if (client.status === "ended") return "ended";
  if (!client.endDate) return "active";

  const daysToEnd = daysUntil(client.endDate, timeZone, now);
  if (daysToEnd < 0) return "expired";
  return daysToEnd <= EXPIRING_SOON_DAYS ? "expiring_soon" : "active";
}
