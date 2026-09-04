/**
 * Canonical MongoDB collection names.
 *
 * The dashboard counts documents in collections whose Mongoose models are
 * introduced in later phases. Keeping the names in one place means the models
 * added later must bind to exactly these collections (via the schema's
 * `collection` option), so the dashboard queries never silently drift.
 */
export const COLLECTIONS = {
  users: "users",
  businessSettings: "businesssettings",
  leads: "leads",
  people: "people",
  conversions: "conversions",
  memberships: "memberships",
  membershipPlans: "membershipplans",
  payments: "paymentrecords",
  coachingClients: "coachingclients",
  checkIns: "weeklycheckins",
  exercises: "exercises",
  workoutTemplates: "workouttemplates",
  clientWorkoutPlans: "clientworkoutplans",
  dietPlans: "dietplans",
  auditLogs: "auditlogs",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
