import {
  Schema,
  Types,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { COLLECTIONS } from "@/lib/collections";

/**
 * A customer of the business.
 *
 * Created when a lead converts, or directly for a walk-in. Identity lives here
 * once: memberships, coaching and payments all reference a Person rather than
 * copying name and phone around. The originating Lead is kept and linked, so
 * source and enquiry history survive conversion.
 */
const personSchema = new Schema(
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
    notes: { type: String, trim: true, maxlength: 2000, default: "" },
    /** The enquiry this customer came from, when there was one. */
    sourceLeadId: {
      type: Types.ObjectId,
      ref: "Lead",
      default: null,
      index: true,
    },
    /** How the business first acquired them, copied from the lead at conversion. */
    origin: {
      type: String,
      required: true,
      enum: ["lead_conversion", "direct"],
      default: "direct",
    },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: COLLECTIONS.people },
);

personSchema.index({ name: 1 });
personSchema.index({ createdAt: -1 });
personSchema.index({ email: 1 });

export type PersonDoc = InferSchemaType<typeof personSchema> & { _id: string };

export const Person: Model<PersonDoc> =
  (models.Person as Model<PersonDoc>) ??
  model<PersonDoc>("Person", personSchema);
