/** Shared vocabulary for membership plans, memberships and payments. */

export const MEMBERSHIP_CATEGORIES = ["gym", "personal_training"] as const;
export type MembershipCategory = (typeof MEMBERSHIP_CATEGORIES)[number];

export const MEMBERSHIP_CATEGORY_LABELS: Record<MembershipCategory, string> = {
  gym: "Gym membership",
  personal_training: "Personal training",
};

export const MEMBERSHIP_CATEGORY_SHORT: Record<MembershipCategory, string> = {
  gym: "Gym",
  personal_training: "PT",
};

/**
 * Stored status.
 *
 * Only `cancelled` is a decision a person makes; `active` and `expired` are
 * mostly bookkeeping. Whether a membership is *currently* usable is derived
 * from its dates (see `effectiveStatus`) so no scheduled job is needed to flip
 * rows over at midnight.
 */
export const MEMBERSHIP_STATUSES = ["active", "expired", "cancelled"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  active: "Active",
  expired: "Expired",
  cancelled: "Cancelled",
};

/** What the UI actually shows, computed from stored status plus today's date. */
export const EFFECTIVE_STATUSES = [
  "upcoming",
  "active",
  "expiring_soon",
  "expired",
  "cancelled",
] as const;
export type EffectiveStatus = (typeof EFFECTIVE_STATUSES)[number];

export const EFFECTIVE_STATUS_LABELS: Record<EffectiveStatus, string> = {
  upcoming: "Starts later",
  active: "Active",
  expiring_soon: "Expiring soon",
  expired: "Expired",
  cancelled: "Cancelled",
};

export const EFFECTIVE_STATUS_CLASSES: Record<EffectiveStatus, string> = {
  upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  active:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  expiring_soon:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  expired: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  cancelled:
    "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

/** A membership within this many days of expiry is flagged for renewal. */
export const EXPIRING_SOON_DAYS = 7;

export const PAYMENT_METHODS = [
  "cash",
  "upi",
  "card",
  "bank_transfer",
  "other",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank_transfer: "Bank transfer",
  other: "Other",
};

export const PAYMENT_STATUSES = ["paid", "pending", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  refunded: "Refunded",
};

export const PAYMENT_STATUS_CLASSES: Record<PaymentStatus, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  refunded:
    "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};
