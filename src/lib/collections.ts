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
  memberships: "memberships",
  membershipPlans: "membershipplans",
  payments: "paymentrecords",
  coachingClients: "coachingclients",
  checkIns: "weeklycheckins",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
