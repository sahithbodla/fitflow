import { daysUntil } from "@/lib/dates";
import {
  EXPIRING_SOON_DAYS,
  type EffectiveStatus,
  type MembershipStatus,
} from "@/lib/memberships/constants";

/**
 * What a membership actually is today.
 *
 * Derived rather than stored so a membership becomes "expired" the moment the
 * business day rolls over, with no scheduled job and no risk of stale rows.
 * A cancelled membership stays cancelled regardless of its dates.
 */
export function effectiveStatus(
  membership: {
    status: MembershipStatus;
    startDate: string | Date;
    expiryDate: string | Date;
  },
  timeZone: string,
  now: Date = new Date(),
): EffectiveStatus {
  // Ending early is a decision about the membership, so it wins over the
  // dates — a terminated membership is not "active" just because today falls
  // inside its period.
  if (membership.status === "cancelled") return "cancelled";
  if (membership.status === "terminated") return "terminated";

  const daysToExpiry = daysUntil(membership.expiryDate, timeZone, now);
  if (daysToExpiry < 0) return "expired";

  const daysToStart = daysUntil(membership.startDate, timeZone, now);
  if (daysToStart > 0) return "upcoming";

  return daysToExpiry <= EXPIRING_SOON_DAYS ? "expiring_soon" : "active";
}

/** True when the membership can be used today. */
export function isCurrentlyActive(status: EffectiveStatus): boolean {
  return status === "active" || status === "expiring_soon";
}
