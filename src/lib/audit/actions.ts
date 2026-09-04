/**
 * Every event the audit trail understands, grouped by the entity it describes.
 * Exactly the list from the logging prompt pack — resist adding more without
 * a real need, this is meant to stay a short, readable list.
 */
export const AUDIT_ACTIONS = [
  "LEAD_CREATED",
  "LEAD_UPDATED",
  "LEAD_STATUS_CHANGED",
  "LEAD_CONVERTED",

  "MEMBERSHIP_CREATED",
  "MEMBERSHIP_UPDATED",
  "MEMBERSHIP_RENEWED",
  "MEMBERSHIP_STATUS_CHANGED",

  "PAYMENT_CREATED",
  "PAYMENT_UPDATED",
  "PAYMENT_VOIDED",

  "COACHING_CLIENT_CREATED",
  "WORKOUT_ASSIGNED",
  "WORKOUT_UPDATED",
  "DIET_PLAN_CREATED",
  "DIET_PLAN_UPDATED",
  "CHECKIN_CREATED",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ENTITY_TYPES = [
  "lead",
  "membership",
  "payment",
  "coachingClient",
  "workoutPlan",
  "dietPlan",
  "checkIn",
] as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

/** Grouped for the audit log page's action filter. */
export const AUDIT_ACTION_GROUPS: { label: string; actions: AuditAction[] }[] = [
  { label: "Leads", actions: ["LEAD_CREATED", "LEAD_UPDATED", "LEAD_STATUS_CHANGED", "LEAD_CONVERTED"] },
  { label: "Memberships", actions: ["MEMBERSHIP_CREATED", "MEMBERSHIP_UPDATED", "MEMBERSHIP_RENEWED", "MEMBERSHIP_STATUS_CHANGED"] },
  { label: "Payments", actions: ["PAYMENT_CREATED", "PAYMENT_UPDATED", "PAYMENT_VOIDED"] },
  { label: "Coaching", actions: ["COACHING_CLIENT_CREATED", "WORKOUT_ASSIGNED", "WORKOUT_UPDATED", "DIET_PLAN_CREATED", "DIET_PLAN_UPDATED", "CHECKIN_CREATED"] },
];
