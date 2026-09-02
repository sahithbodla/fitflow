import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { COLLECTIONS } from "@/lib/collections";
import {
  ACTIVITY_TYPES,
  LEAD_INTERESTS,
  LEAD_SOURCES,
  LEAD_STATUSES,
} from "@/lib/leads/constants";

/**
 * One entry in a lead's timeline. Notes and every meaningful change land here,
 * so the history of how a lead was worked is never lost.
 */
const activitySchema = new Schema(
  {
    type: { type: String, required: true, enum: ACTIVITY_TYPES },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    /** Display name of the staff member, or "Public form" for self-service. */
    actor: { type: String, required: true, trim: true, maxlength: 120 },
    createdAt: { type: Date, required: true, default: () => new Date() },
  },
  { _id: true },
);

const leadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    /** Digits-only form used for duplicate detection. See lib/leads/phone.ts. */
    phoneNormalized: { type: String, required: true, trim: true, index: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 200,
      default: "",
    },
    instagramHandle: { type: String, trim: true, maxlength: 60, default: "" },
    fitnessGoal: { type: String, trim: true, maxlength: 1000, default: "" },
    interestedIn: { type: String, required: true, enum: LEAD_INTERESTS },
    source: {
      type: String,
      required: true,
      enum: LEAD_SOURCES,
      default: "manual",
    },
    status: {
      type: String,
      required: true,
      enum: LEAD_STATUSES,
      default: "new",
      index: true,
    },
    followUpDate: { type: Date, default: null },
    activity: { type: [activitySchema], default: [] },
    /**
     * Set when the lead is converted in a later phase. Kept here (rather than
     * deleting the lead) so source and history survive conversion.
     */
    convertedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: COLLECTIONS.leads },
);

// Board/list views filter by status and sort by recency.
leadSchema.index({ status: 1, createdAt: -1 });
// The "follow-ups due" query on the dashboard and the leads list.
leadSchema.index({ followUpDate: 1, status: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ email: 1 });

export type LeadDoc = InferSchemaType<typeof leadSchema> & { _id: string };

export const Lead: Model<LeadDoc> =
  (models.Lead as Model<LeadDoc>) ?? model<LeadDoc>("Lead", leadSchema);
