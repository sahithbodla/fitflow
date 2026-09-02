import "server-only";
import { cache } from "react";
import { connectToDatabase } from "@/lib/db";
import { COLLECTIONS } from "@/lib/collections";
import {
  startOfDayFromToday,
  startOfMonth,
  startOfNextMonth,
  startOfToday,
} from "@/lib/dates";

/**
 * Dashboard metrics.
 *
 * These are real `countDocuments` queries, not placeholders. The collections
 * they read are created by later phases; until then MongoDB reports 0 for a
 * missing collection, which is the truthful answer — there genuinely are no
 * leads or memberships yet. Each count becomes meaningful the moment its
 * feature ships, with no change needed here.
 */
export type DashboardMetrics = {
  newLeads: number;
  followUpsDue: number;
  activeGymMemberships: number;
  activePtMemberships: number;
  expiringSoon: number;
  expired: number;
  activeCoachingClients: number;
  checkInsThisWeek: number;
  paymentsThisMonth: number;
  /** True when the database could not be reached; the UI shows an error state. */
  degraded: boolean;
};

const EMPTY_METRICS: DashboardMetrics = {
  newLeads: 0,
  followUpsDue: 0,
  activeGymMemberships: 0,
  activePtMemberships: 0,
  expiringSoon: 0,
  expired: 0,
  activeCoachingClients: 0,
  checkInsThisWeek: 0,
  paymentsThisMonth: 0,
  degraded: false,
};

export const getDashboardMetrics = cache(
  async (timeZone: string): Promise<DashboardMetrics> => {
    try {
      const conn = await connectToDatabase();
      const db = conn.connection.db;
      if (!db) return { ...EMPTY_METRICS, degraded: true };

      const now = new Date();
      const todayStart = startOfToday(timeZone, now);
      const tomorrowStart = startOfDayFromToday(timeZone, 1, now);
      const inSevenDays = startOfDayFromToday(timeZone, 8, now);
      const sevenDaysAgo = startOfDayFromToday(timeZone, -7, now);
      const monthStart = startOfMonth(timeZone, now);
      const nextMonthStart = startOfNextMonth(timeZone, now);

      const count = (name: string, filter: Record<string, unknown>) =>
        db.collection(name).countDocuments(filter);

      const [
        newLeads,
        followUpsDue,
        activeGymMemberships,
        activePtMemberships,
        expiringSoon,
        expired,
        activeCoachingClients,
        checkInsThisWeek,
        paymentsThisMonth,
      ] = await Promise.all([
        count(COLLECTIONS.leads, { status: "new" }),

        // Anything due today or overdue that has not already been resolved.
        count(COLLECTIONS.leads, {
          followUpDate: { $lt: tomorrowStart },
          status: { $nin: ["converted", "lost"] },
        }),

        // A membership that has not started yet is not active today, so the
        // start date is checked as well as the expiry.
        count(COLLECTIONS.memberships, {
          category: "gym",
          status: "active",
          startDate: { $lt: tomorrowStart },
          expiryDate: { $gte: todayStart },
        }),

        count(COLLECTIONS.memberships, {
          category: "personal_training",
          status: "active",
          startDate: { $lt: tomorrowStart },
          expiryDate: { $gte: todayStart },
        }),

        count(COLLECTIONS.memberships, {
          status: "active",
          startDate: { $lt: tomorrowStart },
          expiryDate: { $gte: todayStart, $lt: inSevenDays },
        }),

        count(COLLECTIONS.memberships, {
          status: { $in: ["active", "expired"] },
          expiryDate: { $lt: todayStart },
        }),

        count(COLLECTIONS.coachingClients, { status: "active" }),

        count(COLLECTIONS.checkIns, {
          checkInDate: { $gte: sevenDaysAgo, $lt: tomorrowStart },
        }),

        count(COLLECTIONS.payments, {
          paymentDate: { $gte: monthStart, $lt: nextMonthStart },
        }),
      ]);

      return {
        newLeads,
        followUpsDue,
        activeGymMemberships,
        activePtMemberships,
        expiringSoon,
        expired,
        activeCoachingClients,
        checkInsThisWeek,
        paymentsThisMonth,
        degraded: false,
      };
    } catch {
      return { ...EMPTY_METRICS, degraded: true };
    }
  },
);

/** True when nothing at all has been entered yet — drives the onboarding view. */
export function isFreshInstall(metrics: DashboardMetrics): boolean {
  return (
    metrics.newLeads === 0 &&
    metrics.followUpsDue === 0 &&
    metrics.activeGymMemberships === 0 &&
    metrics.activePtMemberships === 0 &&
    metrics.expiringSoon === 0 &&
    metrics.expired === 0 &&
    metrics.activeCoachingClients === 0 &&
    metrics.checkInsThisWeek === 0 &&
    metrics.paymentsThisMonth === 0
  );
}
