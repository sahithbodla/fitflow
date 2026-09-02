import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { COLLECTIONS } from "@/lib/collections";
import { MEMBERSHIP_CATEGORIES } from "@/lib/memberships/constants";

/**
 * A reusable membership offering — "3 Month Gym", "12 PT Sessions".
 *
 * Duration and price are *defaults* that prefill the membership form. They are
 * never applied silently: every membership stores its own dates and price, so
 * changing a plan later cannot rewrite what an existing member actually bought.
 */
const membershipPlanSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: {
      type: String,
      required: true,
      enum: MEMBERSHIP_CATEGORIES,
      index: true,
    },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    /** Suggested length in days. Optional — some plans are session-based. */
    defaultDurationDays: { type: Number, min: 1, max: 3650, default: null },
    defaultPrice: { type: Number, min: 0, max: 10_000_000, default: null },
    active: { type: Boolean, required: true, default: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: COLLECTIONS.membershipPlans },
);

membershipPlanSchema.index({ category: 1, active: 1, name: 1 });

export type MembershipPlanDoc = InferSchemaType<typeof membershipPlanSchema> & {
  _id: string;
};

export const MembershipPlan: Model<MembershipPlanDoc> =
  (models.MembershipPlan as Model<MembershipPlanDoc>) ??
  model<MembershipPlanDoc>("MembershipPlan", membershipPlanSchema);
