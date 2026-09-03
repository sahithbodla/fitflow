import {
  Schema,
  Types,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { COLLECTIONS } from "@/lib/collections";
import {
  MEMBERSHIP_CATEGORIES,
  MEMBERSHIP_STATUSES,
} from "@/lib/memberships/constants";

/**
 * One purchased membership period.
 *
 * Every field that describes what was bought is stored on the row itself,
 * including `planName` and `price`. A plan being renamed, repriced or
 * deactivated must never change the historical record of what a member paid.
 *
 * Renewal creates a *new* row linked by `renewedFrom` rather than editing the
 * old one, so the purchase/start/expiry dates of past periods are never
 * overwritten and the timeline stays intact.
 */
const membershipSchema = new Schema(
  {
    person: {
      type: Types.ObjectId,
      ref: "Person",
      required: true,
      index: true,
    },
    plan: { type: Types.ObjectId, ref: "MembershipPlan", default: null },
    /** Snapshot of the plan name at purchase time. */
    planName: { type: String, required: true, trim: true, maxlength: 120 },
    category: {
      type: String,
      required: true,
      enum: MEMBERSHIP_CATEGORIES,
      index: true,
    },
    /** When the member paid/committed. Independent of when access begins. */
    purchaseDate: { type: Date, required: true },
    /** Access begins. Set explicitly — never derived from purchaseDate. */
    startDate: { type: Date, required: true },
    /** Access ends. Set explicitly — never derived from startDate. */
    expiryDate: { type: Date, required: true, index: true },
    price: { type: Number, min: 0, max: 10_000_000, default: null },
    status: {
      type: String,
      required: true,
      enum: MEMBERSHIP_STATUSES,
      default: "active",
      index: true,
    },
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    /** The membership this one renews, forming the history chain. */
    renewedFrom: { type: Types.ObjectId, ref: "Membership", default: null },
    /** Set when a membership is cancelled or terminated early. */
    cancelledAt: { type: Date, default: null },
    cancelledReason: { type: String, trim: true, maxlength: 500, default: "" },
    endedBy: { type: String, trim: true, maxlength: 120, default: "" },
    createdBy: { type: String, trim: true, maxlength: 120, default: "" },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: COLLECTIONS.memberships },
);

// The dashboard's active/expiring/expired counts.
membershipSchema.index({ status: 1, expiryDate: 1 });
membershipSchema.index({ category: 1, status: 1, expiryDate: 1 });
// A person's membership timeline.
membershipSchema.index({ person: 1, startDate: -1 });
membershipSchema.index({ renewedFrom: 1 });

export type MembershipDoc = InferSchemaType<typeof membershipSchema> & {
  _id: string;
};

export const Membership: Model<MembershipDoc> =
  (models.Membership as Model<MembershipDoc>) ??
  model<MembershipDoc>("Membership", membershipSchema);
